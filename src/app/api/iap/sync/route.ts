import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

import { db, mobileSubscriptions } from '@/db';
import { emit, EVENTS } from '@/lib/analytics';
import { getClientIp, checkAuthRateLimit } from '@/lib/auth/rate-limit';

/**
 * RevenueCat webhook. Single entry point that turns a paid IAP on iOS or
 * Android into a row in `mobile_subscriptions`. The entitlements endpoint
 * reads that row together with Stripe subs to decide the user's effective
 * plan — see `getActiveSubscriptions` in `lib/subscription/current-plan.ts`.
 *
 * Security:
 *   - Requires `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>` exactly.
 *   - Rate-limited per IP to prevent credential-less flooding.
 *   - All writes keyed on `original_transaction_id` (unique index) so
 *     replay webhook deliveries upsert idempotently.
 *
 * Reference: https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
 */

const EVENT_TYPES = [
  'TEST',
  'INITIAL_PURCHASE',
  'RENEWAL',
  'CANCELLATION',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'EXPIRATION',
  'BILLING_ISSUE',
  'PRODUCT_CHANGE',
  'TRANSFER',
  'SUBSCRIPTION_PAUSED',
  'SUBSCRIPTION_EXTENDED',
  'REFUND',
] as const;

const webhookSchema = z.object({
  api_version: z.string().optional(),
  event: z.object({
    type: z.enum(EVENT_TYPES),
    app_user_id: z.string().min(1),
    original_app_user_id: z.string().optional(),
    product_id: z.string().optional(),
    entitlement_ids: z.array(z.string()).optional().nullable(),
    store: z.enum(['APP_STORE', 'PLAY_STORE', 'STRIPE', 'AMAZON']).optional(),
    expiration_at_ms: z.number().optional().nullable(),
    purchased_at_ms: z.number().optional().nullable(),
    original_transaction_id: z.string().optional().nullable(),
    period_type: z.string().optional(),
    environment: z.enum(['SANDBOX', 'PRODUCTION']).optional(),
    price_in_purchased_currency: z.number().optional().nullable(),
    currency: z.string().optional().nullable(),
  }),
});

/** Maps a product id like "pro_monthly" / "premium_annual" to our plan slug. */
function productIdToPlan(productId: string | undefined): 'pro' | 'premium' | null {
  if (!productId) return null;
  const lower = productId.toLowerCase();
  if (lower.includes('premium')) return 'premium';
  if (lower.includes('pro')) return 'pro';
  return null;
}

/** Maps a RevenueCat event type to our `mobile_subscriptions.status`. */
function eventToStatus(type: (typeof EVENT_TYPES)[number]): string {
  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION':
    case 'NON_RENEWING_PURCHASE':
    case 'PRODUCT_CHANGE':
    case 'TRANSFER':
    case 'SUBSCRIPTION_EXTENDED':
      return 'active';
    case 'CANCELLATION':
      // User canceled but sub is still valid until expiration.
      return 'active';
    case 'BILLING_ISSUE':
      return 'in_grace_period';
    case 'SUBSCRIPTION_PAUSED':
      return 'paused';
    case 'EXPIRATION':
      return 'expired';
    case 'REFUND':
      return 'canceled';
    default:
      return 'active';
  }
}

function storeToSource(store: string | undefined): 'apple_iap' | 'google_iap' | null {
  if (store === 'APP_STORE') return 'apple_iap';
  if (store === 'PLAY_STORE') return 'google_iap';
  return null;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkAuthRateLimit(`iap-sync:${ip}`, 120, 60);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit', retryAfter: rl.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    );
  }

  // ── Authenticate the webhook ─────────────────────────────────────────────
  const expectedSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!expectedSecret) {
    // Fail closed — we do NOT accept unauthenticated IAP events in production.
    console.error('[iap/sync] REVENUECAT_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 },
    );
  }
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.toLowerCase().startsWith('bearer ')
    ? auth.slice('Bearer '.length).trim()
    : '';
  if (token !== expectedSecret) {
    console.warn('[iap/sync] bad Bearer token from', ip);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Payload invalido', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const ev = parsed.data.event;

  // TEST events (from the RevenueCat dashboard "Send test event" button) are
  // acknowledged but not persisted.
  if (ev.type === 'TEST') {
    return NextResponse.json({ ok: true, test: true });
  }

  const userId = ev.app_user_id;
  const planSlug = productIdToPlan(ev.product_id);
  const source = storeToSource(ev.store);

  if (!planSlug || !source) {
    // Unknown product or unsupported store — log and 200 so RevenueCat
    // doesn't retry indefinitely, but don't write anything.
    console.warn('[iap/sync] ignoring event with unknown mapping', {
      type: ev.type,
      productId: ev.product_id,
      store: ev.store,
    });
    return NextResponse.json({ ok: true, ignored: true });
  }

  const status = eventToStatus(ev.type);
  const periodStart = ev.purchased_at_ms ? new Date(ev.purchased_at_ms) : null;
  const periodEnd = ev.expiration_at_ms ? new Date(ev.expiration_at_ms) : null;
  const environment = ev.environment === 'SANDBOX' ? 'sandbox' : 'production';
  const originalTransactionId =
    ev.original_transaction_id ??
    // Some event types don't include it; synthesize from user + product.
    `${userId}:${ev.product_id ?? 'unknown'}`;

  // ── Upsert keyed on original_transaction_id ──────────────────────────────
  try {
    const [existing] = await db
      .select()
      .from(mobileSubscriptions)
      .where(eq(mobileSubscriptions.originalTransactionId, originalTransactionId))
      .limit(1);

    const values = {
      userId,
      source,
      revenueCatUserId: ev.original_app_user_id ?? userId,
      productId: ev.product_id ?? '',
      planSlug,
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      originalTransactionId,
      environment,
    };

    if (existing) {
      await db
        .update(mobileSubscriptions)
        .set(values)
        .where(eq(mobileSubscriptions.id, existing.id));
    } else {
      await db.insert(mobileSubscriptions).values(values);
    }
  } catch (err) {
    console.error('[iap/sync] DB error', err);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 },
    );
  }

  // ── Analytics (same taxonomy as Stripe flow) ─────────────────────────────
  if (ev.type === 'INITIAL_PURCHASE' || ev.type === 'NON_RENEWING_PURCHASE') {
    emit(EVENTS.iap_completed, {
      userId,
      properties: {
        productId: ev.product_id,
        plan: planSlug,
        store: source,
        priceLocal: ev.price_in_purchased_currency ?? null,
        currency: ev.currency ?? null,
      },
    });
    emit(EVENTS.checkout_completed, {
      userId,
      properties: {
        plan: planSlug,
        source,
      },
    });
  } else if (ev.type === 'EXPIRATION' || ev.type === 'REFUND') {
    emit(EVENTS.subscription_canceled, {
      userId,
      properties: {
        plan: planSlug,
        source,
        reason: ev.type.toLowerCase(),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
