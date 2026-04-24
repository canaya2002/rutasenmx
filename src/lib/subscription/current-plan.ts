import { and, eq, inArray } from 'drizzle-orm';

import { db, subscriptions, subscriptionPlans, mobileSubscriptions } from '@/db';
import type { PlanSlug } from './plans';

type ActiveSub = {
  slug: PlanSlug;
  source: 'stripe_web' | 'apple_iap' | 'google_iap';
  expiresAt: Date | null;
};

const PLAN_RANK: Record<PlanSlug, number> = { free: 0, pro: 1, premium: 2 };

/**
 * Returns ALL active subscriptions for a user (Stripe + mobile IAP).
 * Order: the highest-plan-first, so the caller can pick the "effective" plan.
 *
 * `past_due` and `in_grace_period` count as active — we don't kick paying
 * users off while their processor retries the charge.
 */
export async function getActiveSubscriptions(
  userId: string,
): Promise<ActiveSub[]> {
  const results: ActiveSub[] = [];

  try {
    const stripeRows = await db
      .select({
        slug: subscriptionPlans.slug,
        expiresAt: subscriptions.currentPeriodEnd,
      })
      .from(subscriptions)
      .innerJoin(
        subscriptionPlans,
        eq(subscriptions.planId, subscriptionPlans.id),
      )
      .where(
        and(
          eq(subscriptions.userId, userId),
          inArray(subscriptions.status, ['active', 'past_due']),
        ),
      );
    for (const r of stripeRows) {
      if (r.slug === 'pro' || r.slug === 'premium') {
        results.push({
          slug: r.slug,
          source: 'stripe_web',
          expiresAt: r.expiresAt ?? null,
        });
      }
    }
  } catch (err) {
    console.warn('getActiveSubscriptions stripe lookup failed:', err);
  }

  try {
    const iapRows = await db
      .select({
        slug: mobileSubscriptions.planSlug,
        source: mobileSubscriptions.source,
        expiresAt: mobileSubscriptions.currentPeriodEnd,
      })
      .from(mobileSubscriptions)
      .where(
        and(
          eq(mobileSubscriptions.userId, userId),
          inArray(mobileSubscriptions.status, ['active', 'in_grace_period']),
        ),
      );
    for (const r of iapRows) {
      if (r.slug === 'pro' || r.slug === 'premium') {
        results.push({
          slug: r.slug,
          source: r.source === 'apple_iap' ? 'apple_iap' : 'google_iap',
          expiresAt: r.expiresAt ?? null,
        });
      }
    }
  } catch (err) {
    // Table may not exist on older DBs — don't crash.
    console.warn('getActiveSubscriptions mobile lookup failed:', err);
  }

  // Highest plan first; ties break by latest expiry.
  return results.sort((a, b) => {
    const planDiff = PLAN_RANK[b.slug] - PLAN_RANK[a.slug];
    if (planDiff !== 0) return planDiff;
    return (b.expiresAt?.getTime() ?? 0) - (a.expiresAt?.getTime() ?? 0);
  });
}

/**
 * Resolves the effective plan slug (highest-active across all sources) for a
 * user. Returns 'free' when the user has no active subscription.
 */
export async function getCurrentPlanSlug(userId: string): Promise<PlanSlug> {
  const active = await getActiveSubscriptions(userId);
  return active[0]?.slug ?? 'free';
}

/**
 * Resolves a plan row's UUID id from its slug. Used when creating or updating
 * subscriptions in response to Stripe events that only carry the slug in metadata.
 */
export async function getPlanIdBySlug(slug: PlanSlug): Promise<string | null> {
  try {
    const [row] = await db
      .select({ id: subscriptionPlans.id })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.slug, slug))
      .limit(1);
    return row?.id ?? null;
  } catch (err) {
    console.warn('getPlanIdBySlug failed:', err);
    return null;
  }
}
