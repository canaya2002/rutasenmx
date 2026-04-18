import Image from 'next/image';

export interface StaticMapPreviewProps {
  lat: number;
  lng: number;
  /** Label for screen readers / image alt. */
  alt: string;
  /** Pin color (without the `#`). Default is brand green. */
  pinColor?: string;
  /** Map zoom level (1-22). Default 13. */
  zoom?: number;
  /** Mapbox style id. Default is the airy "streets-v12". */
  style?: string;
  /** Output width x height in pixels (before @2x). */
  width?: number;
  height?: number;
  /** Pin size: small (s) | medium (m) | large (l). */
  pinSize?: 's' | 'm' | 'l';
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Server component that renders a Mapbox Static Images API preview as an
 * optimised `<Image>`. Requires `NEXT_PUBLIC_MAPBOX_TOKEN` at runtime.
 * Falls back to a gradient placeholder when the token is missing or the
 * coords are invalid.
 */
export function StaticMapPreview({
  lat,
  lng,
  alt,
  pinColor = '06C167',
  zoom = 13,
  style = 'mapbox/streets-v12',
  width = 600,
  height = 400,
  pinSize = 'l',
  className = '',
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
}: StaticMapPreviewProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const validCoords =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180;

  if (!token || token === 'your_mapbox_token' || !validCoords) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 via-slate-50 to-emerald-50 text-center text-xs font-semibold text-emerald-800/60 ${className}`}
        aria-label={alt}
      >
        {alt}
      </div>
    );
  }

  const pin = `pin-${pinSize}+${pinColor}(${lng.toFixed(5)},${lat.toFixed(5)})`;
  const src =
    `https://api.mapbox.com/styles/v1/${style}/static/${pin}` +
    `/${lng.toFixed(5)},${lat.toFixed(5)},${zoom},0/` +
    `${width}x${height}@2x?access_token=${token}`;

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
