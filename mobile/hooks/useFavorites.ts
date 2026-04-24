import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';

/** Shape returned by /api/favorites GET (enriched from static catalog). */
export interface FavoritePlace {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryName: string;
  stateName: string;
  image: string;
  description: string;
  notes: string | null;
  addedAt: string;
}

interface ListResp {
  favorites: FavoritePlace[];
  total: number;
}

const listKey = ['favorites', 'list'] as const;

/**
 * List of favorites for the current user. Disabled when not logged in so the
 * public pages don't even attempt the network call.
 */
export function useFavoritesList() {
  const { user } = useAuth();
  return useQuery<FavoritePlace[]>({
    queryKey: listKey,
    enabled: Boolean(user),
    queryFn: async () => {
      const data = await apiFetch<ListResp>('/api/favorites');
      return data.favorites;
    },
    staleTime: 60_000,
  });
}

/**
 * Boolean "is this slug favorited by me?" — derived from the list query so we
 * don't hit the server per-card. Cache-coherent with `useFavoritesList`.
 */
export function useIsFavorite(slug: string | undefined): boolean {
  const { data } = useFavoritesList();
  if (!slug || !data) return false;
  return data.some((f) => f.slug === slug);
}

/**
 * Add or remove a favorite. Optimistic update on the list cache so the heart
 * button responds instantly; rolls back on error.
 */
export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation<void, Error, { slug: string; add: boolean; meta?: Partial<FavoritePlace> }>({
    mutationFn: async ({ slug, add }) => {
      if (add) {
        await apiFetch('/api/favorites', {
          method: 'POST',
          body: { placeSlug: slug },
        });
      } else {
        await apiFetch(
          `/api/favorites?slug=${encodeURIComponent(slug)}`,
          { method: 'DELETE' },
        );
      }
    },
    onMutate: async ({ slug, add, meta }) => {
      await qc.cancelQueries({ queryKey: listKey });
      const prev = qc.getQueryData<FavoritePlace[]>(listKey) ?? [];
      if (add) {
        const optimistic: FavoritePlace = {
          id: `optimistic-${slug}`,
          slug,
          name: meta?.name ?? slug,
          category: meta?.category ?? '',
          categoryName: meta?.categoryName ?? '',
          stateName: meta?.stateName ?? '',
          image: meta?.image ?? '',
          description: meta?.description ?? '',
          notes: null,
          addedAt: new Date().toISOString(),
        };
        qc.setQueryData<FavoritePlace[]>(listKey, [optimistic, ...prev]);
      } else {
        qc.setQueryData<FavoritePlace[]>(
          listKey,
          prev.filter((f) => f.slug !== slug),
        );
      }
      return { prev } as unknown as void;
    },
    // Best-effort rollback: if the mutation errors, refetch truth from server.
    onError: () => {
      void qc.invalidateQueries({ queryKey: listKey });
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: listKey });
    },
  });
}
