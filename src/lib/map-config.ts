/**
 * Map configuration: styles and static-image provider.
 *
 * Default uses OpenFreeMap (no API key, free, unlimited). Visually matches
 * the previous Mapbox `light-v11` / `streets-v12`. Override via env if
 * you prefer a paid provider (MapTiler, Stadia, etc.).
 */

export const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
  'https://tiles.openfreemap.org/styles/positron';

export const MAP_STYLE_URL_STREETS =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL_STREETS ??
  'https://tiles.openfreemap.org/styles/liberty';

/**
 * Static map image provider. Defaults to MapTiler (100k free/mo). If
 * `NEXT_PUBLIC_MAPTILER_KEY` is missing, falls back to a local
 * SVG placeholder (handled at the call site).
 */
export function buildStaticMapUrl(params: {
  lat: number;
  lng: number;
  zoom: number;
  width: number;
  height: number;
  pinColor?: string;
  style?: 'streets' | 'basic';
}): string | null {
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (!key) return null;

  const style = params.style === 'streets' ? 'streets-v2' : 'basic-v2';
  const pinColor = (params.pinColor ?? '06C167').replace('#', '');
  const marker = `${params.lng.toFixed(5)},${params.lat.toFixed(5)}`;
  return (
    `https://api.maptiler.com/maps/${style}/static/` +
    `${params.lng.toFixed(5)},${params.lat.toFixed(5)},${params.zoom}/` +
    `${params.width}x${params.height}@2x.png` +
    `?key=${key}&markers=${marker}|scale:1.5|color:%23${pinColor}`
  );
}
