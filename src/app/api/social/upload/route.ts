import { type NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

import { getStorage } from '@/lib/providers/storage';
import {
  validateAndCleanImage,
  MediaSafetyError,
} from '@/lib/social/media-safety';
import {
  enforceRateLimit,
  RateLimitError,
} from '@/lib/social/rate-limit';
import { requireSocialAccess, isGuardError } from '@/lib/social/guards';
import { recordUpload } from '@/lib/social/communities';

export const runtime = 'nodejs'; // sharp needs Node runtime

export async function POST(request: NextRequest) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  try {
    enforceRateLimit('upload', sessionOrError.userId);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: err.message, retryAfter: err.retryAfterSeconds },
        { status: 429 },
      );
    }
    throw err;
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json(
      { error: 'Formato esperado: multipart/form-data' },
      { status: 400 },
    );
  }

  let file: File | null = null;
  let scope: string;
  try {
    const form = await request.formData();
    const f = form.get('file');
    if (f instanceof File) file = f;
    const s = form.get('scope');
    scope = typeof s === 'string' && ['avatar', 'post'].includes(s) ? s : 'post';
  } catch {
    return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 });
  }

  // Hard cap — reject oversized uploads before buffering fully.
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'El archivo supera 10 MB' },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let cleaned;
  try {
    cleaned = await validateAndCleanImage({
      buffer,
      declaredMime: file.type,
    });
  } catch (err) {
    if (err instanceof MediaSafetyError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    }
    console.error('[upload] pipeline error', err);
    return NextResponse.json({ error: 'Error al procesar la imagen' }, { status: 500 });
  }

  // Storage key: never trust user-provided filenames
  const folder = scope === 'avatar' ? 'social/avatars' : 'social/posts';
  const key = `${folder}/${sessionOrError.userId}/${randomUUID()}.jpg`;

  let url: string;
  try {
    const storage = getStorage();
    const result = await storage.upload({
      key,
      body: new Blob([new Uint8Array(cleaned.buffer)], { type: cleaned.mime }),
      contentType: cleaned.mime,
      acl: 'public-read',
      cacheControl: 'public, max-age=31536000, immutable',
    });
    url = result.url;
  } catch (err) {
    console.error('[upload] storage error', err);
    return NextResponse.json(
      { error: 'No se pudo guardar el archivo' },
      { status: 500 },
    );
  }

  try {
    await recordUpload({
      userId: sessionOrError.userId,
      url,
      mime: cleaned.mime,
      width: cleaned.width,
      height: cleaned.height,
      size: cleaned.size,
      sha256: cleaned.sha256,
      scope: (scope === 'avatar' ? 'avatar' : 'post') as 'avatar' | 'post',
    });
  } catch (err) {
    // Non-fatal: storage succeeded, audit row failed. Log and continue.
    console.error('[upload] recordUpload failed', err);
  }

  return NextResponse.json({
    url,
    width: cleaned.width,
    height: cleaned.height,
    size: cleaned.size,
    sha256: cleaned.sha256,
  });
}
