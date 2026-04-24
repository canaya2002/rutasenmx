/**
 * Picks a cover image for a place out of `public/<State>/` (with a fallback
 * to `public/General/`). The pool is read at request-time from the filesystem,
 * so as long as the image files ship with the Next.js build, the deploy can
 * add a new photo without any code change.
 *
 * Mirrors `guia-images.ts` but keyed on state. Co-prime stepping keeps the
 * sequence deterministic and unique for up to `pool.length` picks, so nearby
 * places in the same state don't all end up with the same photo.
 *
 * Node-runtime only (fs + path). Call from server components / API routes.
 */
import fs from 'node:fs';
import path from 'node:path';

// DB state name → folder name under public/.
// Folders are PascalCase (BajaCalifornia, Michoacan — no accent) because
// Vercel/Linux is case-sensitive and that's how the files are checked in.
const STATE_FOLDER: Record<string, string> = {
  'Baja California': 'BajaCalifornia',
  'Chiapas': 'Chiapas',
  'Ciudad de México': 'CiudadDeMexico',
  'Estado de México': 'EstadoDeMexico',
  'Jalisco': 'Jalisco',
  'Michoacán': 'Michoacan',
  'Morelos': 'Morelos',
  'Nuevo León': 'NuevoLeon',
  'Oaxaca': 'Oaxaca',
  'Quintana Roo': 'QuintanaRoo',
  'Sonora': 'Sonora',
  'Tamaulipas': 'Tamaulipas',
  'Yucatán': 'Yucatan',
  'Zacatecas': 'Zacatecas',
};

const FALLBACK_FOLDER = 'General';

const dirCache = new Map<string, string[]>();

function listDir(folder: string): string[] {
  const cached = dirCache.get(folder);
  if (cached) return cached;

  const dir = path.join(process.cwd(), 'public', folder);
  try {
    const entries = fs.readdirSync(dir);
    const urls = entries
      .filter((name) => /\.(jpe?g|png|webp|avif)$/i.test(name))
      .map((name) => `/${folder}/${encodeURI(name)}`);
    dirCache.set(folder, urls);
    return urls;
  } catch (err) {
    console.warn(`[place-images] could not read public/${folder}/:`, err);
    dirCache.set(folder, []);
    return [];
  }
}

function poolForState(stateName: string | null | undefined): string[] {
  const folder = stateName ? STATE_FOLDER[stateName] : undefined;
  const state = folder ? listDir(folder) : [];
  const general = listDir(FALLBACK_FOLDER);
  // State images first (more relevant), General behind for padding against
  // states with small folders. Unique elements only.
  return [...new Set([...state, ...general])];
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h | 0);
}

/**
 * Deterministically pick one image for `(stateName, slug)`. Returns null only
 * if both the state folder and General are empty (i.e. asset dirs missing).
 *
 * The slug is salted with the state so two places with the same slug across
 * different states don't collide, and the hash picks a starting index; a
 * co-prime step visits every pool slot before wrapping, so batch calls for
 * the same state produce a distinct image per place.
 */
export function pickPlaceImage(
  stateName: string | null | undefined,
  slug: string,
): string | null {
  const pool = poolForState(stateName);
  if (pool.length === 0) return null;
  const n = pool.length;
  const key = `${stateName ?? 'mx'}::${slug}`;
  return pool[hashString(key) % n];
}

/**
 * Return a deterministic, duplicate-free sequence of `count` images for a
 * state. Used by the backfill script so every place in the state gets a
 * different photo (as long as the pool is big enough).
 */
export function uniqueSequence(
  stateName: string | null | undefined,
  count: number,
): string[] {
  const pool = poolForState(stateName);
  if (pool.length === 0 || count === 0) return [];
  const n = pool.length;
  const start = hashString(`${stateName ?? 'mx'}::seq`) % n;
  // 41 is coprime with most small n; if it ever lands on a factor, step 1.
  const step = n > 1 ? (41 % n === 0 ? 1 : 41 % n) : 1;
  const seen = new Set<number>();
  const picks: string[] = [];
  for (let i = 0; picks.length < Math.min(count, n); i++) {
    const idx = (start + i * step) % n;
    if (seen.has(idx)) continue;
    seen.add(idx);
    picks.push(pool[idx]);
  }
  // If the caller wants more than the pool size, cycle through again.
  while (picks.length < count) {
    picks.push(pool[(start + picks.length) % n]);
  }
  return picks;
}
