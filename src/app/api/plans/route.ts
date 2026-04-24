import { NextResponse } from 'next/server';

import { getLocalizedPlans } from '@/lib/subscription/plans';
import { PLAN_LIMITS } from '@/lib/constants';

/**
 * GET /api/plans?locale=es|en
 *
 * Returns the canonical plan list for any client (web, mobile, admin).
 * Clients never hardcode pricing — a single deploy updates everywhere.
 *
 * Cached at the edge for 5 minutes: plans rarely change, and the rare time
 * they do, the deploy invalidates the cache. No auth required.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'es';

  const plans = getLocalizedPlans(locale).map((p) => ({
    ...p,
    // Serialize Infinity as null so JSON is well-defined.
    maxSavedTrips: p.maxSavedTrips === Infinity ? null : p.maxSavedTrips,
  }));

  return NextResponse.json(
    {
      plans,
      limits: PLAN_LIMITS,
      currency: 'MXN',
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
      },
    },
  );
}
