import Image from 'next/image';

export interface DensityStaticMapPoint {
  lat: number;
  lng: number;
}

export interface DensityStaticMapProps {
  /** The points to plot. We thin to `maxPoints` to stay under Mapbox's URL limit. */
  points: DensityStaticMapPoint[];
  alt: string;
  /** Pin colour without `#`. */
  pinColor?: string;
  /** Mapbox style id. Default streets-v12. */
  style?: string;
  width?: number;
  height?: number;
  /** Maximum number of markers to include. */
  maxPoints?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/** Evenly samples an array down to `max` items. */
function sample<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  const step = (arr.length - 1) / (max - 1);
  const out: T[] = [];
  for (let i = 0; i < max; i++) out.push(arr[Math.round(i * step)]);
  return out;
}

/**
 * Renders a Mapbox Static Images API PNG with small pins at every provided
 * point. Uses `/auto/` fit mode so the image always frames all visible pins.
 * A server component: no JS shipped.
 */
export function DensityStaticMap({
  points,
  alt,
  pinColor = '06C167',
  style = 'mapbox/streets-v12',
  width = 1200,
  height = 600,
  maxPoints = 40,
  className = '',
  sizes = '(max-width: 1024px) 100vw, 1200px',
  priority = false,
}: DensityStaticMapProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const valid = points.filter(
    (p) =>
      Number.isFinite(p.lat) &&
      Number.isFinite(p.lng) &&
      p.lat >= 14.4 &&
      p.lat <= 33 &&
      p.lng >= -118.5 &&
      p.lng <= -86.5,
  );
  if (!token || token === 'your_mapbox_token' || valid.length === 0) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 via-slate-50 to-emerald-50 text-center text-sm font-semibold text-emerald-800/60 ${className}`}
        aria-label={alt}
      >
        {alt}
      </div>
    );
  }

  const thinned = sample(valid, Math.min(maxPoints, 80));
  const overlays = thinned
    .map((p) => `pin-s+${pinColor}(${p.lng.toFixed(4)},${p.lat.toFixed(4)})`)
    .join(',');

  // Use `/auto/` to auto-fit all pins with sensible padding.
  const src =
    `https://api.mapbox.com/styles/v1/${style}/static/${overlays}/auto/` +
    `${width}x${height}@2x?padding=50&access_token=${token}`;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={`object-cover ${className}`}
      priority={priority}
      unoptimized
    />
  );
}
