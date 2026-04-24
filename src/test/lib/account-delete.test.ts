/**
 * Contract tests for DELETE /api/account.
 *
 * This endpoint satisfies Apple 5.1.1(v) / Play Console policy requiring
 * in-app account deletion. Core guarantees:
 *   - 401 if not logged in.
 *   - Calls Stripe cancel when user has an active subscription.
 *   - Marks mobile IAP rows canceled.
 *   - Removes push tokens.
 *   - Hides social profile and closes matches.
 *   - Anonymizes the user row.
 *   - Clears the session cookie.
 *   - Never throws even if side operations fail.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

interface Call {
  op: 'select' | 'update' | 'delete';
  table?: string;
  values?: Record<string, unknown>;
}

const recorder: Call[] = [];
let activeStripeSub: string | null = 'sub_abc_123';
let sessionOverride: { userId: string; role?: string } | null | undefined;

function selectChain(table: string) {
  const node: Record<string, unknown> = {};
  node.from = vi.fn(() => node);
  node.where = vi.fn(() => node);
  node.limit = vi.fn(async () => {
    recorder.push({ op: 'select', table });
    if (table === 'subscriptions' && activeStripeSub) {
      return [{ stripeSubscriptionId: activeStripeSub, status: 'active' }];
    }
    return [];
  });
  return node;
}

function updateChain(table: string) {
  const node: Record<string, unknown> = {};
  node.set = vi.fn((v: Record<string, unknown>) => {
    recorder.push({ op: 'update', table, values: v });
    return node;
  });
  node.where = vi.fn(async () => []);
  return node;
}

function deleteChain(table: string) {
  const node: Record<string, unknown> = {};
  node.where = vi.fn(async () => {
    recorder.push({ op: 'delete', table });
    return [];
  });
  return node;
}

vi.mock('@/db', () => ({
  db: {
    select: () => selectChain('subscriptions'),
    update: (t: { _: { name: string } }) => updateChain(t._?.name ?? '?'),
    delete: (t: { _: { name: string } }) => deleteChain(t._?.name ?? '?'),
  },
  users: { _: { name: 'users' } },
  subscriptions: {
    _: { name: 'subscriptions' },
    userId: 'userIdCol',
    stripeSubscriptionId: 'stripeSubIdCol',
    status: 'statusCol',
  },
  mobileSubscriptions: { _: { name: 'mobile_subscriptions' }, userId: 'col' },
  pushTokens: { _: { name: 'push_tokens' }, userId: 'col' },
  socialProfiles: { _: { name: 'social_profiles' }, userId: 'col' },
  socialMatches: {
    _: { name: 'social_matches' },
    userAId: 'col',
    userBId: 'col',
  },
  trips: { _: { name: 'trips' } },
  socialMessages: { _: { name: 'social_messages' } },
}));

vi.mock('drizzle-orm', () => ({
  and: (...args: unknown[]) => ({ and: args }),
  eq: (col: unknown, val: unknown) => ({ eq: [col, val] }),
  ne: (col: unknown, val: unknown) => ({ ne: [col, val] }),
  or: (...args: unknown[]) => ({ or: args }),
  inArray: (col: unknown, values: unknown[]) => ({ inArray: [col, values] }),
  isNull: (col: unknown) => ({ isNull: col }),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(async () =>
    sessionOverride === undefined ? { userId: 'user-xyz' } : sessionOverride,
  ),
  clearSession: vi.fn(),
}));

vi.mock('stripe', () => {
  const cancel = vi.fn(async () => ({}));
  const FakeStripe = class {
    subscriptions = { cancel };
  };
  return { default: FakeStripe };
});

vi.mock('@/lib/analytics', () => ({
  EVENTS: { subscription_canceled: 'subscription_canceled' },
  emit: vi.fn(),
}));

import { DELETE } from '@/app/api/account/route';
import { clearSession } from '@/lib/auth/session';
import Stripe from 'stripe';

const clearSessionMock = clearSession as unknown as ReturnType<typeof vi.fn>;
// Grab the mocked cancel fn from an instance.
const stripeInstance = new Stripe('x');
const stripeCancelMock = stripeInstance.subscriptions
  .cancel as unknown as ReturnType<typeof vi.fn>;

describe('DELETE /api/account', () => {
  beforeEach(() => {
    recorder.length = 0;
    activeStripeSub = 'sub_abc_123';
    sessionOverride = undefined;
    clearSessionMock.mockReset();
    stripeCancelMock.mockReset();
    stripeCancelMock.mockResolvedValue({} as never);
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  });

  it('401s when the user is not logged in', async () => {
    sessionOverride = null;
    const res = await DELETE();
    expect(res.status).toBe(401);
    expect(recorder).toHaveLength(0);
  });

  it('cancels the active Stripe subscription', async () => {
    await DELETE();
    expect(stripeCancelMock).toHaveBeenCalledWith('sub_abc_123');
  });

  it('skips Stripe cancel when no active subscription exists', async () => {
    activeStripeSub = null;
    await DELETE();
    expect(stripeCancelMock).not.toHaveBeenCalled();
  });

  it('removes the user\'s push tokens', async () => {
    await DELETE();
    expect(
      recorder.find((c) => c.op === 'delete' && c.table === 'push_tokens'),
    ).toBeDefined();
  });

  it('hides the social profile', async () => {
    await DELETE();
    const hide = recorder.find(
      (c) => c.op === 'update' && c.table === 'social_profiles',
    );
    expect(hide).toBeDefined();
    expect(hide?.values?.isVisible).toBe(false);
  });

  it('closes open matches by setting closedAt + closedByUserId', async () => {
    await DELETE();
    const close = recorder.find(
      (c) => c.op === 'update' && c.table === 'social_matches',
    );
    expect(close).toBeDefined();
    expect(close?.values?.closedByUserId).toBe('user-xyz');
    expect(close?.values?.closedAt).toBeInstanceOf(Date);
  });

  it('soft-deletes + anonymizes the user row', async () => {
    await DELETE();
    const anon = recorder.find(
      (c) => c.op === 'update' && c.table === 'users',
    );
    expect(anon).toBeDefined();
    expect(anon?.values?.name).toBe('Cuenta eliminada');
    expect(anon?.values?.email).toMatch(/^deleted-user-xyz@deleted\.local$/);
    expect(anon?.values?.passwordHash).toBeNull();
    expect(anon?.values?.deletedAt).toBeInstanceOf(Date);
  });

  it('clears the session cookie', async () => {
    await DELETE();
    expect(clearSessionMock).toHaveBeenCalled();
  });

  it('still succeeds if Stripe cancel fails (best-effort)', async () => {
    stripeCancelMock.mockRejectedValueOnce(new Error('network'));
    const res = await DELETE();
    expect(res.status).toBe(200);
    const anon = recorder.find(
      (c) => c.op === 'update' && c.table === 'users',
    );
    expect(anon).toBeDefined();
  });
});
