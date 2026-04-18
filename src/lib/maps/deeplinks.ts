/**
 * Builds deep links to external maps apps. The user's phone/browser will open
 * these in the default maps app (Google Maps, Apple Maps on iOS, Waze).
 */

export interface Coord {
  lat: number;
  lng: number;
  name?: string;
}

const fmt = (n: number) => n.toFixed(6);

/**
 * Google Maps directions URL. Accepts up to 10 waypoints (Google's cap).
 * Extra stops are dropped and should be surfaced separately.
 */
export function googleMapsRouteUrl(stops: Coord[]): string {
  if (stops.length === 0) return 'https://www.google.com/maps';
  if (stops.length === 1) {
    const s = stops[0];
    return `https://www.google.com/maps/search/?api=1&query=${fmt(s.lat)},${fmt(s.lng)}`;
  }
  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const waypoints = stops.slice(1, -1).slice(0, 9); // max 9 intermediate
  const params = new URLSearchParams({
    api: '1',
    origin: `${fmt(origin.lat)},${fmt(origin.lng)}`,
    destination: `${fmt(destination.lat)},${fmt(destination.lng)}`,
    travelmode: 'driving',
  });
  if (waypoints.length > 0) {
    params.set(
      'waypoints',
      waypoints.map((w) => `${fmt(w.lat)},${fmt(w.lng)}`).join('|'),
    );
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Single-place Google Maps search URL */
export function googleMapsPlaceUrl(c: Coord): string {
  return `https://www.google.com/maps/search/?api=1&query=${fmt(c.lat)},${fmt(c.lng)}${
    c.name ? `&query_place_id=${encodeURIComponent(c.name)}` : ''
  }`;
}

/** Waze navigation URL */
export function wazeRouteUrl(c: Coord): string {
  return `https://waze.com/ul?ll=${fmt(c.lat)}%2C${fmt(c.lng)}&navigate=yes`;
}

/** Apple Maps URL (works on iOS + macOS) */
export function appleMapsRouteUrl(stops: Coord[]): string {
  if (stops.length === 0) return 'https://maps.apple.com';
  if (stops.length === 1) {
    const s = stops[0];
    return `https://maps.apple.com/?ll=${fmt(s.lat)},${fmt(s.lng)}&q=${encodeURIComponent(s.name ?? 'Destino')}`;
  }
  const origin = stops[0];
  const destination = stops[stops.length - 1];
  return `https://maps.apple.com/?saddr=${fmt(origin.lat)},${fmt(origin.lng)}&daddr=${fmt(destination.lat)},${fmt(destination.lng)}&dirflg=d`;
}
