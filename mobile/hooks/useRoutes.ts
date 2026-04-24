import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import {
  API,
  type RouteDetail,
  type RouteDifficulty,
  type RouteSummary,
} from '@shared/index';

export interface RouteFilters {
  difficulty?: RouteDifficulty;
  state?: string;
  search?: string;
}

interface RoutesResponse {
  routes: RouteSummary[];
  total: number;
  limit: number;
  offset: number;
}

interface RouteDetailResponse {
  route: RouteDetail;
}

export function useRoutes(filters: RouteFilters = {}) {
  return useQuery<RoutesResponse>({
    queryKey: ['routes', filters],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filters.difficulty) p.set('difficulty', filters.difficulty);
      if (filters.state) p.set('state', filters.state);
      if (filters.search) p.set('search', filters.search);
      const url = p.toString() ? `${API.routes}?${p.toString()}` : API.routes;
      return apiFetch<RoutesResponse>(url);
    },
    staleTime: 5 * 60_000,
  });
}

export function useRoute(slug: string | undefined) {
  return useQuery<RouteDetail>({
    queryKey: ['route', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      if (!slug) throw new Error('slug is required');
      const data = await apiFetch<RouteDetailResponse>(API.route(slug));
      return data.route;
    },
    staleTime: 10 * 60_000,
  });
}
