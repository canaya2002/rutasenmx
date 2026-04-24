import { API_BASE_URL } from './constants';

/**
 * Resolves a (possibly relative) image path returned by the API to a fully
 * qualified URL the mobile client can load.
 *
 * The web serves `/images/...` from the Next public folder; mobile needs
 * `https://rutasenmx.com/images/...`. Absolute URLs pass through.
 */
export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = API_BASE_URL.replace(/\/+$/, '');
  const rel = path.startsWith('/') ? path : `/${path}`;
  return `${base}${rel}`;
}
