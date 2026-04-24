import { describe, it, expect } from 'vitest';

import { GET } from '@/app/api/states/route';

describe('/api/states GET', () => {
  it('returns all 32 states', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.states)).toBe(true);
    expect(data.total).toBe(data.states.length);
    expect(data.states.length).toBe(32);
  });

  it('caches aggressively', async () => {
    const res = await GET();
    const cc = res.headers.get('cache-control') ?? '';
    expect(cc).toContain('s-maxage=3600');
  });

  it('every state has the required fields', async () => {
    const res = await GET();
    const data = await res.json();
    for (const s of data.states) {
      expect(typeof s.slug).toBe('string');
      expect(typeof s.name).toBe('string');
      expect(typeof s.abbr).toBe('string');
      expect(typeof s.capital).toBe('string');
    }
  });
});
