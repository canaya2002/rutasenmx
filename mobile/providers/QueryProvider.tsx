/**
 * TanStack Query provider with persistent cache. The persister uses
 * AsyncStorage (not SecureStore) because cache is data, not secrets.
 *
 * Design choices:
 *   - Queries stay fresh for 2 minutes — road-trip data barely changes.
 *   - Cached for 24 hours so offline launches still render something.
 *   - Retries once (default 3 is chatty on mobile).
 */
import { useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { AppState, Platform } from 'react-native';
import * as Network from 'expo-network';

let queryClient: QueryClient | null = null;
function getQueryClient(): QueryClient {
  if (queryClient) return queryClient;
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60_000,
        gcTime: 24 * 60 * 60_000,
        retry: 1,
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
  return queryClient;
}

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'rmx.query-cache.v1',
});

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(getQueryClient);

  // Pause/resume queries based on app state (saves battery).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });
    return () => sub.remove();
  }, []);

  // Feed TanStack Query's online state from expo-network.
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (cancelled) return;
        onlineManager.setOnline(Boolean(state.isInternetReachable ?? state.isConnected));
      } catch {
        /* ignore */
      }
    };
    void refresh();
    const id = setInterval(refresh, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Web: use the in-memory QueryClientProvider (no AsyncStorage persistence
  // on web because IndexedDB/localStorage aren't worth the bundle overhead
  // for this app). MUST be imported statically (same module instance as
  // `useQueryClient` consumers) — the old `require()` approach created a
  // second module instance and broke context lookup inside IAPProvider.
  if (Platform.OS === 'web') {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{ persister, maxAge: 24 * 60 * 60_000 }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
