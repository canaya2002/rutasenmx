import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth/session';
import { getActiveSubscriptions } from '@/lib/subscription/current-plan';
import type { PlanSlug } from '@/lib/subscription/plans';

type EntitlementSource =
  | 'stripe_web'
  | 'apple_iap'
  | 'google_iap'
  | 'none';

interface EntitlementsResponse {
  plan: PlanSlug;
  activeSource: EntitlementSource;
  canUpgradeInApp: boolean;
  canUpgradeOnWeb: boolean;
  message: string | null;
  expiresAt: string | null;
}

/**
 * GET /api/entitlements
 *
 * Single source of truth for "what can this user do, right now, and where
 * did their access come from". Mobile paywalls consult this BEFORE opening an
 * IAP sheet so a user who paid on the web never gets charged twice.
 * Web checkout does the same check before starting a Stripe session.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 },
    );
  }

  const active = await getActiveSubscriptions(session.userId);
  const top = active[0];

  let response: EntitlementsResponse;

  if (!top) {
    response = {
      plan: 'free',
      activeSource: 'none',
      canUpgradeInApp: true,
      canUpgradeOnWeb: true,
      message: null,
      expiresAt: null,
    };
  } else {
    const isWeb = top.source === 'stripe_web';
    response = {
      plan: top.slug,
      activeSource: top.source,
      canUpgradeInApp: !isWeb, // if already on web, can't re-buy on mobile
      canUpgradeOnWeb: isWeb, // if already on mobile, can't re-buy on web
      message: isWeb
        ? 'Tu suscripción se administra en rutasenmx.com/suscripcion.'
        : 'Tu suscripción se administra desde la app móvil (App Store / Google Play).',
      expiresAt: top.expiresAt?.toISOString() ?? null,
    };
  }

  return NextResponse.json(response, {
    headers: {
      // Short cache: entitlements change on any IAP purchase or Stripe webhook
      'Cache-Control': 'private, max-age=30',
    },
  });
}
