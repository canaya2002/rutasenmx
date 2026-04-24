import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchOfferings,
  purchasePackage,
  restorePurchases,
  isIAPAvailable,
  type IAPOffering,
  type PurchaseOutcome,
} from '@/lib/iap';
import { emit, EVENTS } from '@/lib/analytics';
import { apiFetch } from '@/lib/api';
import { API } from '@shared/index';
import type { PlanSlug } from '@shared/index';

/**
 * List the available plans as advertised by RevenueCat. Returns null when
 * the native module isn't loaded (Expo Go) so the UI can render a helpful
 * fallback instead of an error.
 */
export function useOfferings() {
  return useQuery<IAPOffering | null>({
    queryKey: ['iap', 'offerings'],
    enabled: isIAPAvailable(),
    queryFn: fetchOfferings,
    // Prices don't change often; keep them warm for 10 min.
    staleTime: 10 * 60_000,
  });
}

/**
 * One-shot purchase mutation.
 *
 *   1. Emit `iap_started`.
 *   2. Read `/api/entitlements` to enforce anti-double-billing. If the user
 *      has an active Stripe web sub, abort with `iap_blocked_cross_platform`.
 *   3. Call `purchasePackage()` against RevenueCat.
 *   4. On success, ping our server so `/api/entitlements` refreshes. The
 *      RevenueCat webhook is the actual persistence path — this ping is
 *      just to kick the cache.
 */
export function usePurchase() {
  const qc = useQueryClient();

  return useMutation<
    PurchaseOutcome,
    Error,
    { packageId: string; planSlug: PlanSlug | null }
  >({
    mutationFn: async ({ packageId, planSlug }) => {
      emit(EVENTS.iap_started, {
        properties: { packageId, planSlug },
      });

      // Anti-double-billing guard: one last server-authoritative check.
      try {
        const ent = await apiFetch<{
          plan: string;
          activeSource: string;
          canUpgradeInApp: boolean;
          message: string | null;
        }>(API.entitlements);
        if (!ent.canUpgradeInApp) {
          emit(EVENTS.iap_blocked_cross_platform, {
            properties: {
              existingSource: ent.activeSource,
              existingPlan: ent.plan,
            },
          });
          return {
            kind: 'error',
            message:
              ent.message ??
              'Ya tienes una suscripción activa fuera de la app. No podemos cobrarte dos veces.',
          };
        }
      } catch {
        // If the entitlements endpoint is unreachable, we allow the purchase
        // — the RevenueCat webhook + our syncing logic will still reconcile.
      }

      return purchasePackage(packageId);
    },
    onSuccess: (outcome, vars) => {
      if (outcome.kind === 'success') {
        emit(EVENTS.iap_completed, {
          properties: {
            packageId: vars.packageId,
            productId: outcome.productId,
            planSlug: outcome.planSlug,
          },
        });
        // Give the webhook a beat, then re-fetch so the UI reflects the new plan.
        setTimeout(() => {
          qc.invalidateQueries({ queryKey: ['entitlements'] });
          qc.invalidateQueries({ queryKey: ['auth', 'me'] });
        }, 1500);
      } else if (outcome.kind === 'error' || outcome.kind === 'unavailable') {
        emit(EVENTS.iap_failed, {
          properties: {
            packageId: vars.packageId,
            reason: outcome.kind,
            message:
              outcome.kind === 'error' ? outcome.message : 'unavailable',
          },
        });
      }
    },
  });
}

export function useRestorePurchases() {
  const qc = useQueryClient();
  return useMutation<
    { restoredPlan: string | null; expiresAt: string | null } | null,
    Error,
    void
  >({
    mutationFn: async () => {
      const snap = await restorePurchases();
      if (!snap) return null;
      return { restoredPlan: snap.activePlan, expiresAt: snap.expiresAt };
    },
    onSuccess: () => {
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['entitlements'] });
      }, 800);
    },
  });
}
