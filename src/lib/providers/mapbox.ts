// ── Types ───────────────────────────────────────────────────────────────────
export interface GeocodingResult {
  id: string;
  name: string;
  fullAddress: string;
  lat: number;
  lng: number;
  placeType: string[];
  relevance: number;
}

export interface ReverseGeocodingResult {
  address: string;
  locality: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
}

export interface DirectionsResult {
  distance: number; // meters
  duration: number; // seconds
  geometry: GeoJSON.LineString;
  steps: DirectionStep[];
}

export interface DirectionStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number];
  };
}

export interface StaticMapOptions {
  width: number;
  height: number;
  zoom?: number;
  bearing?: number;
  pitch?: number;
  style?: string;
  markers?: Array<{ lat: number; lng: number; color?: string; label?: string }>;
  path?: Array<[number, number]>;
  retina?: boolean;
}

// ── Interface ───────────────────────────────────────────────────────────────
export interface MapProvider {
  geocode(query: string, options?: { proximity?: [number, number]; country?: string; limit?: number }): Promise<GeocodingResult[]>;
  reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodingResult | null>;
  getDirections(coordinates: [number, number][], options?: { profile?: 'driving' | 'walking' | 'cycling'; alternatives?: boolean; language?: string }): Promise<DirectionsResult[]>;
  getStaticMapUrl(center: { lat: number; lng: number }, options: StaticMapOptions): string;
}

// ── Mapbox implementation ───────────────────────────────────────────────────
const MAPBOX_BASE = 'https://api.mapbox.com';

function getAccessToken(): string {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MAPBOX_ACCESS_TOKEN environment variable is not set');
  }
  return token;
}

class MapboxProvider implements MapProvider {
  async geocode(
    query: string,
    options: { proximity?: [number, number]; country?: string; limit?: number } = {},
  ): Promise<GeocodingResult[]> {
    const { proximity, country = 'mx', limit = 5 } = options;
    const params = new URLSearchParams({
      q: query,
      access_token: getAccessToken(),
      language: 'es',
      country,
      limit: String(limit),
    });

    if (proximity) {
      params.set('proximity', `${proximity[0]},${proximity[1]}`);
    }

    const response = await fetch(
      `${MAPBOX_BASE}/search/geocode/v6/forward?${params}`,
    );

    if (!response.ok) {
      throw new Error(`Mapbox geocoding failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return (data.features ?? []).map((feature: Record<string, unknown>) => {
      const props = feature.properties as Record<string, unknown>;
      const geometry = feature.geometry as { coordinates: [number, number] };
      return {
        id: feature.id as string,
        name: props.name as string,
        fullAddress: props.full_address as string,
        lat: geometry.coordinates[1],
        lng: geometry.coordinates[0],
        placeType: [props.feature_type as string],
        relevance: (props.relevance as number) ?? 1,
      };
    });
  }

  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodingResult | null> {
    const params = new URLSearchParams({
      access_token: getAccessToken(),
      language: 'es',
    });

    const response = await fetch(
      `${MAPBOX_BASE}/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}&${params}`,
    );

    if (!response.ok) {
      throw new Error(`Mapbox reverse geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    const features = data.features ?? [];

    if (features.length === 0) return null;

    const props = features[0].properties as Record<string, unknown>;
    const ctx = props.context as Record<string, Record<string, string>> | undefined;

    return {
      address: (props.full_address as string) ?? '',
      locality: ctx?.locality?.name ?? ctx?.place?.name ?? '',
      state: ctx?.region?.name ?? '',
      country: ctx?.country?.name ?? 'México',
      lat,
      lng,
    };
  }

  async getDirections(
    coordinates: [number, number][],
    options: { profile?: 'driving' | 'walking' | 'cycling'; alternatives?: boolean; language?: string } = {},
  ): Promise<DirectionsResult[]> {
    const { profile = 'driving', alternatives = false, language = 'es' } = options;

    if (coordinates.length < 2) {
      throw new Error('At least two coordinates are required for directions');
    }

    if (coordinates.length > 25) {
      throw new Error('Mapbox Directions API supports up to 25 coordinates');
    }

    const coordString = coordinates.map(([lng, lat]) => `${lng},${lat}`).join(';');
    const params = new URLSearchParams({
      access_token: getAccessToken(),
      geometries: 'geojson',
      overview: 'full',
      steps: 'true',
      alternatives: String(alternatives),
      language,
    });

    const response = await fetch(
      `${MAPBOX_BASE}/directions/v5/mapbox/${profile}/${coordString}?${params}`,
    );

    if (!response.ok) {
      throw new Error(`Mapbox directions failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok') {
      throw new Error(`Mapbox directions error: ${data.code} - ${data.message ?? 'Unknown error'}`);
    }

    return (data.routes ?? []).map((route: Record<string, unknown>) => ({
      distance: route.distance as number,
      duration: route.duration as number,
      geometry: route.geometry as GeoJSON.LineString,
      steps: ((route.legs as Array<Record<string, unknown>>) ?? []).flatMap(
        (leg) =>
          ((leg.steps as Array<Record<string, unknown>>) ?? []).map((step) => ({
            instruction: ((step.maneuver as Record<string, unknown>)?.instruction as string) ?? '',
            distance: step.distance as number,
            duration: step.duration as number,
            maneuver: {
              type: (step.maneuver as Record<string, unknown>)?.type as string,
              modifier: (step.maneuver as Record<string, unknown>)?.modifier as string | undefined,
              location: (step.maneuver as Record<string, unknown>)?.location as [number, number],
            },
          })),
      ),
    }));
  }

  getStaticMapUrl(
    center: { lat: number; lng: number },
    options: StaticMapOptions,
  ): string {
    const {
      width,
      height,
      zoom = 12,
      bearing = 0,
      pitch = 0,
      style = 'mapbox/streets-v12',
      markers = [],
      path,
      retina = true,
    } = options;

    let overlay = '';

    if (markers.length > 0) {
      const markerStrings = markers.map((m) => {
        const color = (m.color ?? '#C4532B').replace('#', '');
        const label = m.label ?? '';
        return `pin-s-${label}+${color}(${m.lng},${m.lat})`;
      });
      overlay = markerStrings.join(',') + '/';
    }

    if (path && path.length >= 2) {
      const encoded = encodeURIComponent(
        JSON.stringify({
          type: 'LineString',
          coordinates: path,
        }),
      );
      overlay = `geojson(${encoded})/`;
    }

    const retinaStr = retina ? '@2x' : '';

    return `${MAPBOX_BASE}/styles/v1/${style}/static/${overlay}${center.lng},${center.lat},${zoom},${bearing},${pitch}/${width}x${height}${retinaStr}?access_token=${getAccessToken()}`;
  }
}

// ── Singleton ───────────────────────────────────────────────────────────────
export const mapbox: MapProvider = new MapboxProvider();
