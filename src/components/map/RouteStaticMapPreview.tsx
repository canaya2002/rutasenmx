import Image from 'next/image';

export interface RouteStaticStop {
  lat: number;
  lng: number;
}

export interface RouteStaticMapPreviewProps {
  stops: RouteStaticStop[];
  alt: string;
  /** Stroke colour without `#`. */
  lineColor?: string;
  /** Start-pin colour without `#`. */
  startColor?: string;
  /** End-pin colour without `#`. */
  endColor?: string;
  style?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Google-compatible polyline encoder (precision 5). Matches the format Mapbox
 * Static Images API expects for `path` overlays.
 */
function encodePolyline(points: ReadonlyArray<RouteStaticStop>): string {
  let out = '';
  let prevLat = 0;
  let prevLng = 0;
  for (const { lat, lng } of points) {
    const cLat = Math.round(lat * 1e5);
    const cLng = Math.round(lng * 1e5);
    out += encodeSignedNumber(cLat - prevLat);
    out += encodeSignedNumber(cLng - prevLng);
    prevLat = cLat;
    prevLng = cLng;
  }
  return out;
}

function encodeSignedNumber(num: number): string {
  let sgn = num << 1;
  if (num < 0) sgn = ~sgn;
  let result = '';
  while (sgn >= 0x20) {
    result += String.fromCharCode((0x20 | (sgn & 0x1f)) + 63);
    sgn >>>= 5;
  }
  result += String.fromCharCode(sgn + 63);
  return result;
}

/** Keeps at most `max` stops spread evenly (first/last always preserved). */
function thin<T>(arr: ReadonlyArray<T>, max: number): T[] {
  if (arr.length <= max) return [...arr];
  const step = (arr.length - 1) / (max - 1);
  const out: T[] = [];
  for (let i = 0; i < max; i++) {
    out.push(arr[Math.round(i * step)]);
  }
  return out;
}

/**
 * Server component: renders a Mapbox Static Images API PNG showing the route
 * trace (polyline) with start/end pins. Uses the `/auto/` bounds-fit mode so
 * the image always frames the whole route cleanly.
 */
export function RouteStaticMapPreview({
  stops,
  alt,
  lineColor = '06C167',
  startColor = '059669',
  endColor = 'DC2626',
  style = 'mapbox/streets-v12',
  width = 800,
  height = 500,
  className = '',
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
}: RouteStaticMapPreviewProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const valid = stops.filter(
    (s) =>
      Number.isFinite(s.lat) &&
      Number.isFinite(s.lng) &&
      Math.abs(s.lat) <= 90 &&
      Math.abs(s.lng) <= 180,
  );

  if (!token || token === 'your_mapbox_token' || valid.length === 0) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 via-slate-50 to-emerald-50 text-center text-xs font-semibold text-emerald-800/60 ${className}`}
        aria-label={alt}
      >
        {alt}
      </div>
    );
  }

  // Single-stop fallback: just show a pin.
  if (valid.length === 1) {
    const s = valid[0];
    const src =
      `https://api.mapbox.com/styles/v1/${style}/static/` +
      `pin-l+${lineColor}(${s.lng.toFixed(5)},${s.lat.toFixed(5)})` +
      `/${s.lng.toFixed(5)},${s.lat.toFixed(5)},11,0/` +
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

  // Cap at 25 points to stay under Mapbox's URL length limit.
  const thinned = thin(valid, 25);
  const start = thinned[0];
  const end = thinned[thinned.length - 1];
  const encoded = encodeURIComponent(encodePolyline(thinned));

  const overlays = [
    `path-5+${lineColor}-0.95(${encoded})`,
    `pin-s-a+${startColor}(${start.lng.toFixed(5)},${start.lat.toFixed(5)})`,
    `pin-s-b+${endColor}(${end.lng.toFixed(5)},${end.lat.toFixed(5)})`,
  ].join(',');

  const src =
    `https://api.mapbox.com/styles/v1/${style}/static/${overlays}/auto/` +
    `${width}x${height}@2x?padding=40&access_token=${token}`;

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
