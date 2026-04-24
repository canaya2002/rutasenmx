/**
 * Cross-platform entitlements — the contract between `/api/entitlements` and
 * any client that needs to know "what is this user allowed to do right now?"
 *
 * Single source of truth. If the user has a Stripe web sub, `activeSource`
 * will be `stripe_web` and `canUpgradeInApp` will be `false` so mobile paywalls
 * explicitly block re-subscribing via IAP (which would result in double billing).
 */

import type { PlanSlug } from './plans';

export type EntitlementSource =
  | 'stripe_web'
  | 'apple_iap'
  | 'google_iap'
  | 'none';

export interface Entitlements {
  plan: PlanSlug;
  activeSource: EntitlementSource;
  /** True if the user may initiate an IAP flow on mobile. */
  canUpgradeInApp: boolean;
  /** True if the user may initiate a Stripe checkout on web. */
  canUpgradeOnWeb: boolean;
  /** Human-readable message to show in the paywall when blocked. */
  message: string | null;
  /** ISO timestamp when the current subscription ends (null if none). */
  expiresAt: string | null;
}
