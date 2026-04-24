/**
 * Tests for /api/search/suggestions.
 *
 * This endpoint replaced the client-side `mockPlaces` import that was
 * shipping 30k rows of JSON into the homepage bundle. The contract:
 *   - Short query (<2 chars) → empty list, no search done.
 *   - Returns at most `limit` items, default 10, capped at 25.
 *   - Mix of places / states / categories / routes; states + categories
 *     ranked first (they're fewer and more meaningful for autocomplete).
 *   - `cache-control: s-maxage` so Vercel's edge caches repeated prefixes.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from '@/app/api/search/suggestions/route';

function req(q: string, limit?: number): NextRequest {
  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  if (limit != null) qs.set('limit', String(limit));
  return new NextRequest(`http://localhost/api/search/suggestions?${qs}`);
}

describe('GET /api/search/suggestions', () => {
  it('returns empty items when q is missing or too short', async () => {
    const res = await GET(req(''));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toEqual([]);
  });

  it('returns empty items for single-character queries', async () => {
    const res = await GET(req('o'));
    const data = await res.json();
    expect(data.items).toEqual([]);
  });

  it('matches Oaxaca as a state', async () => {
    const res = await GET(req('oaxa'));
    expect(res.status).toBe(200);
    const data = await res.json();
    const states = data.items.filter((i: { kind: string }) => i.kind === 'state');
    expect(states.length).toBeGreaterThan(0);
    expect(states[0].label.toLowerCase()).toContain('oaxaca');
    expect(states[0].href).toMatch(/\/estados\/oaxaca/);
  });

  it('finds Teotihuacán as a place', async () => {
    const res = await GET(req('teotih'));
    const data = await res.json();
    const places = data.items.filter(
      (i: { kind: string }) => i.kind === 'place',
    );
    expect(places.length).toBeGreaterThan(0);
    expect(places[0].href).toMatch(/^\/lugares\//);
  });

  it('caps results at the provided limit (max 25)', async () => {
    const res = await GET(req('a', /* actually 2 chars */));
    // 1 char will short-circuit; use a common 2-char like 'mi'
    const res2 = await GET(req('mi', 5));
    const data = await res2.json();
    expect(data.items.length).toBeLessThanOrEqual(5);
    void res;
  });

  it('silently caps insane limits (e.g. 999) at 25', async () => {
    const res = await GET(req('san', 999));
    const data = await res.json();
    expect(data.items.length).toBeLessThanOrEqual(25);
  });

  it('sets an edge cache-control header', async () => {
    const res = await GET(req('oaxa'));
    const cc = res.headers.get('cache-control') ?? '';
    expect(cc).toContain('s-maxage');
  });

  it('returns suggestions with expected shape (kind, label, href)', async () => {
    const res = await GET(req('oaxa'));
    const data = await res.json();
    for (const item of data.items) {
      expect(typeof item.kind).toBe('string');
      expect(['place', 'state', 'category', 'route']).toContain(item.kind);
      expect(typeof item.label).toBe('string');
      expect(typeof item.href).toBe('string');
      expect(item.href.startsWith('/')).toBe(true);
    }
  });
});
