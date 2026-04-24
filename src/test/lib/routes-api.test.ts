/**
 * Smoke-tests for /api/routes and /api/routes/[slug]. These are the
 * endpoints that power the mobile `Rutas` tab — if the response shape
 * drifts, the mobile TypeScript build will break, but these tests catch
 * it at the source faster.
 *
 * We don't boot Next here — we invoke the route handlers directly. They
 * are stateless with respect to DB (mock data), so no fixtures needed.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

import { GET as listGET } from '@/app/api/routes/route';
import { GET as detailGET } from '@/app/api/routes/[slug]/route';

function req(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`);
}

describe('/api/routes GET', () => {
  it('returns a paged response with routes array', async () => {
    const res = await listGET(req('/api/routes'));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data.routes)).toBe(true);
    expect(typeof data.total).toBe('number');
    expect(typeof data.limit).toBe('number');
    expect(typeof data.offset).toBe('number');
    expect(data.routes.length).toBeLessThanOrEqual(data.limit);
  });

  it('caches at the edge', async () => {
    const res = await listGET(req('/api/routes'));
    expect(res.headers.get('cache-control')).toContain('s-maxage');
  });

  it('filters by difficulty', async () => {
    const res = await listGET(req('/api/routes?difficulty=facil'));
    const data = await res.json();
    expect(res.status).toBe(200);
    for (const r of data.routes) {
      expect(r.difficulty).toBe('facil');
    }
  });

  it('ignores unknown difficulty values', async () => {
    const res = await listGET(
      req('/api/routes?difficulty=imposible'),
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    // Should have returned all routes, not filtered to zero.
    expect(data.routes.length).toBeGreaterThan(0);
  });

  it('respects limit', async () => {
    const res = await listGET(req('/api/routes?limit=2'));
    const data = await res.json();
    expect(data.routes.length).toBeLessThanOrEqual(2);
  });
});

describe('/api/routes/[slug] GET', () => {
  it('returns 404 for unknown slug', async () => {
    const res = await detailGET(req('/api/routes/does-not-exist'), {
      params: Promise.resolve({ slug: 'does-not-exist' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns the route with enriched stops', async () => {
    // Fetch the list first to pick a slug that exists in the mock data.
    const listRes = await listGET(req('/api/routes?limit=1') as never);
    const list = await listRes.json();
    expect(list.routes.length).toBeGreaterThan(0);
    const slug: string = list.routes[0].slug;

    const res = await detailGET(req(`/api/routes/${slug}`), {
      params: Promise.resolve({ slug }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.route.slug).toBe(slug);
    expect(Array.isArray(data.route.stops)).toBe(true);

    // Each stop must have the enriched fields (even if null).
    for (const stop of data.route.stops) {
      expect(stop).toHaveProperty('lat');
      expect(stop).toHaveProperty('lng');
      expect(stop).toHaveProperty('image');
      expect(stop).toHaveProperty('stateName');
      expect(stop).toHaveProperty('category');
    }
  });
});
