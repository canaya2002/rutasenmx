/**
 * Tests for /api/cron/hard-delete-users.
 *
 * Contract:
 *   - 401 without the CRON_SECRET bearer.
 *   - 401 when CRON_SECRET is not configured in env (fail-closed).
 *   - 200 + purge count when there are candidates.
 *   - 200 + 0 purge when no one is past the 30-day cutoff.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

let candidates: { id: string }[] = [];

function selectChain() {
  const node: Record<string, unknown> = {};
  node.from = vi.fn(() => node);
  node.where = vi.fn(async () => candidates);
  return node;
}

function deleteChain() {
  const node: Record<string, unknown> = {};
  node.where = vi.fn(() => node);
  // returning() resolves immediately to a fake rowset; for non-returning
  // chains, the outer promise resolves via `await` of `db.delete(...).where(...)`.
  node.returning = vi.fn(async () => candidates);
  // Make the chain awaitable directly.
  (node.where as unknown as { mockImplementation: (f: () => Promise<unknown[]>) => void })
    .mockImplementation(async () => []);
  return node;
}

vi.mock('@/db', () => ({
  db: {
    select: () => selectChain(),
    delete: () => deleteChain(),
  },
  users: { _: { name: 'users' }, id: 'id', deletedAt: 'deletedAt' },
  trips: { _: { name: 'trips' }, id: 'id', userId: 'userId' },
  tripDays: { _: { name: 'trip_days' }, tripId: 'tripId' },
  tripStops: { _: { name: 'trip_stops' }, tripId: 'tripId' },
  savedPlaces: { _: { name: 'saved_places' }, userId: 'userId' },
  socialProfiles: { _: { name: 'social_profiles' }, userId: 'userId' },
  socialSwipes: {
    _: { name: 'social_swipes' },
    fromUserId: 'from',
    toUserId: 'to',
  },
  socialMatches: {
    _: { name: 'social_matches' },
    id: 'id',
    userAId: 'userA',
    userBId: 'userB',
  },
  socialMessages: { _: { name: 'social_messages' }, matchId: 'matchId' },
  socialReports: {
    _: { name: 'social_reports' },
    reporterId: 'rep',
    reportedId: 'tgt',
  },
  socialBlocks: {
    _: { name: 'social_blocks' },
    blockerId: 'bl',
    blockedId: 'bd',
  },
  socialUploads: { _: { name: 'social_uploads' }, userId: 'userId' },
  socialCommunityPosts: {
    _: { name: 'social_community_posts' },
    authorId: 'authorId',
  },
  socialCommunityComments: {
    _: { name: 'social_community_comments' },
    authorId: 'authorId',
  },
  socialCommunityMembers: {
    _: { name: 'social_community_members' },
    userId: 'userId',
  },
  pushTokens: { _: { name: 'push_tokens' }, userId: 'userId' },
  mobileSubscriptions: { _: { name: 'mobile_subscriptions' }, userId: 'userId' },
}));

vi.mock('drizzle-orm', () => ({
  and: (...args: unknown[]) => ({ and: args }),
  lt: (col: unknown, val: unknown) => ({ lt: [col, val] }),
  isNotNull: (col: unknown) => ({ isNotNull: col }),
  inArray: (col: unknown, vals: unknown[]) => ({ inArray: [col, vals] }),
}));

import { POST } from '@/app/api/cron/hard-delete-users/route';

function req(token?: string | null): Request {
  const headers: Record<string, string> = {};
  if (token !== null && token !== undefined) {
    headers.authorization = `Bearer ${token}`;
  }
  return new Request('http://localhost/api/cron/hard-delete-users', {
    method: 'POST',
    headers,
  });
}

describe('POST /api/cron/hard-delete-users', () => {
  beforeEach(() => {
    candidates = [];
    process.env.CRON_SECRET = 'test-secret';
  });

  it('401s when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET;
    const res = await POST(req('anything'));
    expect(res.status).toBe(401);
  });

  it('401s without a Bearer token', async () => {
    const res = await POST(req(null));
    expect(res.status).toBe(401);
  });

  it('401s with the wrong token', async () => {
    const res = await POST(req('nope'));
    expect(res.status).toBe(401);
  });

  it('returns 0 purged when no candidates exist', async () => {
    candidates = [];
    const res = await POST(req('test-secret'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.purged).toBe(0);
  });
});
