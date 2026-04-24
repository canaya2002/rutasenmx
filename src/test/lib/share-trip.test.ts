/**
 * Tests for POST/DELETE /api/trips/[id]/share.
 *
 * Enforces:
 *   - Ownership check: you can't share someone else's trip.
 *   - POST sets isPublic=true + generates a URL-safe token.
 *   - DELETE sets isPublic=false + clears token.
 *   - Rotation: a second POST generates a different token.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const recorder: Array<{ op: 'update' | 'select'; values?: Record<string, unknown> }> = [];
let ownedByUser = true;
let sessionOverride: { userId: string } | null | undefined;

function selectChain() {
  const node: Record<string, unknown> = {};
  node.from = vi.fn(() => node);
  node.where = vi.fn(() => node);
  node.limit = vi.fn(async () => {
    recorder.push({ op: 'select' });
    return ownedByUser ? [{ id: 'trip-123' }] : [];
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

vi.mock('@/db', () => ({
  db: {
    select: () => selectChain(),
    update: () => updateChain(),
  },
  trips: { _: { name: 'trips' }, id: 'idCol', userId: 'userIdCol' },
}));

vi.mock('drizzle-orm', () => ({
  and: (...args: unknown[]) => ({ and: args }),
  eq: (col: unknown, val: unknown) => ({ eq: [col, val] }),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(async () =>
    sessionOverride === undefined ? { userId: 'owner-1' } : sessionOverride,
  ),
}));

import { POST, DELETE } from '@/app/api/trips/[id]/share/route';

const ctx = { params: Promise.resolve({ id: 'trip-123' }) };

describe('POST /api/trips/[id]/share', () => {
  beforeEach(() => {
    recorder.length = 0;
    ownedByUser = true;
    sessionOverride = undefined;
    process.env.NEXT_PUBLIC_APP_URL = 'https://rutasenmx.com';
  });

  it('401s when unauthenticated', async () => {
    sessionOverride = null;
    const res = await POST(new Request('http://localhost'), ctx);
    expect(res.status).toBe(401);
  });

  it("404s when the trip isn't owned by the session user", async () => {
    ownedByUser = false;
    const res = await POST(new Request('http://localhost'), ctx);
    expect(res.status).toBe(404);
  });

  it('sets isPublic=true and returns a URL with the token', async () => {
    const res = await POST(new Request('http://localhost'), ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.token).toBeTruthy();
    expect(body.url).toBe(`https://rutasenmx.com/compartido/${body.token}`);
    const upd = recorder.find((c) => c.op === 'update');
    expect(upd?.values?.isPublic).toBe(true);
    expect(upd?.values?.shareToken).toBe(body.token);
  });

  it('generates a different token on every call (rotation)', async () => {
    const a = await POST(new Request('http://localhost'), ctx).then((r) => r.json());
    recorder.length = 0;
    const b = await POST(new Request('http://localhost'), ctx).then((r) => r.json());
    expect(a.token).not.toBe(b.token);
  });
});

describe('DELETE /api/trips/[id]/share', () => {
  beforeEach(() => {
    recorder.length = 0;
    ownedByUser = true;
    sessionOverride = undefined;
  });

  it('clears isPublic and shareToken', async () => {
    const res = await DELETE(new Request('http://localhost'), ctx);
    expect(res.status).toBe(200);
    const upd = recorder.find((c) => c.op === 'update');
    expect(upd?.values?.isPublic).toBe(false);
    expect(upd?.values?.shareToken).toBeNull();
  });

  it("refuses to clear someone else's trip", async () => {
    ownedByUser = false;
    const res = await DELETE(new Request('http://localhost'), ctx);
    expect(res.status).toBe(404);
    expect(recorder.find((c) => c.op === 'update')).toBeUndefined();
  });
});
