import { describe, it, expect } from 'vitest';
import {
  getPlan,
  getPlanPrice,
  meetsMinimumPlan,
  checkTripLimit,
  checkStopLimit,
  canAccess,
  formatPlanPrice,
  PLANS,
  type PlanSlug,
} from '@/lib/subscription/plans';

// ---------------------------------------------------------------------------
// getPlan
// ---------------------------------------------------------------------------

describe('getPlan', () => {
  it('returns the correct plan by slug', () => {
    expect(getPlan('free').slug).toBe('free');
    expect(getPlan('basic').slug).toBe('basic');
    expect(getPlan('pro').slug).toBe('pro');
    expect(getPlan('premium').slug).toBe('premium');
  });

  it('throws for unknown plan slug', () => {
    expect(() => getPlan('nonexistent' as PlanSlug)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Plan limits enforcement
// ---------------------------------------------------------------------------

describe('plan limits', () => {
  it('free plan has restricted trip limit', () => {
    const plan = getPlan('free');
    expect(plan.maxSavedTrips).toBe(1);
  });

  it('free plan has restricted stops per trip', () => {
    const plan = getPlan('free');
    expect(plan.maxStopsPerTrip).toBe(7);
  });

  it('basic plan has more trips than free', () => {
    expect(getPlan('basic').maxSavedTrips).toBeGreaterThan(getPlan('free').maxSavedTrips);
  });

  it('pro plan has more trips than basic', () => {
    expect(getPlan('pro').maxSavedTrips).toBeGreaterThan(getPlan('basic').maxSavedTrips);
  });

  it('premium plan has unlimited trips', () => {
    const plan = getPlan('premium');
    expect(plan.maxSavedTrips).toBe(Infinity);
  });

  it('premium plan has the most stops per trip', () => {
    const premiumStops = getPlan('premium').maxStopsPerTrip;
    expect(premiumStops).toBeGreaterThan(getPlan('pro').maxStopsPerTrip);
  });
});

// ---------------------------------------------------------------------------
// Free plan restrictions
// ---------------------------------------------------------------------------

describe('free plan restrictions', () => {
  it('does not include PDF export', () => {
    expect(canAccess('free', 'pdf_export')).toBe(false);
  });

  it('does not include ad-free experience', () => {
    expect(canAccess('free', 'no_ads')).toBe(false);
  });

  it('does not include collaboration', () => {
    expect(canAccess('free', 'collaboration')).toBe(false);
  });

  it('does not include AI autopilot', () => {
    expect(canAccess('free', 'ai_autopilot')).toBe(false);
  });

  it('does not include offline mode', () => {
    expect(canAccess('free', 'offline')).toBe(false);
  });

  it('includes basic features', () => {
    expect(canAccess('free', 'map')).toBe(true);
    expect(canAccess('free', 'explore')).toBe(true);
    expect(canAccess('free', 'seo_pages')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Premium plan unlimited trips
// ---------------------------------------------------------------------------

describe('premium plan unlimited features', () => {
  it('has unlimited trips', () => {
    expect(checkTripLimit('premium', 0)).toBe(true);
    expect(checkTripLimit('premium', 100)).toBe(true);
    expect(checkTripLimit('premium', 9999)).toBe(true);
  });

  it('includes all features', () => {
    const plan = getPlan('premium');
    plan.features.forEach((feature) => {
      expect(feature.included).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Feature access by plan
// ---------------------------------------------------------------------------

describe('canAccess', () => {
  it('basic plan includes PDF export', () => {
    expect(canAccess('basic', 'pdf_export')).toBe(true);
  });

  it('pro plan includes collaboration', () => {
    expect(canAccess('pro', 'collaboration')).toBe(true);
  });

  it('pro plan includes no ads', () => {
    expect(canAccess('pro', 'no_ads')).toBe(true);
  });

  it('premium plan includes AI autopilot', () => {
    expect(canAccess('premium', 'ai_autopilot')).toBe(true);
  });

  it('premium plan includes offline', () => {
    expect(canAccess('premium', 'offline')).toBe(true);
  });

  it('returns false for unknown feature', () => {
    expect(canAccess('premium', 'nonexistent_feature')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// checkTripLimit
// ---------------------------------------------------------------------------

describe('checkTripLimit', () => {
  it('free user can create first trip', () => {
    expect(checkTripLimit('free', 0)).toBe(true);
  });

  it('free user cannot create second trip', () => {
    expect(checkTripLimit('free', 1)).toBe(false);
  });

  it('basic user can create up to max', () => {
    expect(checkTripLimit('basic', 2)).toBe(true);
    expect(checkTripLimit('basic', 3)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// checkStopLimit
// ---------------------------------------------------------------------------

describe('checkStopLimit', () => {
  it('free user can add stops within limit', () => {
    expect(checkStopLimit('free', 6)).toBe(true);
  });

  it('free user cannot exceed stop limit', () => {
    expect(checkStopLimit('free', 7)).toBe(false);
  });

  it('premium user can add many stops', () => {
    expect(checkStopLimit('premium', 149)).toBe(true);
    expect(checkStopLimit('premium', 150)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// meetsMinimumPlan (upgrade path logic)
// ---------------------------------------------------------------------------

describe('meetsMinimumPlan', () => {
  it('free meets free', () => {
    expect(meetsMinimumPlan('free', 'free')).toBe(true);
  });

  it('free does not meet basic', () => {
    expect(meetsMinimumPlan('free', 'basic')).toBe(false);
  });

  it('basic meets basic', () => {
    expect(meetsMinimumPlan('basic', 'basic')).toBe(true);
  });

  it('pro meets basic', () => {
    expect(meetsMinimumPlan('pro', 'basic')).toBe(true);
  });

  it('premium meets everything', () => {
    expect(meetsMinimumPlan('premium', 'free')).toBe(true);
    expect(meetsMinimumPlan('premium', 'basic')).toBe(true);
    expect(meetsMinimumPlan('premium', 'pro')).toBe(true);
    expect(meetsMinimumPlan('premium', 'premium')).toBe(true);
  });

  it('basic does not meet pro', () => {
    expect(meetsMinimumPlan('basic', 'pro')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getPlanPrice
// ---------------------------------------------------------------------------

describe('getPlanPrice', () => {
  it('returns 0 for free plan', () => {
    expect(getPlanPrice('free', 'monthly')).toBe(0);
    expect(getPlanPrice('free', 'annual')).toBe(0);
  });

  it('annual is cheaper than 12x monthly', () => {
    const slugs: PlanSlug[] = ['basic', 'pro', 'premium'];
    for (const slug of slugs) {
      const monthly12 = getPlanPrice(slug, 'monthly') * 12;
      const annual = getPlanPrice(slug, 'annual');
      expect(annual).toBeLessThan(monthly12);
    }
  });
});

// ---------------------------------------------------------------------------
// formatPlanPrice
// ---------------------------------------------------------------------------

describe('formatPlanPrice', () => {
  it('returns "Gratis" for 0 cents', () => {
    expect(formatPlanPrice(0)).toBe('Gratis');
  });

  it('formats non-zero price with $ sign', () => {
    const result = formatPlanPrice(9900);
    expect(result).toContain('$');
    expect(result).toContain('99');
  });
});

// ---------------------------------------------------------------------------
// PLANS array
// ---------------------------------------------------------------------------

describe('PLANS array', () => {
  it('has exactly 4 plans', () => {
    expect(PLANS).toHaveLength(4);
  });

  it('has one recommended plan', () => {
    const recommended = PLANS.filter((p) => p.isRecommended);
    expect(recommended).toHaveLength(1);
    expect(recommended[0].slug).toBe('pro');
  });

  it('all plans have unique slugs', () => {
    const slugs = PLANS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
