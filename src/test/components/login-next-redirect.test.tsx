/**
 * Tests the login page's `?next=` parameter behavior.
 *
 * Security-relevant — bad handling here lets a malicious URL redirect the
 * user to an off-site phishing page after login. Our safeNext() only lets
 * same-origin absolute paths through.
 *
 * We copy the safeNext helper's behavior here because it's private to the
 * page component. If you change the page's validation, update this test.
 */
import { describe, it, expect } from 'vitest';

function safeNext(raw: string | null): string {
  if (!raw) return '/mis-viajes';
  if (!raw.startsWith('/')) return '/mis-viajes';
  if (raw.startsWith('//')) return '/mis-viajes';
  return raw;
}

describe('login page — safeNext()', () => {
  it('defaults to /mis-viajes when next is missing', () => {
    expect(safeNext(null)).toBe('/mis-viajes');
    expect(safeNext('')).toBe('/mis-viajes');
  });

  it('allows same-origin absolute paths', () => {
    expect(safeNext('/perfil')).toBe('/perfil');
    expect(safeNext('/perfil?delete=1')).toBe('/perfil?delete=1');
    expect(safeNext('/mis-viajes/abc-123')).toBe('/mis-viajes/abc-123');
  });

  it('blocks protocol-relative URLs (open-redirect vector)', () => {
    expect(safeNext('//evil.com/phish')).toBe('/mis-viajes');
  });

  it('blocks absolute URLs to other hosts', () => {
    expect(safeNext('https://evil.com/phish')).toBe('/mis-viajes');
    expect(safeNext('http://evil.com')).toBe('/mis-viajes');
    expect(safeNext('javascript:alert(1)')).toBe('/mis-viajes');
  });

  it('blocks relative paths without leading slash', () => {
    expect(safeNext('perfil')).toBe('/mis-viajes');
    expect(safeNext('../../etc')).toBe('/mis-viajes');
  });
});
