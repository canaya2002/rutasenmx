/**
 * Reads the `public/guias/` folder at build/request time and exposes helpers
 * that assign a stable cover image to each guide slug.
 *
 * Requires the Node runtime (fs + path); call only from server components or
 * server actions, never from `'use client'` code.
 */
import fs from 'node:fs';
import path from 'node:path';

let cached: string[] | null = null;

// On-disk folder is `public/Guias` (capital G — matches other asset dirs like
// public/Chiapas, public/Oaxaca). Windows is case-insensitive so lowercase
// worked locally, but Vercel runs on Linux which is case-sensitive → lowercase
// returned an empty pool in production. Match the actual casing exactly.
const DIR_NAME = 'Guias';
const URL_PREFIX = `/${DIR_NAME}`;

function listGuiaImages(): string[] {
  if (cached) return cached;
  const dir = path.join(process.cwd(), 'public', DIR_NAME);
  try {
    const entries = fs.readdirSync(dir);
    cached = entries
      .filter((name) => /\.(jpe?g|png|webp|avif)$/i.test(name))
      // Next's image loader and the browser both handle the encoded form; this
      // covers filenames that contain spaces or `()` (e.g. Getty duplicates).
      .map((name) => `${URL_PREFIX}/${encodeURI(name)}`);
  } catch (err) {
    console.warn(`[guia-images] could not read public/${DIR_NAME}/:`, err);
    cached = [];
  }
  return cached;
}

/** Simple deterministic hash — same slug always picks the same image. */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h | 0);
}

/**
 * Returns a stable cover image path for a guide slug. Returns `null` if the
 * `public/guias/` folder is empty or missing.
 */
export function pickGuiaImage(slug: string, salt = ''): string | null {
  const images = listGuiaImages();
  if (images.length === 0) return null;
  return images[hashString(slug + salt) % images.length];
}

/**
 * Returns UNIQUE `count` images for a slug. Uses a co-prime step so it visits
 * every slot of the pool before wrapping, guaranteeing no duplicates for any
 * `count` ≤ `pool.length`.
 */
export function pickGuiaImages(slug: string, count: number): string[] {
  const images = listGuiaImages();
  if (images.length === 0) return [];
  const n = images.length;
  const start = hashString(slug) % n;
  const step = n > 1 ? 41 % n || 1 : 1;
  const seen = new Set<number>();
  const picks: string[] = [];
  for (let i = 0; picks.length < Math.min(count, n); i++) {
    const idx = (start + i * step) % n;
    if (seen.has(idx)) continue;
    seen.add(idx);
    picks.push(images[idx]);
  }
  return picks;
}

/**
 * Pick a hero image for a guide AND a set of unique secondary images (for an
 * inline gallery). Guarantees the hero is not repeated in the gallery.
 */
export function pickGuiaSet(slug: string, galleryCount: number): { hero: string | null; gallery: string[] } {
  const images = listGuiaImages();
  if (images.length === 0) return { hero: null, gallery: [] };
  const set = pickGuiaImages(slug, galleryCount + 1);
  return { hero: set[0] ?? null, gallery: set.slice(1) };
}

export function guiaImagePoolSize(): number {
  return listGuiaImages().length;
}

/**
 * Assigns a UNIQUE image to each slug in `slugs` (no repeats across the whole
 * list), as long as the pool is large enough. The global co-prime step is
 * seeded from the full slug list so the assignment is stable: re-deploying
 * without changing the guide catalog yields the same map.
 *
 * Falls back to cyclic reuse once the pool is exhausted — which should only
 * happen if someone deletes images from `public/Guias/`.
 */
export function assignUniqueGuiaImages(slugs: string[]): Map<string, string> {
  const out = new Map<string, string>();
  const pool = listGuiaImages();
  if (pool.length === 0) return out;

  const n = pool.length;
  // Sort so ordering is independent of the caller's input order — keeps the
  // assignment stable when the guide list is reshuffled client-side.
  const sorted = [...slugs].sort();
  const start = hashString(sorted.join('|')) % n;
  const step = n > 1 ? (41 % n === 0 ? 1 : 41 % n) : 1;

  const used = new Set<number>();
  let cursor = start;
  for (const slug of sorted) {
    if (used.size >= n) {
      // Pool exhausted — reuse deterministically based on the slug itself.
      out.set(slug, pool[hashString(slug) % n]);
      continue;
    }
    let idx = cursor;
    while (used.has(idx)) idx = (idx + 1) % n;
    used.add(idx);
    out.set(slug, pool[idx]);
    cursor = (cursor + step) % n;
  }
  return out;
}
