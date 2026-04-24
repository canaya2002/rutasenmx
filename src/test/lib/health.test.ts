/**
 * `/api/health` exists so external uptime monitors can tell when the app is
 * actually serving requests. Two contract guarantees:
 *   - DB reachable → 200 JSON `{ ok: true, db: 'up' }`.
 *   - DB down/timing out → 503 so the monitor pages oncall.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/db', () => ({
  db: { execute: vi.fn() },
}));

vi.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    strings,
    values,
  }),
}));

import { db } from '@/db';
import { GET } from '@/app/api/health/route';

const executeMock = db.execute as unknown as ReturnType<typeof vi.fn>;

describe('GET /api/health', () => {
  beforeEach(() => {
    executeMock.mockReset();
  });

  it('returns 200 when the DB responds', async () => {
    executeMock.mockResolvedValueOnce([]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.db).toBe('up');
    expect(typeof body.dbLatencyMs).toBe('number');
  });

  it('returns 503 when the DB rejects', async () => {
    executeMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.db).toBe('down');
  });

  it('never caches (uptime probes must hit fresh)', async () => {
    executeMock.mockResolvedValueOnce([]);
    const res = await GET();
    const cc = res.headers.get('cache-control') ?? '';
    expect(cc.toLowerCase()).toContain('no-store');
  });
});
