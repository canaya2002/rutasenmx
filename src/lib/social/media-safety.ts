/**
 * Server-side media safety pipeline for user-uploaded images.
 *
 * What it does:
 *   1. Sniffs magic bytes — never trusts the client-sent Content-Type.
 *   2. Enforces size + dimension bounds.
 *   3. Strips EXIF (so GPS / camera data does not leak).
 *   4. Re-encodes to a canonical format (JPEG, quality 82).
 *   5. Computes SHA-256 fingerprint for dedupe + abuse reports.
 *   6. Compares hash against an in-memory blocklist (grows from reports).
 *   7. Optional external moderation via `MEDIA_MODERATION_PROVIDER` env.
 *
 * Result: a clean Buffer + key suggestion ready to upload to S3.
 */

import { createHash } from 'node:crypto';
import sharp from 'sharp';

export type AllowedMime = 'image/jpeg' | 'image/png' | 'image/webp';

export interface MediaValidationInput {
  buffer: Buffer;
  /** Client-declared MIME — used only as a hint, never trusted. */
  declaredMime?: string;
}

export interface CleanedMedia {
  buffer: Buffer;
  /** Canonical MIME of the re-encoded output (always `image/jpeg`). */
  mime: 'image/jpeg';
  width: number;
  height: number;
  size: number;
  sha256: string;
}

export interface MediaSafetyLimits {
  maxBytes: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
}

export const DEFAULT_MEDIA_LIMITS: MediaSafetyLimits = {
  maxBytes: 8 * 1024 * 1024, // 8MB pre-compress
  minWidth: 120,
  maxWidth: 5000,
  minHeight: 120,
  maxHeight: 5000,
};

const IMAGE_MAGIC: Array<[Buffer, AllowedMime]> = [
  [Buffer.from([0xff, 0xd8, 0xff]), 'image/jpeg'],
  [Buffer.from([0x89, 0x50, 0x4e, 0x47]), 'image/png'],
  [Buffer.from([0x52, 0x49, 0x46, 0x46]), 'image/webp'], // "RIFF" (WebP container)
];

/** Inspects magic bytes; returns null if unrecognised or not an image. */
function detectMime(buffer: Buffer): AllowedMime | null {
  for (const [magic, mime] of IMAGE_MAGIC) {
    if (buffer.length >= magic.length) {
      let match = true;
      for (let i = 0; i < magic.length; i++) {
        if (buffer[i] !== magic[i]) {
          match = false;
          break;
        }
      }
      if (match) {
        // WebP: RIFF header is shared with other formats; verify "WEBP" at offset 8.
        if (mime === 'image/webp') {
          const webp = buffer.slice(8, 12).toString('ascii');
          if (webp !== 'WEBP') return null;
        }
        return mime;
      }
    }
  }
  return null;
}

// ── SHA-256 blocklist (in-memory; feed from admin reports) ──────────────────
const BLOCKED_HASHES = new Set<string>();
export function blockImageHash(hash: string): void {
  BLOCKED_HASHES.add(hash);
}

export class MediaSafetyError extends Error {
  public code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'MediaSafetyError';
    this.code = code;
  }
}

/**
 * Runs the full pipeline on a raw buffer and returns a cleaned,
 * re-encoded image ready for storage. Throws on any violation.
 */
export async function validateAndCleanImage(
  input: MediaValidationInput,
  limits: MediaSafetyLimits = DEFAULT_MEDIA_LIMITS,
): Promise<CleanedMedia> {
  const { buffer } = input;

  if (!buffer || buffer.length === 0) {
    throw new MediaSafetyError('empty', 'Archivo vacío');
  }
  if (buffer.length > limits.maxBytes) {
    throw new MediaSafetyError(
      'too_large',
      `El archivo supera el máximo permitido (${Math.round(limits.maxBytes / 1024 / 1024)} MB)`,
    );
  }

  const detected = detectMime(buffer);
  if (!detected) {
    throw new MediaSafetyError(
      'bad_mime',
      'Formato no permitido. Usa JPEG, PNG o WebP',
    );
  }

  // Dimensions via sharp
  let width = 0;
  let height = 0;
  try {
    const meta = await sharp(buffer, { failOn: 'error' }).metadata();
    width = meta.width ?? 0;
    height = meta.height ?? 0;
  } catch {
    throw new MediaSafetyError('corrupt', 'La imagen está corrupta');
  }

  if (width < limits.minWidth || height < limits.minHeight) {
    throw new MediaSafetyError(
      'too_small',
      `La imagen es muy pequeña (mín ${limits.minWidth}×${limits.minHeight}px)`,
    );
  }
  if (width > limits.maxWidth || height > limits.maxHeight) {
    throw new MediaSafetyError(
      'too_big_dims',
      `La imagen es muy grande (máx ${limits.maxWidth}×${limits.maxHeight}px)`,
    );
  }

  // Hash raw bytes for dedupe + blocklist
  const sha256 = createHash('sha256').update(buffer).digest('hex');
  if (BLOCKED_HASHES.has(sha256)) {
    throw new MediaSafetyError(
      'blocked_hash',
      'Esta imagen fue reportada y no está permitida',
    );
  }

  // Re-encode: strip EXIF/ICC, normalise orientation, cap largest side
  const MAX_SIDE = 2000;
  const cleanedBuffer = await sharp(buffer, { failOn: 'error' })
    .rotate() // auto-orient from EXIF, then drop EXIF
    .resize({
      width: MAX_SIDE,
      height: MAX_SIDE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  const finalMeta = await sharp(cleanedBuffer).metadata();

  // Optional external moderation hook (off by default)
  await maybeCallExternalModerator(cleanedBuffer, sha256);

  return {
    buffer: cleanedBuffer,
    mime: 'image/jpeg',
    width: finalMeta.width ?? width,
    height: finalMeta.height ?? height,
    size: cleanedBuffer.length,
    sha256,
  };
}

/**
 * If a `MEDIA_MODERATION_PROVIDER` is configured, call it and throw on reject.
 * Defaults to noop when unset so the feature ships cheaply.
 */
async function maybeCallExternalModerator(
  buffer: Buffer,
  sha256: string,
): Promise<void> {
  const provider = (process.env.MEDIA_MODERATION_PROVIDER ?? '').toLowerCase();
  if (!provider || provider === 'none') return;

  if (provider === 'sightengine') {
    const user = process.env.SIGHTENGINE_USER;
    const secret = process.env.SIGHTENGINE_SECRET;
    if (!user || !secret) return;

    const form = new FormData();
    form.append(
      'media',
      new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' }),
      `${sha256}.jpg`,
    );
    form.append('models', 'nudity-2.0,weapon,gore,offensive');
    form.append('api_user', user);
    form.append('api_secret', secret);

    const res = await fetch('https://api.sightengine.com/1.0/check.json', {
      method: 'POST',
      body: form,
    });
    if (!res.ok) return; // fail-open if provider is down

    const data = (await res.json()) as {
      nudity?: { sexual_activity?: number; sexual_display?: number };
      weapon?: number;
      gore?: number;
      offensive?: { prob?: number };
    };
    const nudity = Math.max(
      data.nudity?.sexual_activity ?? 0,
      data.nudity?.sexual_display ?? 0,
    );
    if (nudity > 0.4) {
      BLOCKED_HASHES.add(sha256);
      throw new MediaSafetyError('nsfw', 'Imagen no permitida');
    }
    if ((data.weapon ?? 0) > 0.5 || (data.gore ?? 0) > 0.5) {
      BLOCKED_HASHES.add(sha256);
      throw new MediaSafetyError('violence', 'Imagen no permitida');
    }
    if ((data.offensive?.prob ?? 0) > 0.5) {
      BLOCKED_HASHES.add(sha256);
      throw new MediaSafetyError('offensive', 'Imagen no permitida');
    }
  }
  // Add other providers (Cloudflare Images, AWS Rekognition) here.
}
