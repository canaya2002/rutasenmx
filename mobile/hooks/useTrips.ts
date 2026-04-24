import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import { API, type TripSummary } from '@shared/index';

interface TripsListResponse {
  trips: TripSummary[];
  total: number;
  limit: number | null;
}

interface TripDetailResponse {
  trip: TripSummary;
}

export function useTrips() {
  return useQuery<TripsListResponse>({
    queryKey: ['trips'],
    queryFn: () => apiFetch<TripsListResponse>(API.trips),
    staleTime: 30_000,
  });
}

export function useTrip(id: string | undefined) {
  return useQuery<TripSummary>({
    queryKey: ['trip', id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) throw new Error('id is required');
      const data = await apiFetch<TripDetailResponse>(API.trip(id));
      return data.trip;
    },
    staleTime: 30_000,
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ message: string }>(API.trip(id), { method: 'DELETE' }),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.removeQueries({ queryKey: ['trip', id] });
    },
  });
}
