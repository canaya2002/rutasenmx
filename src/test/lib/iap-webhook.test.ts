/**
 * Contract tests for POST /api/iap/sync — the RevenueCat webhook.
 *
 * Same philosophy as stripe-webhook.test.ts:
 *   - Mock @/db so insert/update/select record what would hit the DB.
 *   - Mock analytics.emit so we can assert funnel events fire.
 *   - Hand the route a synthetic RevenueCat event and assert the result.
 *
 * This is the ONLY path that turns a paid in-app purchase into an `active`
 * row in `mobile_subscriptions`. If it silently no-ops, every IAP subscriber
 * stays on `free` in `/api/entitlements`.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

interface RecordedCall {
  op: 'insert' | 'update';
  table: string;
  values?: Record<string, unknown>;
}

const recorder: RecordedCall[] = [];
let fakeExistingRow: { id: string } | null = null;

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
    if (opInit === 'select' && table === 'mobile_subscriptions') {
      return fakeExistingRow ? [fakeExistingRow] : [];
    }
    return [];
  });
  node.returning = vi.fn(async () => []);
  node.then = (onFulfilled: (v: unknown[]) => unknown) => onFulfilled([]);
  return node;
}

vi.mock('@/db', () => ({
  db: {
    insert: (t: { _: { name: string } }) =>
      makeChain('insert', t._?.name ?? 'mobile_subscriptions'),
    update: (t: { _: { name: string } }) =>
      makeChain('update', t._?.name ?? 'mobile_subscriptions'),
    select: () => makeChain('select', 'mobile_subscriptions'),
  },
  mobileSubscriptions: { _: { name: 'mobile_subscriptions' } },
}));

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ col, val }),
  and: (...args: unknown[]) => ({ and: args }),
}));

const emitMock = vi.fn();
vi.mock('@/lib/analytics', () => ({
  EVENTS: {
    iap_completed: 'iap_completed',
    iap_blocked_cross_platform: 'iap_blocked_cross_platform',
    checkout_completed: 'checkout_completed',
    subscription_canceled: 'subscription_canceled',
  },
  emit: (name: string, payload: unknown) => emitMock(name, payload),
}));

// Keep the rate limiter permissive during tests.
vi.mock('@/lib/auth/rate-limit', () => ({
  checkAuthRateLimit: () => ({ allowed: true, retryAfterSeconds: 0 }),
  getClientIp: () => '127.0.0.1',
}));

// Route imports the mocks above, so import it AFTER vi.mock calls.
import { POST } from '@/app/api/iap/sync/route';

const VALID_SECRET = 'test-webhook-secret';

function buildRequest(body: unknown, opts?: { token?: string | null }): Request {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (opts?.token !== null) {
    headers.authorization = `Bearer ${opts?.token ?? VALID_SECRET}`;
  }
  return new Request('http://localhost/api/iap/sync', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

function renewalEvent(overrides: Record<string, unknown> = {}) {
  return {
    api_version: '1.0',
    event: {
      type: 'INITIAL_PURCHASE',
      app_user_id: 'user-abc',
      original_app_user_id: 'user-abc',
      product_id: 'pro_monthly',
      store: 'APP_STORE',
      original_transaction_id: 'txn-001',
      purchased_at_ms: 1_700_000_000_000,
      expiration_at_ms: 1_700_000_000_000 + 30 * 24 * 3600 * 1000,
      environment: 'PRODUCTION',
      price_in_purchased_currency: 99,
      currency: 'MXN',
      ...overrides,
    },
  };
}

describe('POST /api/iap/sync', () => {
  beforeEach(() => {
    recorder.length = 0;
    fakeExistingRow = null;
    emitMock.mockReset();
    process.env.REVENUECAT_WEBHOOK_SECRET = VALID_SECRET;
  });

  it('returns 401 when the Bearer token is missing', async () => {
    const res = await POST(buildRequest(renewalEvent(), { token: null }));
    expect(res.status).toBe(401);
    expect(recorder).toHaveLength(0);
  });

  it('returns 401 when the Bearer token is wrong', async () => {
    const res = await POST(buildRequest(renewalEvent(), { token: 'nope' }));
    expect(res.status).toBe(401);
    expect(recorder).toHaveLength(0);
  });

  it('fails closed (500) when REVENUECAT_WEBHOOK_SECRET is not configured', async () => {
    delete process.env.REVENUECAT_WEBHOOK_SECRET;
    const res = await POST(buildRequest(renewalEvent()));
    expect(res.status).toBe(500);
    expect(recorder).toHaveLength(0);
  });

  it('400s on malformed JSON body', async () => {
    const bad = new Request('http://localhost/api/iap/sync', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${VALID_SECRET}`,
      },
      body: '{not json',
    });
    const res = await POST(bad);
    expect(res.status).toBe(400);
  });

  it('400s on a payload that fails the Zod schema', async () => {
    const res = await POST(
      buildRequest({ event: { type: 'NOPE', app_user_id: '' } }),
    );
    expect(res.status).toBe(400);
  });

  it('acknowledges TEST events without persisting anything', async () => {
    const res = await POST(
      buildRequest({
        event: { type: 'TEST', app_user_id: 'user-abc' },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.test).toBe(true);
    expect(recorder).toHaveLength(0);
  });

  it('inserts a new mobile_subscriptions row on INITIAL_PURCHASE', async () => {
    fakeExistingRow = null;
    const res = await POST(buildRequest(renewalEvent()));
    expect(res.status).toBe(200);

    const inserts = recorder.filter(
      (c) => c.op === 'insert' && c.table === 'mobile_subscriptions',
    );
    expect(inserts).toHaveLength(1);
    expect(inserts[0].values?.userId).toBe('user-abc');
    expect(inserts[0].values?.planSlug).toBe('pro');
    expect(inserts[0].values?.source).toBe('apple_iap');
    expect(inserts[0].values?.status).toBe('active');
    expect(inserts[0].values?.originalTransactionId).toBe('txn-001');
    expect(inserts[0].values?.environment).toBe('production');
  });

  it('updates an existing row instead of duplicating (idempotent replay)', async () => {
    fakeExistingRow = { id: 'row-uuid-1' };
    const res = await POST(buildRequest(renewalEvent({ type: 'RENEWAL' })));
    expect(res.status).toBe(200);

    const inserts = recorder.filter(
      (c) => c.op === 'insert' && c.table === 'mobile_subscriptions',
    );
    const updates = recorder.filter(
      (c) => c.op === 'update' && c.table === 'mobile_subscriptions',
    );
    expect(inserts).toHaveLength(0);
    expect(updates).toHaveLength(1);
    expect(updates[0].values?.status).toBe('active');
  });

  it('maps premium product id to planSlug=premium and Play Store → google_iap', async () => {
    fakeExistingRow = null;
    const res = await POST(
      buildRequest(
        renewalEvent({
          product_id: 'premium_annual',
          store: 'PLAY_STORE',
          original_transaction_id: 'GPA.1234-5678',
        }),
      ),
    );
    expect(res.status).toBe(200);
    const inserts = recorder.filter(
      (c) => c.op === 'insert' && c.table === 'mobile_subscriptions',
    );
    expect(inserts[0].values?.planSlug).toBe('premium');
    expect(inserts[0].values?.source).toBe('google_iap');
  });

  it('ignores events for unknown products (200, no write)', async () => {
    fakeExistingRow = null;
    const res = await POST(
      buildRequest(renewalEvent({ product_id: 'some_random_sku' })),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ignored).toBe(true);
    expect(recorder).toHaveLength(0);
  });

  it('marks the row expired on EXPIRATION and emits subscription_canceled', async () => {
    fakeExistingRow = { id: 'row-uuid-2' };
    const res = await POST(
      buildRequest(renewalEvent({ type: 'EXPIRATION' })),
    );
    expect(res.status).toBe(200);

    const updates = recorder.filter(
      (c) => c.op === 'update' && c.table === 'mobile_subscriptions',
    );
    expect(updates).toHaveLength(1);
    expect(updates[0].values?.status).toBe('expired');
    expect(
      emitMock.mock.calls.some(
        ([name]) => name === 'subscription_canceled',
      ),
    ).toBe(true);
  });

  it('maps BILLING_ISSUE → in_grace_period', async () => {
    fakeExistingRow = { id: 'row-uuid-3' };
    const res = await POST(
      buildRequest(renewalEvent({ type: 'BILLING_ISSUE' })),
    );
    expect(res.status).toBe(200);
    const updates = recorder.filter(
      (c) => c.op === 'update' && c.table === 'mobile_subscriptions',
    );
    expect(updates[0].values?.status).toBe('in_grace_period');
  });

  it('emits iap_completed + checkout_completed on INITIAL_PURCHASE', async () => {
    fakeExistingRow = null;
    await POST(buildRequest(renewalEvent()));
    const names = emitMock.mock.calls.map(([name]) => name);
    expect(names).toContain('iap_completed');
    expect(names).toContain('checkout_completed');
  });
});
