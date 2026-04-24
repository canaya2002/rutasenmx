/**
 * Place / State / Route types shared between web and mobile.
 *
 * Mirror of the shapes `/api/places`, `/api/routes`, `/api/states`, and
 * `/api/search` return. Keep in lockstep: if the server changes what it
 * sends, update here FIRST and the type check will catch every consumer.
 */

export type PlaceCategorySlug =
  | 'pueblos-magicos'
  | 'museos'
  | 'zonas-arqueologicas'
  | 'playas'
  | 'cenotes'
  | 'haciendas'
  | 'centros-historicos';

export interface PlaceView {
  id: string;
  slug: string;
  name: string;
  stateSlug: string;
  stateName: string;
  category: PlaceCategorySlug;
  categoryName: string;
  lat: number;
  lng: number;
  description: string;
  longDescription: string;
  badges: string[];
  image: string;
  openingHours?: string;
  price?: string;
  telephone?: string;
  website?: string;
  address?: string;
}

export interface StateView {
  slug: string;
  name: string;
  abbr: string;
  description: string;
  placeCount: number;
  image: string;
  capital: string;
}

export type RouteDifficulty = 'facil' | 'moderada' | 'avanzada';

export interface RouteStopView {
  placeSlug: string;
  placeName: string;
  order: number;
  stayMinutes: number;
  note: string;
  lat: number | null;
  lng: number | null;
  image: string | null;
  stateName: string | null;
  category: PlaceCategorySlug | null;
}

/** Minimal route in list views (no stops). */
export interface RouteSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  origin: string;
  destination: string;
  statesSlugs: string[];
  distanceKm: number;
  durationDays: number;
  drivingHours: number;
  difficulty: RouteDifficulty;
  highlights: string[];
  estimatedCostMXN: number;
}

/** Detail view = summary + enriched stops. */
export interface RouteDetail extends RouteSummary {
  stops: RouteStopView[];
}

// ── Shared response envelopes ───────────────────────────────────────────────
export interface PagedResponse<T> {
  total: number;
  limit: number;
  offset: number;
  // Individual endpoints name the array differently (`places`, `routes`,
  // `states`) — callers know which key to read.
  [key: string]: T[] | number;
}

export interface SearchResult {
  type: 'place' | 'state' | 'route';
  id?: string;
  slug: string;
  name: string;
  description: string;
  image?: string;
  category?: PlaceCategorySlug;
  stateName?: string;
}

// ── Category catalog (stable, hardcoded so clients don't round-trip) ────────
export interface PlaceCategoryMeta {
  slug: PlaceCategorySlug;
  name: string;
  emoji: string;
  /** Tailwind colour token used on web; mobile can reuse for gradients. */
  color: string;
}

export const PLACE_CATEGORY_CATALOG: PlaceCategoryMeta[] = [
  { slug: 'pueblos-magicos', name: 'Pueblos Mágicos', emoji: '✨', color: '#06C167' },
  { slug: 'museos', name: 'Museos', emoji: '🏛️', color: '#8B5CF6' },
  { slug: 'zonas-arqueologicas', name: 'Zonas arqueológicas', emoji: '🏺', color: '#D97706' },
  { slug: 'centros-historicos', name: 'Centros históricos', emoji: '⛪', color: '#DC2626' },
  { slug: 'haciendas', name: 'Haciendas', emoji: '🏡', color: '#E11D48' },
  { slug: 'playas', name: 'Playas', emoji: '🏖️', color: '#0EA5E9' },
  { slug: 'cenotes', name: 'Cenotes', emoji: '💧', color: '#06B6D4' },
];
