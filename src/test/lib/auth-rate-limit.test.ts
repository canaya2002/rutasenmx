/**
 * Auth rate-limit tests. The intent is the inverse of feature tests:
 * the rate-limit must NOT let brute-force through. Exercising it here
 * means that accidentally bumping the thresholds breaks a test, so
 * nobody silently opens the door.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkAuthRateLimit,
  getClientIp,
} from '@/lib/auth/rate-limit';

describe('checkAuthRateLimit', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('allows requests up to the max, then blocks', () => {
    const key = `login:${Math.random()}`; // unique key per test
    for (let i = 0; i < 5; i++) {
      const v = checkAuthRateLimit(key, 5, 60);
      expect(v.allowed).toBe(true);
      expect(v.remaining).toBe(4 - i);
    }
    const blocked = checkAuthRateLimit(key, 5, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('uses independent buckets per key', () => {
    const keyA = `a:${Math.random()}`;
    const keyB = `b:${Math.random()}`;
    for (let i = 0; i < 5; i++) checkAuthRateLimit(keyA, 5, 60);
    const b = checkAuthRateLimit(keyB, 5, 60);
    expect(b.allowed).toBe(true);
  });

  it('resets after the window expires', async () => {
    const key = `reset:${Math.random()}`;
    for (let i = 0; i < 3; i++) checkAuthRateLimit(key, 3, 1); // 1s window
    const blocked = checkAuthRateLimit(key, 3, 1);
    expect(blocked.allowed).toBe(false);

    await new Promise((r) => setTimeout(r, 1100));
    const afterReset = checkAuthRateLimit(key, 3, 1);
    expect(afterReset.allowed).toBe(true);
  });
});

describe('getClientIp', () => {
  it('reads x-forwarded-for first entry', () => {
    const req = new Request('http://example.com', {
      headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
    });
    expect(getClientIp(req)).toBe('203.0.113.1');
  });

  it('falls back to x-real-ip', () => {
    const req = new Request('http://example.com', {
      headers: { 'x-real-ip': '198.51.100.5' },
    });
    expect(getClientIp(req)).toBe('198.51.100.5');
  });

  it('returns unknown when no header is present', () => {
    const req = new Request('http://example.com');
    expect(getClientIp(req)).toBe('unknown');
  });
});
