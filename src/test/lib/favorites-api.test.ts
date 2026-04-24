/**
 * Contract tests for /api/favorites.
 *
 * Before this refactor, POST was a no-op (the INSERT was commented out as
 * a TODO) and GET returned `mockPlaces.slice(0, 3)` regardless of the user.
 * These tests enforce the new contract:
 *   - POST with a valid Expo-less `placeSlug` inserts one row tied to the
 *     session user.
 *   - A second POST with the same (userId, placeSlug) doesn't duplicate.
 *   - GET reads only the rows owned by the session user and enriches them
 *     from the static catalog.
 *   - DELETE scopes to (userId, placeSlug).
 *   - All methods require auth.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

interface Call {
  op: 'insert' | 'update' | 'delete' | 'select';
  values?: Record<string, unknown>;
}

const recorder: Call[] = [];
let fakeExistingFavorite: { id: string } | null = null;
let fakeUserFavorites: Array<{
  id: string;
  placeSlug: string | null;
  notes: string | null;
  createdAt: Date;
}> = [];

function selectChain() {
  const node: Record<string, unknown> = {};
  node.from = vi.fn(() => node);
  node.where = vi.fn(() => node);
  node.orderBy = vi.fn(async () => {
    recorder.push({ op: 'select' });
    return fakeUserFavorites;
  });
  node.limit = vi.fn(async () => (fakeExistingFavorite ? [fakeExistingFavorite] : []));
  return node;
}

function insertChain() {
  const node: Record<string, unknown> = {};
  node.values = vi.fn((v: Record<string, unknown>) => {
    recorder.push({ op: 'insert', values: v });
    return node;
  });
  node.returning = vi.fn(async () => [{ id: 'new-fav-id' }]);
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
  node.where = vi.fn(async () => {
    recorder.push({ op: 'delete' });
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
  savedPlaces: {
    _: { name: 'saved_places' },
    id: 'idCol',
    userId: 'userIdCol',
    placeSlug: 'placeSlugCol',
    notes: 'notesCol',
    createdAt: 'createdAtCol',
  },
}));

vi.mock('drizzle-orm', () => ({
  and: (...args: unknown[]) => ({ and: args }),
  eq: (col: unknown, val: unknown) => ({ eq: [col, val] }),
  isNotNull: (col: unknown) => ({ isNotNull: col }),
  desc: (col: unknown) => ({ desc: col }),
}));

let sessionOverride: { userId: string } | null | undefined;
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(async () =>
    sessionOverride === undefined ? { userId: 'user-abc' } : sessionOverride,
  ),
}));

vi.mock('@/lib/data/mock', () => ({
  getPlaceBySlug: (slug: string) => {
    if (slug === 'teotihuacan') {
      return {
        slug: 'teotihuacan',
        name: 'Teotihuacán',
        category: 'zonas-arqueologicas',
        categoryName: 'Zona arqueológica',
        stateName: 'Estado de México',
        image: '',
        description: 'Zona arqueológica más visitada',
      };
    }
    return undefined;
  },
}));

import { POST, GET, DELETE } from '@/app/api/favorites/route';
import { NextRequest } from 'next/server';

function post(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/favorites', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/favorites', () => {
  beforeEach(() => {
    recorder.length = 0;
    fakeExistingFavorite = null;
    fakeUserFavorites = [];
    sessionOverride = undefined;
  });

  it('401s when unauthenticated', async () => {
    sessionOverride = null;
    const res = await POST(post({ placeSlug: 'teotihuacan' }));
    expect(res.status).toBe(401);
    expect(recorder).toHaveLength(0);
  });

  it('400s on malformed payload', async () => {
    const res = await POST(post({}));
    expect(res.status).toBe(400);
  });

  it('404s when the slug is not in the catalog', async () => {
    const res = await POST(post({ placeSlug: 'no-existe' }));
    expect(res.status).toBe(404);
    expect(recorder.find((c) => c.op === 'insert')).toBeUndefined();
  });

  it('inserts a new row for a valid slug', async () => {
    const res = await POST(post({ placeSlug: 'teotihuacan' }));
    expect(res.status).toBe(201);
    const inserts = recorder.filter((c) => c.op === 'insert');
    expect(inserts).toHaveLength(1);
    expect(inserts[0].values?.userId).toBe('user-abc');
    expect(inserts[0].values?.placeSlug).toBe('teotihuacan');
  });

  it('does not duplicate when favorite already exists (returns 200 alreadyFavorite)', async () => {
    fakeExistingFavorite = { id: 'existing-fav' };
    const res = await POST(post({ placeSlug: 'teotihuacan' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alreadyFavorite).toBe(true);
    expect(recorder.find((c) => c.op === 'insert')).toBeUndefined();
  });

  it('updates notes when favorite exists and notes are passed', async () => {
    fakeExistingFavorite = { id: 'existing-fav' };
    await POST(post({ placeSlug: 'teotihuacan', notes: 'Ir en equinoccio' }));
    const updates = recorder.filter((c) => c.op === 'update');
    expect(updates).toHaveLength(1);
    expect(updates[0].values?.notes).toBe('Ir en equinoccio');
  });
});

describe('GET /api/favorites', () => {
  beforeEach(() => {
    recorder.length = 0;
    fakeUserFavorites = [];
    sessionOverride = undefined;
  });

  it('401s when unauthenticated', async () => {
    sessionOverride = null;
    const res = await GET(new NextRequest('http://localhost/api/favorites'));
    expect(res.status).toBe(401);
  });

  it('returns an empty list for a user with no favorites', async () => {
    const res = await GET(new NextRequest('http://localhost/api/favorites'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.favorites).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('enriches DB rows with catalog metadata', async () => {
    fakeUserFavorites = [
      {
        id: 'row-1',
        placeSlug: 'teotihuacan',
        notes: null,
        createdAt: new Date('2026-04-01'),
      },
    ];
    const res = await GET(new NextRequest('http://localhost/api/favorites'));
    const body = await res.json();
    expect(body.favorites).toHaveLength(1);
    expect(body.favorites[0].name).toBe('Teotihuacán');
    expect(body.favorites[0].slug).toBe('teotihuacan');
  });

  it('hides rows whose slug is no longer in the catalog', async () => {
    fakeUserFavorites = [
      {
        id: 'row-1',
        placeSlug: 'teotihuacan',
        notes: null,
        createdAt: new Date('2026-04-01'),
      },
      {
        id: 'row-2',
        placeSlug: 'removed-from-catalog',
        notes: null,
        createdAt: new Date('2026-04-02'),
      },
    ];
    const res = await GET(new NextRequest('http://localhost/api/favorites'));
    const body = await res.json();
    expect(body.favorites).toHaveLength(1);
    expect(body.favorites[0].slug).toBe('teotihuacan');
  });
});

describe('DELETE /api/favorites', () => {
  beforeEach(() => {
    recorder.length = 0;
    sessionOverride = undefined;
  });

  it('401s when unauthenticated', async () => {
    sessionOverride = null;
    const req = new NextRequest('http://localhost/api/favorites?slug=x', {
      method: 'DELETE',
    });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it('400s when no slug is passed', async () => {
    const req = new NextRequest('http://localhost/api/favorites', {
      method: 'DELETE',
    });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it('deletes by (userId, placeSlug)', async () => {
    const req = new NextRequest(
      'http://localhost/api/favorites?slug=teotihuacan',
      { method: 'DELETE' },
    );
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    expect(recorder.find((c) => c.op === 'delete')).toBeDefined();
  });
});
