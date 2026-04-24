/**
 * Server-side geocoding provider abstraction.
 *
 * Production goal: when the user types "Pátzcuaro" in the Autopilot wizard,
 * we resolve to real lat/lng via a paid provider — no more hardcoded city
 * list with random-jitter fallbacks.
 *
 * Supported providers, chosen automatically from env:
 *   - `mapbox`    (MAPBOX_SECRET_TOKEN)    — https://docs.mapbox.com/api/search/geocoding
 *   - `maptiler`  (MAPTILER_KEY)           — https://docs.maptiler.com/cloud/api/geocoding
 *   - `nominatim` (no key, OSM, rate-limited) — last-resort
 *   - `hardcoded` (always available)       — tiny list of well-known Mexican cities
 *
 * Every caller goes through `searchPlace()`. The provider is picked at call
 * time so switching keys takes effect without a restart.
 *
 * All providers are biased to Mexico (country=MX) and Spanish (language=es).
 * Results outside Mexico are filtered out.
 */

export interface GeocodingResult {
  name: string;
  /** Formatted long name, e.g. "Pátzcuaro, Michoacán, México". */
  fullName: string;
  lat: number;
  lng: number;
  /** Provider that returned this row, for debug/analytics. */
  source: 'mapbox' | 'maptiler' | 'nominatim' | 'hardcoded';
}

// ── Hardcoded fallback (same list used to ship as baseline) ─────────────────
const FALLBACK_CITIES: Array<{ name: string; lat: number; lng: number }> = [
  { name: 'Ciudad de México', lat: 19.4326, lng: -99.1332 },
  { name: 'Guadalajara', lat: 20.6597, lng: -103.3496 },
  { name: 'Monterrey', lat: 25.6866, lng: -100.3161 },
  { name: 'Cancún', lat: 21.1619, lng: -86.8515 },
  { name: 'Oaxaca', lat: 17.0732, lng: -96.7266 },
  { name: 'Mérida', lat: 20.9674, lng: -89.5926 },
  { name: 'Puebla', lat: 19.0414, lng: -98.2063 },
  { name: 'San Miguel de Allende', lat: 20.9144, lng: -100.7452 },
  { name: 'Guanajuato', lat: 21.019, lng: -101.2574 },
  { name: 'Querétaro', lat: 20.5888, lng: -100.3899 },
  { name: 'San Cristóbal de las Casas', lat: 16.737, lng: -92.6376 },
  { name: 'Playa del Carmen', lat: 20.6296, lng: -87.0739 },
  { name: 'Tulum', lat: 20.2114, lng: -87.4654 },
  { name: 'Puerto Vallarta', lat: 20.6534, lng: -105.2253 },
  { name: 'Los Cabos', lat: 22.8905, lng: -109.9167 },
  { name: 'León', lat: 21.1221, lng: -101.6821 },
  { name: 'Morelia', lat: 19.706, lng: -101.195 },
  { name: 'Zacatecas', lat: 22.7709, lng: -102.5832 },
  { name: 'Aguascalientes', lat: 21.8818, lng: -102.2916 },
  { name: 'Veracruz', lat: 19.1738, lng: -96.1342 },
  { name: 'Tijuana', lat: 32.5149, lng: -117.0382 },
  { name: 'Chihuahua', lat: 28.6353, lng: -106.0889 },
  { name: 'Durango', lat: 24.0277, lng: -104.6532 },
  { name: 'Mazatlán', lat: 23.2494, lng: -106.4111 },
  { name: 'Taxco', lat: 18.5564, lng: -99.605 },
  { name: 'Cuernavaca', lat: 18.9242, lng: -99.2216 },
  { name: 'Toluca', lat: 19.2826, lng: -99.6557 },
  { name: 'Pachuca', lat: 20.1011, lng: -98.7591 },
  { name: 'Villahermosa', lat: 17.9869, lng: -92.9303 },
  { name: 'Campeche', lat: 19.8301, lng: -90.5349 },
  { name: 'Tuxtla Gutiérrez', lat: 16.7528, lng: -93.1152 },
  { name: 'Acapulco', lat: 16.8531, lng: -99.8237 },
  { name: 'Ixtapa', lat: 17.6567, lng: -101.6511 },
  { name: 'Huatulco', lat: 15.7741, lng: -96.1349 },
  { name: 'Pátzcuaro', lat: 19.5129, lng: -101.6101 },
  { name: 'Chichén Itzá', lat: 20.6843, lng: -88.5678 },
  { name: 'Teotihuacán', lat: 19.6925, lng: -98.8438 },
  { name: 'Monte Albán', lat: 17.0437, lng: -96.7676 },
  { name: 'Palenque', lat: 17.4838, lng: -92.046 },
];

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function hardcodedSearch(query: string, limit: number): GeocodingResult[] {
  const q = normalize(query);
  const hits = FALLBACK_CITIES.filter((c) => normalize(c.name).includes(q));
  return hits.slice(0, limit).map((c) => ({
    name: c.name,
    fullName: `${c.name}, México`,
    lat: c.lat,
    lng: c.lng,
    source: 'hardcoded' as const,
  }));
}

// ── Mapbox (preferred when token is set) ────────────────────────────────────
async function mapboxSearch(
  query: string,
  token: string,
  limit: number,
): Promise<GeocodingResult[]> {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
  );
  url.searchParams.set('access_token', token);
  url.searchParams.set('country', 'mx');
  url.searchParams.set('language', 'es');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('types', 'place,locality,neighborhood,poi,region');

  const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`Mapbox geocoding ${res.status}`);
  const data = (await res.json()) as {
    features?: Array<{
      place_name?: string;
      text?: string;
      center?: [number, number];
    }>;
  };
  return (data.features ?? [])
    .filter((f) => f.center && f.center.length === 2)
    .map<GeocodingResult>((f) => ({
      name: f.text ?? (f.place_name?.split(',')[0] ?? 'Ubicación'),
      fullName: f.place_name ?? f.text ?? 'Ubicación',
      lng: f.center![0],
      lat: f.center![1],
      source: 'mapbox',
    }));
}

// ── MapTiler (alternative) ──────────────────────────────────────────────────
async function maptilerSearch(
  query: string,
  key: string,
  limit: number,
): Promise<GeocodingResult[]> {
  const url = new URL(
    `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json`,
  );
  url.searchParams.set('key', key);
  url.searchParams.set('country', 'mx');
  url.searchParams.set('language', 'es');
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`MapTiler geocoding ${res.status}`);
  const data = (await res.json()) as {
    features?: Array<{
      place_name?: string;
      text?: string;
      center?: [number, number];
    }>;
  };
  return (data.features ?? [])
    .filter((f) => f.center && f.center.length === 2)
    .map<GeocodingResult>((f) => ({
      name: f.text ?? (f.place_name?.split(',')[0] ?? 'Ubicación'),
      fullName: f.place_name ?? f.text ?? 'Ubicación',
      lng: f.center![0],
      lat: f.center![1],
      source: 'maptiler',
    }));
}

// ── Nominatim (free, rate-limited — last resort) ────────────────────────────
async function nominatimSearch(
  query: string,
  limit: number,
): Promise<GeocodingResult[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('countrycodes', 'mx');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('accept-language', 'es');

  const res = await fetch(url, {
    signal: AbortSignal.timeout(4000),
    headers: {
      // Nominatim requires a descriptive User-Agent.
      'User-Agent': 'RutasEnMX/1.0 (rutasenmx.com)',
    },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const rows = (await res.json()) as Array<{
    display_name?: string;
    name?: string;
    lat?: string;
    lon?: string;
  }>;
  return rows
    .filter((r) => r.lat && r.lon)
    .map<GeocodingResult>((r) => ({
      name: r.name ?? (r.display_name?.split(',')[0] ?? 'Ubicación'),
      fullName: r.display_name ?? r.name ?? 'Ubicación',
      lat: Number(r.lat),
      lng: Number(r.lon),
      source: 'nominatim',
    }));
}

/**
 * Main entry. Picks provider by env, falls back gracefully on failure,
 * and guarantees results inside Mexico bounds.
 */
export async function searchPlace(
  query: string,
  opts: { limit?: number } = {},
): Promise<GeocodingResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const limit = Math.max(1, Math.min(opts.limit ?? 5, 10));

  const mapboxToken = process.env.MAPBOX_SECRET_TOKEN;
  const maptilerKey = process.env.MAPTILER_KEY;

  const tryProvider = async (): Promise<GeocodingResult[]> => {
    if (mapboxToken) return mapboxSearch(q, mapboxToken, limit);
    if (maptilerKey) return maptilerSearch(q, maptilerKey, limit);
    // Nominatim ToS says max 1 req/sec/app — we only use it without an
    // actual provider configured, i.e. dev or emergency fallback.
    return nominatimSearch(q, limit);
  };

  try {
    const results = await tryProvider();
    if (results.length > 0) return results;
  } catch (err) {
    console.warn('[geocoding] provider failed, falling back:', err);
  }

  // Always return something useful in dev / when provider is down.
  return hardcodedSearch(q, limit);
}
