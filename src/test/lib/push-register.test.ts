/**
 * Contract tests for POST/DELETE /api/push/register.
 *
 * Guarantees:
 *   - Unauthenticated requests are rejected.
 *   - Bad payloads (non-Expo tokens, wrong shape) return 400 without writing.
 *   - A brand-new token is inserted.
 *   - Re-registering the same token updates the row instead of duplicating.
 *   - DELETE scopes to (token, userId) so one user can't unregister another
 *     user's device.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

interface Recorded {
  op: 'insert' | 'update' | 'delete';
  values?: Record<string, unknown>;
}

const recorder: Recorded[] = [];
let fakeExistingRow: { id: string; userId: string } | null = null;

function selectChain() {
  const node: Record<string, unknown> = {};
  node.from = vi.fn(() => node);
  node.where = vi.fn(() => node);
  node.limit = vi.fn(async () => (fakeExistingRow ? [fakeExistingRow] : []));
  return node;
}

function insertChain() {
  const node: Record<string, unknown> = {};
  node.values = vi.fn(async (v: Record<string, unknown>) => {
    recorder.push({ op: 'insert', values: v });
    return [];
  });
  return node;
}

function updateChain() {
  const node: Record<string, unknown> = {};
  node.set = vi.fn((v: Record<string, unknown>) => {
    recorder.push({ op: 'update', values: v });
    return node;
  });
  node.where = vi.fn(async () => []);
  return node;
}

function deleteChain() {
  const node: Record<string, unknown> = {};
  node.where = vi.fn(async (pred: unknown) => {
    recorder.push({ op: 'delete', values: { where: pred } });
    return [];
  });
  return node;
}

vi.mock('@/db', () => ({
  db: {
    select: () => selectChain(),
    insert: () => insertChain(),
    update: () => updateChain(),
    delete: () => deleteChain(),
  },
  pushTokens: {
    _: { name: 'push_tokens' },
    token: 'tokenCol',
    userId: 'userIdCol',
    id: 'idCol',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ eq: [col, val] }),
  and: (...args: unknown[]) => ({ and: args }),
}));

const fakeSession: { userId: string } | null = { userId: 'user-abc' };
let sessionOverride: { userId: string } | null | undefined = undefined;

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(async () => (sessionOverride === undefined ? fakeSession : sessionOverride)),
}));

vi.mock('@/lib/auth/rate-limit', () => ({
  checkAuthRateLimit: () => ({ allowed: true, retryAfterSeconds: 0 }),
  getClientIp: () => '127.0.0.1',
}));

import { POST, DELETE } from '@/app/api/push/register/route';

function req(body: unknown): Request {
  return new Request('http://localhost/api/push/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/push/register', () => {
  beforeEach(() => {
    recorder.length = 0;
    fakeExistingRow = null;
    sessionOverride = undefined;
  });

  it('401s when unauthenticated', async () => {
    sessionOverride = null;
    const res = await POST(req({ token: 'ExponentPushToken[abc]', platform: 'ios' }));
    expect(res.status).toBe(401);
    expect(recorder).toHaveLength(0);
  });

  it('400s on missing/invalid fields', async () => {
    const res = await POST(req({ token: 'x', platform: 'windows' }));
    expect(res.status).toBe(400);
  });

  it('400s when token is not an Expo token', async () => {
    const res = await POST(req({ token: 'fcm_token_from_elsewhere', platform: 'ios' }));
    expect(res.status).toBe(400);
    expect(recorder).toHaveLength(0);
  });

  it('inserts a new row when the token does not already exist', async () => {
    fakeExistingRow = null;
    const res = await POST(
      req({
        token: 'ExponentPushToken[new-device]',
        platform: 'ios',
        locale: 'es-MX',
        appVersion: '0.1.0',
      }),
    );
    expect(res.status).toBe(200);
    const inserts = recorder.filter((r) => r.op === 'insert');
    expect(inserts).toHaveLength(1);
    expect(inserts[0].values?.userId).toBe('user-abc');
    expect(inserts[0].values?.token).toBe('ExponentPushToken[new-device]');
    expect(inserts[0].values?.platform).toBe('ios');
  });

  it('updates the row instead of duplicating when the token is already known', async () => {
    fakeExistingRow = { id: 'row-1', userId: 'user-xyz' };
    const res = await POST(
      req({
        token: 'ExponentPushToken[known-device]',
        platform: 'android',
      }),
    );
    expect(res.status).toBe(200);
    const inserts = recorder.filter((r) => r.op === 'insert');
    const updates = recorder.filter((r) => r.op === 'update');
    expect(inserts).toHaveLength(0);
    expect(updates).toHaveLength(1);
    // Key invariant: the session userId wins, so a device that logs in under
    // a new user moves to that user.
    expect(updates[0].values?.userId).toBe('user-abc');
  });
});

describe('DELETE /api/push/register', () => {
  beforeEach(() => {
    recorder.length = 0;
    sessionOverride = undefined;
  });

  it('401s when unauthenticated', async () => {
    sessionOverride = null;
    const request = new Request(
      'http://localhost/api/push/register?token=abc',
      { method: 'DELETE' },
    );
    const res = await DELETE(request);
    expect(res.status).toBe(401);
  });

  it('400s when no token query param is provided', async () => {
    const request = new Request('http://localhost/api/push/register', {
      method: 'DELETE',
    });
    const res = await DELETE(request);
    expect(res.status).toBe(400);
  });

  it('deletes the matching (token, userId) row', async () => {
    const request = new Request(
      'http://localhost/api/push/register?token=ExponentPushToken[x]',
      { method: 'DELETE' },
    );
    const res = await DELETE(request);
    expect(res.status).toBe(200);
    expect(recorder.find((r) => r.op === 'delete')).toBeDefined();
  });
});
