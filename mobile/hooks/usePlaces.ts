import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import {
  API,
  type PlaceCategorySlug,
  type PlaceView,
} from '@shared/index';

export interface PlaceFilters {
  category?: PlaceCategorySlug;
  state?: string;
  search?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

interface PlacesResponse {
  places: PlaceView[];
  total: number;
  limit: number;
  offset: number;
}

const PAGE_SIZE = 20;

function buildParams(filters: PlaceFilters, offset: number): string {
  const p = new URLSearchParams();
  if (filters.category) p.set('category', filters.category);
  if (filters.state) p.set('state', filters.state);
  if (filters.search) p.set('search', filters.search);
  if (filters.lat != null && filters.lng != null && filters.radiusKm != null) {
    p.set('lat', String(filters.lat));
    p.set('lng', String(filters.lng));
    p.set('radius', String(filters.radiusKm));
  }
  p.set('limit', String(PAGE_SIZE));
  p.set('offset', String(offset));
  return p.toString();
}

/**
 * Paginated list of places. Used by the Explorar feed and every category
 * detail screen. `enabled` is toggleable so we can hold the hook on a
 * screen while the user picks filters, and only fire once they're ready.
 */
export function usePlacesInfinite(
  filters: PlaceFilters = {},
  opts: { enabled?: boolean } = {},
) {
  return useInfiniteQuery<PlacesResponse>({
    queryKey: ['places', filters],
    initialPageParam: 0,
    enabled: opts.enabled ?? true,
    queryFn: async ({ pageParam }) => {
      const qs = buildParams(filters, pageParam as number);
      return apiFetch<PlacesResponse>(`${API.places}?${qs}`);
    },
    getNextPageParam: (last) => {
      const next = last.offset + last.limit;
      return next < last.total ? next : undefined;
    },
  });
}

/**
 * Single-page listing. Cheaper than infinite when you only need the first N.
 */
export function usePlacesList(
  filters: PlaceFilters = {},
  opts: { limit?: number; enabled?: boolean } = {},
) {
  const limit = opts.limit ?? PAGE_SIZE;
  return useQuery<PlacesResponse>({
    queryKey: ['places-list', filters, limit],
    enabled: opts.enabled ?? true,
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filters.category) p.set('category', filters.category);
      if (filters.state) p.set('state', filters.state);
      if (filters.search) p.set('search', filters.search);
      p.set('limit', String(limit));
      return apiFetch<PlacesResponse>(`${API.places}?${p.toString()}`);
    },
  });
}
