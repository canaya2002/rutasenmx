/**
 * Enumerates `/public/General/` and picks stable decorative images keyed by a
 * string (page slug, section id, etc.). Server-only.
 */
import fs from 'node:fs';
import path from 'node:path';

let cached: string[] | null = null;

function listGeneralImages(): string[] {
  if (cached) return cached;
  const dir = path.join(process.cwd(), 'public', 'General');
  try {
    cached = fs
      .readdirSync(dir)
      .filter((name) => /\.(jpe?g|png|webp|avif)$/i.test(name))
      .map((name) => `/General/${encodeURI(name)}`);
  } catch (err) {
    console.warn('[general-images] could not read /public/General:', err);
    cached = [];
  }
  return cached;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h | 0);
}

export function pickDecoration(key: string): string | null {
  const imgs = listGeneralImages();
  if (imgs.length === 0) return null;
  return imgs[hash(key) % imgs.length];
}

/**
 * Returns `count` UNIQUE decorative images for a key. Guaranteed no
 * duplicates up to `pool.length`. Uses a co-prime step to walk the pool.
 */
export function pickDecorations(key: string, count: number): string[] {
  const imgs = listGeneralImages();
  if (imgs.length === 0) return [];
  const n = imgs.length;
  const start = hash(key) % n;
  // Pick a step that is co-prime with the pool size — 37 is prime and unlikely
  // to share factors with common pool sizes, which guarantees a Hamiltonian
  // walk over the pool.
  const step = n > 1 ? 37 % n || 1 : 1;
  const seen = new Set<number>();
  const out: string[] = [];
  for (let i = 0; out.length < Math.min(count, n); i++) {
    const idx = (start + i * step) % n;
    if (seen.has(idx)) continue;
    seen.add(idx);
    out.push(imgs[idx]);
  }
  return out;
}

/**
 * Batch unique decorations for a page. Every label in `labels` gets its own
 * image, guaranteed distinct across the batch. Ideal for a page that has a
 * hero + multiple sections needing ornaments.
 */
export function pickDecorationBatch<const K extends string>(
  pageKey: string,
  labels: readonly K[],
): Record<K, string | null> {
  const images = pickDecorations(pageKey, labels.length);
  const out = {} as Record<K, string | null>;
  labels.forEach((label, i) => {
    out[label] = images[i] ?? null;
  });
  return out;
}

export function generalImagePoolSize(): number {
  return listGeneralImages().length;
}
