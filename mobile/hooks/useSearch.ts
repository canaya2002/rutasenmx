import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { apiFetch } from '@/lib/api';
import { API, type SearchResult } from '@shared/index';

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

/** Debounces a changing value so we don't hammer the search endpoint. */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

/**
 * Unified search across places, states and routes. Returns empty results
 * for queries shorter than 2 characters (mirrors the server contract).
 */
export function useSearch(query: string, opts: { enabled?: boolean } = {}) {
  const debounced = useDebouncedValue(query.trim(), 300);

  return useQuery<SearchResponse>({
    queryKey: ['search', debounced],
    enabled: (opts.enabled ?? true) && debounced.length >= 2,
    queryFn: () =>
      apiFetch<SearchResponse>(
        `${API.search}?q=${encodeURIComponent(debounced)}`,
      ),
    staleTime: 30_000,
  });
}
