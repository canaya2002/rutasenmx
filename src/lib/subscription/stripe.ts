import Stripe from 'stripe';
import { db, subscriptions, billingEvents } from '@/db';
import { eq } from 'drizzle-orm';
import type { PlanSlug, BillingInterval } from './plans';
import { getPlanIdBySlug } from './current-plan';
import { emit, EVENTS } from '@/lib/analytics';

// ── Stripe client ──────────────────────────────────────────────────────────
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key);
}

// ── Checkout ───────────────────────────────────────────────────────────────
export async function createCheckoutSession(
  userId: string,
  planSlug: PlanSlug,
  interval: BillingInterval,
): Promise<string> {
  const stripe = getStripe();

  const priceId =
    interval === 'monthly'
      ? process.env[`STRIPE_PRICE_${planSlug.toUpperCase()}_MONTHLY`]
      : process.env[`STRIPE_PRICE_${planSlug.toUpperCase()}_ANNUAL`];

  if (!priceId) {
    throw new Error(`Stripe price ID not configured for ${planSlug}/${interval}`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rutasenmx.com';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/suscripcion?success=1`,
    cancel_url: `${appUrl}/precios?canceled=1`,
    metadata: { userId, planSlug, interval },
    // Propagate metadata to the created Subscription so later webhook events
    // (customer.subscription.updated/deleted) can still resolve userId + planSlug.
    subscription_data: {
      metadata: { userId, planSlug, interval },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    locale: 'es',
  });

  return session.url!;
}

// ── Billing Portal ─────────────────────────────────────────────────────────
export async function createPortalSession(userId: string): Promise<string> {
  const stripe = getStripe();

  // Find the user's Stripe customer ID from their subscription
  const [sub] = await db
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!sub?.stripeCustomerId) {
    throw new Error('No Stripe customer found for this user');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rutasenmx.com';

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${appUrl}/suscripcion`,
  });

  return session.url;
}

// ── Webhook handling ───────────────────────────────────────────────────────
export async function handleWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscription(subscription);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      await logBillingEvent(
        (invoice.metadata as Record<string, string>)?.userId ?? null,
        event.id,
        'invoice.payment_succeeded',
        invoice.amount_paid,
        (invoice.currency || 'mxn').toUpperCase(),
      );
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await logBillingEvent(
        (invoice.metadata as Record<string, string>)?.userId ?? null,
        event.id,
        'invoice.payment_failed',
        invoice.amount_due,
        (invoice.currency || 'mxn').toUpperCase(),
      );
      break;
    }
  }
}

// ── Internal helpers ───────────────────────────────────────────────────────
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId;
  if (!userId || !session.subscription) return;

  const stripe = getStripe();
  const stripeSubscription = await stripe.subscriptions.retrieve(
    session.subscription as string,
  );

  await syncSubscription(stripeSubscription, userId);

  emit(EVENTS.checkout_completed, {
    userId,
    properties: {
      plan: session.metadata?.planSlug ?? null,
      interval: session.metadata?.interval ?? null,
      amount: session.amount_total ?? null,
      currency: (session.currency ?? 'mxn').toUpperCase(),
    },
  });
}

export async function syncSubscription(
  stripeSubscription: Stripe.Subscription,
  userId?: string,
): Promise<void> {
  const resolvedUserId =
    userId ?? (stripeSubscription.metadata?.userId as string | undefined);
  if (!resolvedUserId) return;

  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'canceled',
    unpaid: 'past_due',
    paused: 'canceled',
  };

  const mappedStatus = statusMap[stripeSubscription.status] ?? 'incomplete';

  // Check if subscription exists
  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id))
    .limit(1);

  const subData = {
    userId: resolvedUserId,
    stripeSubscriptionId: stripeSubscription.id,
    stripeCustomerId:
      typeof stripeSubscription.customer === 'string'
        ? stripeSubscription.customer
        : stripeSubscription.customer?.id ?? null,
    status: mappedStatus as 'active' | 'past_due' | 'canceled' | 'incomplete',
    currentPeriodStart: new Date((stripeSubscription as unknown as { current_period_start: number }).current_period_start * 1000),
    currentPeriodEnd: new Date((stripeSubscription as unknown as { current_period_end: number }).current_period_end * 1000),
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
  };

  // Checkout sets metadata.planSlug; some older sessions may still carry planId.
  // Resolve to a real plan row UUID before inserting.
  const slugFromMetadata = stripeSubscription.metadata?.planSlug as
    | PlanSlug
    | undefined;
  const planIdFromMetadata = stripeSubscription.metadata?.planId as
    | string
    | undefined;
  const resolvedPlanId = slugFromMetadata
    ? await getPlanIdBySlug(slugFromMetadata)
    : planIdFromMetadata ?? null;

  if (existing) {
    await db
      .update(subscriptions)
      .set({
        ...subData,
        ...(resolvedPlanId ? { planId: resolvedPlanId } : {}),
      })
      .where(eq(subscriptions.id, existing.id));
  } else {
    if (!resolvedPlanId) {
      console.error(
        'Stripe syncSubscription: no planId resolvable from metadata',
        stripeSubscription.id,
        stripeSubscription.metadata,
      );
      return;
    }
    await db.insert(subscriptions).values({
      ...subData,
      planId: resolvedPlanId,
    });
  }
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
  await db
    .update(subscriptions)
    .set({ status: 'canceled' })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id));

  const userId = stripeSubscription.metadata?.userId as string | undefined;
  if (userId) {
    emit(EVENTS.subscription_canceled, {
      userId,
      properties: {
        plan: stripeSubscription.metadata?.planSlug ?? null,
      },
    });
  }
}

async function logBillingEvent(
  userId: string | null,
  stripeEventId: string,
  eventType: string,
  amountCents: number | null,
  currency: string,
): Promise<void> {
  await db.insert(billingEvents).values({
    userId,
    stripeEventId,
    eventType,
    amountCents: amountCents ?? 0,
    currency,
  });
}
