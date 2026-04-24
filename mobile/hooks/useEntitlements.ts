import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import { API, type Entitlements } from '@shared/index';

/**
 * Reads `/api/entitlements` — the single source of truth for "what can this
 * user do, and where did their subscription come from". Paywall / IAP screens
 * use `canUpgradeInApp` to decide whether to even show the purchase button.
 *
 * staleTime is short (30s) because entitlements can change right after a
 * webhook fires (Stripe checkout or RevenueCat IAP).
 */
export function useEntitlements() {
  return useQuery<Entitlements>({
    queryKey: ['entitlements'],
    queryFn: () => apiFetch<Entitlements>(API.entitlements),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
