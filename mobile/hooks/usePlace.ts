import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import { API, type PlaceView } from '@shared/index';

interface Response {
  place: PlaceView;
}

/**
 * Single-place detail. Cache keyed by slug so navigating away and back is
 * instant from memory.
 */
export function usePlace(slug: string | undefined) {
  return useQuery<PlaceView>({
    queryKey: ['place', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      if (!slug) throw new Error('slug is required');
      const data = await apiFetch<Response>(API.place(slug));
      return data.place;
    },
    staleTime: 10 * 60_000, // places rarely change
  });
}
