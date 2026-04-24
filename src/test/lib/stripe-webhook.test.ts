/**
 * Webhook sync tests.
 *
 * We do not call the real Stripe API. Instead we:
 *   1. Mock @/db so insert/update/select record what we would have written.
 *   2. Mock @/lib/subscription/current-plan.getPlanIdBySlug so the fake
 *      plan_id lookup returns a deterministic UUID.
 *   3. Hand `handleWebhook` a synthetic Stripe event and assert the call
 *      graph that should result.
 *
 * Why this matters: the webhook is the ONLY path that turns a paid Checkout
 * into an `active` subscription in our DB. If it silently no-ops (as it used
 * to, because the old code read `metadata.planId` which checkout never set),
 * every paying user stays on `free`. Tests here are the contract that keeps
 * that regression from coming back.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type Stripe from 'stripe';

// ── In-memory recorder doubling as the Drizzle query builder ────────────────
interface RecordedCall {
  op: 'insert' | 'update';
  table: string;
  values?: Record<string, unknown>;
  where?: string;
}

const recorder: RecordedCall[] = [];

// Stub the subscriptions row returned by "select ... where stripeSubId = ..."
let fakeExistingSub: { id: string } | null = null;

function makeChain(opInit: 'insert' | 'update' | 'select', table: string) {
  const node: Record<string, unknown> = {};
  node.values = vi.fn((v: Record<string, unknown>) => {
    recorder.push({ op: 'insert', table, values: v });
    return node;
  });
  node.set = vi.fn((v: Record<string, unknown>) => {
    recorder.push({ op: 'update', table, values: v });
    return node;
  });
  node.where = vi.fn(() => node);
  node.from = vi.fn(() => node);
  node.limit = vi.fn(async () => {
    if (opInit === 'select' && table === 'subscriptions') {
      return fakeExistingSub ? [fakeExistingSub] : [];
    }
    return [];
  });
  node.returning = vi.fn(async () => []);
  // If a chain is awaited directly (no .limit()/.returning()), resolve empty.
  node.then = (onFulfilled: (v: unknown[]) => unknown) => onFulfilled([]);
  return node;
}

vi.mock('@/db', () => ({
  db: {
    insert: (t: { _: { name: string } }) =>
      makeChain('insert', t._?.name ?? 'subscriptions'),
    update: (t: { _: { name: string } }) =>
      makeChain('update', t._?.name ?? 'subscriptions'),
    select: () => makeChain('select', 'subscriptions'),
  },
  subscriptions: { _: { name: 'subscriptions' } },
  billingEvents: { _: { name: 'billing_events' } },
}));

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ col, val }),
}));

vi.mock('@/lib/subscription/current-plan', () => ({
  getPlanIdBySlug: vi.fn(async (slug: string) => `plan-uuid-${slug}`),
}));

vi.mock('@/lib/analytics', () => ({
  EVENTS: {
    checkout_completed: 'checkout_completed',
    subscription_canceled: 'subscription_canceled',
  },
  emit: vi.fn(),
}));

// ── Import the webhook handler AFTER mocks ──────────────────────────────────
import { handleWebhook, syncSubscription } from '@/lib/subscription/stripe';

// Build a minimally-typed Stripe.Subscription skeleton — only the fields the
// handler actually reads need to be populated.
function makeStripeSubscription(
  overrides: Partial<Stripe.Subscription> & {
    metadata?: Record<string, string>;
  } = {},
): Stripe.Subscription {
  const now = Math.floor(Date.now() / 1000);
  const { metadata: metadataOverride, ...rest } = overrides;
  return {
    id: 'sub_test_123',
    object: 'subscription',
    status: 'active',
    customer: 'cus_test_123',
    cancel_at_period_end: false,
    // Stripe API types these as snake_case but TS lib types vary by version;
    // the webhook handler reads them via `as unknown as { current_period_*: number }`.
    current_period_start: now - 3600,
    current_period_end: now + 30 * 24 * 3600,
    ...rest,
    metadata: {
      userId: 'user-abc',
      planSlug: 'pro',
      interval: 'monthly',
      ...(metadataOverride ?? {}),
    },
  } as unknown as Stripe.Subscription;
}

// ── Tests ───────────────────────────────────────────────────────────────────
describe('handleWebhook', () => {
  beforeEach(() => {
    recorder.length = 0;
    fakeExistingSub = null;
  });

  it('ignores event types that are not subscription-related', async () => {
    const event: Stripe.Event = {
      id: 'evt_x',
      type: 'ping' as unknown as Stripe.Event.Type,
      data: { object: {} as unknown as Stripe.Subscription },
    } as unknown as Stripe.Event;
    await expect(handleWebhook(event)).resolves.toBeUndefined();
    expect(recorder).toHaveLength(0);
  });

  it('inserts a new subscription on customer.subscription.updated when none exists', async () => {
    fakeExistingSub = null;
    const sub = makeStripeSubscription();
    const event = {
      id: 'evt_1',
      type: 'customer.subscription.updated',
      data: { object: sub },
    } as unknown as Stripe.Event;

    await handleWebhook(event);

    const inserts = recorder.filter((c) => c.op === 'insert' && c.table === 'subscriptions');
    expect(inserts).toHaveLength(1);
    // The critical regression: planId must come from getPlanIdBySlug('pro'),
    // not from metadata.planId (which checkout never set).
    expect(inserts[0].values?.planId).toBe('plan-uuid-pro');
    expect(inserts[0].values?.userId).toBe('user-abc');
    expect(inserts[0].values?.stripeSubscriptionId).toBe('sub_test_123');
    expect(inserts[0].values?.status).toBe('active');
  });

  it('updates an existing subscription instead of inserting a duplicate', async () => {
    fakeExistingSub = { id: 'row-uuid-existing' };
    const sub = makeStripeSubscription({
      status: 'past_due' as Stripe.Subscription.Status,
    });
    const event = {
      id: 'evt_2',
      type: 'customer.subscription.updated',
      data: { object: sub },
    } as unknown as Stripe.Event;

    await handleWebhook(event);

    const inserts = recorder.filter((c) => c.op === 'insert' && c.table === 'subscriptions');
    const updates = recorder.filter((c) => c.op === 'update' && c.table === 'subscriptions');

    expect(inserts).toHaveLength(0);
    expect(updates).toHaveLength(1);
    expect(updates[0].values?.status).toBe('past_due');
  });

  it('marks the subscription canceled on customer.subscription.deleted', async () => {
    fakeExistingSub = { id: 'row-uuid-existing' };
    const sub = makeStripeSubscription();
    const event = {
      id: 'evt_3',
      type: 'customer.subscription.deleted',
      data: { object: sub },
    } as unknown as Stripe.Event;

    await handleWebhook(event);

    const updates = recorder.filter((c) => c.op === 'update' && c.table === 'subscriptions');
    expect(updates).toHaveLength(1);
    expect(updates[0].values?.status).toBe('canceled');
  });

  it('records an invoice.payment_succeeded billing event', async () => {
    const event = {
      id: 'evt_4',
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_1',
          amount_paid: 19900,
          currency: 'mxn',
          metadata: { userId: 'user-abc' },
        } as unknown as Stripe.Invoice,
      },
    } as unknown as Stripe.Event;

    await handleWebhook(event);

    const inserts = recorder.filter((c) => c.op === 'insert' && c.table === 'billing_events');
    expect(inserts).toHaveLength(1);
    expect(inserts[0].values?.eventType).toBe('invoice.payment_succeeded');
    expect(inserts[0].values?.amountCents).toBe(19900);
  });

  it('maps Stripe statuses to our internal set', async () => {
    fakeExistingSub = null;

    const cases: Array<{ in: Stripe.Subscription.Status; out: string }> = [
      { in: 'trialing' as Stripe.Subscription.Status, out: 'active' },
      { in: 'unpaid' as Stripe.Subscription.Status, out: 'past_due' },
      { in: 'incomplete_expired' as Stripe.Subscription.Status, out: 'canceled' },
      { in: 'paused' as Stripe.Subscription.Status, out: 'canceled' },
    ];

    for (const c of cases) {
      recorder.length = 0;
      const sub = makeStripeSubscription({ status: c.in });
      await syncSubscription(sub, 'user-abc');
      const inserts = recorder.filter((r) => r.op === 'insert');
      expect(inserts[0]?.values?.status).toBe(c.out);
    }
  });

  it('skips insertion when neither metadata.planSlug nor metadata.planId resolves a plan', async () => {
    fakeExistingSub = null;
    const { getPlanIdBySlug } = await import('@/lib/subscription/current-plan');
    (getPlanIdBySlug as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const sub = makeStripeSubscription({
      metadata: { userId: 'user-abc' }, // no planSlug
    });
    await syncSubscription(sub, 'user-abc');

    const inserts = recorder.filter((c) => c.op === 'insert' && c.table === 'subscriptions');
    expect(inserts).toHaveLength(0);
  });
});
