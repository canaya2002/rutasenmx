/**
 * Plan contract shared between web and mobile.
 *
 * The authoritative plan DATA (prices, features) lives in the web project at
 * src/lib/subscription/plans.ts and is surfaced to clients via the
 * `/api/plans` endpoint. Clients NEVER hardcode pricing — this way a pricing
 * change ships everywhere as a server-only update.
 */

export type PlanSlug = 'free' | 'pro' | 'premium';
export type BillingInterval = 'monthly' | 'annual';

export interface PlanFeature {
  key: string;
  label: string;
  included: boolean;
}

export interface Plan {
  slug: PlanSlug;
  name: string;
  description: string;
  /** Price in cents (MXN). */
  priceMonthly: number;
  priceAnnual: number;
  maxSavedTrips: number;
  maxStopsPerTrip: number;
  features: PlanFeature[];
  isRecommended: boolean;
}

/**
 * Canonical plan hierarchy for upgrade-path checks on the client.
 * Must match the server's `meetsMinimumPlan` helper.
 */
export const PLAN_HIERARCHY: Record<PlanSlug, number> = {
  free: 0,
  pro: 1,
  premium: 2,
};

export function meetsMinimumPlan(
  userPlan: PlanSlug,
  requiredPlan: PlanSlug,
): boolean {
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}
