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
    expect(getPlan('pro').slug).toBe('pro');
    expect(getPlan('premium').slug).toBe('premium');
  });

  it('throws for unknown plan slug', () => {
    expect(() => getPlan('nonexistent' as PlanSlug)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Plan limits
// ---------------------------------------------------------------------------

describe('plan limits', () => {
  it('free plan has restricted trip limit', () => {
    expect(getPlan('free').maxSavedTrips).toBe(1);
  });

  it('free plan has restricted stops per trip', () => {
    expect(getPlan('free').maxStopsPerTrip).toBe(7);
  });

  it('pro plan has more trips than free', () => {
    expect(getPlan('pro').maxSavedTrips).toBeGreaterThan(
      getPlan('free').maxSavedTrips,
    );
  });

  it('pro plan gives at least 10 saved trips', () => {
    expect(getPlan('pro').maxSavedTrips).toBeGreaterThanOrEqual(10);
  });

  it('premium plan has unlimited trips', () => {
    expect(getPlan('premium').maxSavedTrips).toBe(Infinity);
  });

  it('premium plan has the most stops per trip', () => {
    expect(getPlan('premium').maxStopsPerTrip).toBeGreaterThan(
      getPlan('pro').maxStopsPerTrip,
    );
  });
});

// ---------------------------------------------------------------------------
// Free plan restrictions (watermarked export, no premium features)
// ---------------------------------------------------------------------------

describe('free plan restrictions', () => {
  it('includes PDF export (watermarked)', () => {
    expect(canAccess('free', 'pdf_export')).toBe(true);
  });

  it('does not include clean export (no watermark)', () => {
    expect(canAccess('free', 'clean_export')).toBe(false);
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

  it('does not include social connect', () => {
    expect(canAccess('free', 'social_connect')).toBe(false);
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
// Pro plan — the conversion target
// ---------------------------------------------------------------------------

describe('pro plan', () => {
  it('includes clean export (no watermark)', () => {
    expect(canAccess('pro', 'clean_export')).toBe(true);
  });

  it('includes no_ads', () => {
    expect(canAccess('pro', 'no_ads')).toBe(true);
  });

  it('includes collaboration', () => {
    expect(canAccess('pro', 'collaboration')).toBe(true);
  });

  it('includes AI autopilot (upgrade trigger)', () => {
    expect(canAccess('pro', 'ai_autopilot')).toBe(true);
  });

  it('includes social connect', () => {
    expect(canAccess('pro', 'social_connect')).toBe(true);
  });

  it('does not include offline mode (premium-only)', () => {
    expect(canAccess('pro', 'offline')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Premium plan — the "no limits" tier
// ---------------------------------------------------------------------------

describe('premium plan', () => {
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

  it('includes AI autopilot', () => {
    expect(canAccess('premium', 'ai_autopilot')).toBe(true);
  });

  it('includes offline mode', () => {
    expect(canAccess('premium', 'offline')).toBe(true);
  });

  it('includes social connect', () => {
    expect(canAccess('premium', 'social_connect')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// canAccess edge cases
// ---------------------------------------------------------------------------

describe('canAccess', () => {
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

  it('pro user can create up to max', () => {
    expect(checkTripLimit('pro', 9)).toBe(true);
    expect(checkTripLimit('pro', 10)).toBe(false);
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

  it('free does not meet pro', () => {
    expect(meetsMinimumPlan('free', 'pro')).toBe(false);
  });

  it('pro meets free and pro', () => {
    expect(meetsMinimumPlan('pro', 'free')).toBe(true);
    expect(meetsMinimumPlan('pro', 'pro')).toBe(true);
  });

  it('pro does not meet premium', () => {
    expect(meetsMinimumPlan('pro', 'premium')).toBe(false);
  });

  it('premium meets everything', () => {
    expect(meetsMinimumPlan('premium', 'free')).toBe(true);
    expect(meetsMinimumPlan('premium', 'pro')).toBe(true);
    expect(meetsMinimumPlan('premium', 'premium')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Pricing contract — $99 Pro, $299 Premium
// ---------------------------------------------------------------------------

describe('getPlanPrice', () => {
  it('returns 0 for free plan', () => {
    expect(getPlanPrice('free', 'monthly')).toBe(0);
    expect(getPlanPrice('free', 'annual')).toBe(0);
  });

  it('pro monthly is $99 MXN (9900 cents)', () => {
    expect(getPlanPrice('pro', 'monthly')).toBe(9900);
  });

  it('premium monthly is $299 MXN (29900 cents)', () => {
    expect(getPlanPrice('premium', 'monthly')).toBe(29900);
  });

  it('annual is cheaper than 12x monthly', () => {
    const slugs: PlanSlug[] = ['pro', 'premium'];
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
// PLANS array contract
// ---------------------------------------------------------------------------

describe('PLANS array', () => {
  it('has exactly 3 plans after consolidation', () => {
    expect(PLANS).toHaveLength(3);
  });

  it('contains free, pro, premium in that order', () => {
    expect(PLANS.map((p) => p.slug)).toEqual(['free', 'pro', 'premium']);
  });

  it('has exactly one recommended plan, which is Pro', () => {
    const recommended = PLANS.filter((p) => p.isRecommended);
    expect(recommended).toHaveLength(1);
    expect(recommended[0].slug).toBe('pro');
  });

  it('all plans have unique slugs', () => {
    const slugs = PLANS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
