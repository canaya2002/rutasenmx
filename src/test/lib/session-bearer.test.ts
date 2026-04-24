/**
 * getSession() must accept BOTH a cookie (web) and an
 * `Authorization: Bearer <jwt>` header (mobile). These tests verify the
 * selection logic by mocking `next/headers` and `jose` so we don't depend
 * on the webcrypto subtleties of the jsdom test runtime.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

let mockCookie: string | null = null;
let mockAuthHeader: string | null = null;

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      mockCookie && name === 'rmx-session' ? { value: mockCookie } : undefined,
  }),
  headers: async () => ({
    get: (name: string) => {
      const lower = name.toLowerCase();
      if (lower === 'authorization') return mockAuthHeader;
      return null;
    },
  }),
}));

// Stub jose.jwtVerify to treat any token starting with 'VALID:' as valid and
// return a predictable payload — we're testing *source selection*, not the
// cryptography of the underlying library.
vi.mock('jose', async () => {
  const actual = await vi.importActual<typeof import('jose')>('jose');
  return {
    ...actual,
    jwtVerify: vi.fn(async (token: string) => {
      if (!token.startsWith('VALID:')) {
        throw new Error('invalid');
      }
      const payload = JSON.parse(token.slice('VALID:'.length));
      return { payload, protectedHeader: { alg: 'HS256' } };
    }),
    SignJWT: actual.SignJWT,
  };
});

beforeEach(() => {
  mockCookie = null;
  mockAuthHeader = null;
  // session.ts's getSecret() reads this — must be set or it throws.
  process.env.AUTH_SECRET = 'test-secret-32bytes-minimum-length-ok';
});

function makeToken(userId: string, role = 'user', plan = 'free'): string {
  return `VALID:${JSON.stringify({ userId, role, plan })}`;
}

describe('session.getSession with multiple auth sources', () => {
  it('returns null when neither cookie nor header is present', async () => {
    const { getSession } = await import('@/lib/auth/session');
    const sess = await getSession();
    expect(sess).toBeNull();
  });

  it('reads the session from an Authorization: Bearer header', async () => {
    const { getSession } = await import('@/lib/auth/session');
    mockAuthHeader = `Bearer ${makeToken('user-123', 'user', 'pro')}`;
    const sess = await getSession();
    expect(sess?.userId).toBe('user-123');
    expect(sess?.plan).toBe('pro');
  });

  it('reads the session from a cookie when no header is present', async () => {
    const { getSession } = await import('@/lib/auth/session');
    mockCookie = makeToken('user-456', 'admin', 'premium');
    const sess = await getSession();
    expect(sess?.userId).toBe('user-456');
    expect(sess?.role).toBe('admin');
  });

  it('prefers cookie over header when both are present', async () => {
    const { getSession } = await import('@/lib/auth/session');
    mockCookie = makeToken('user-cookie');
    mockAuthHeader = `Bearer ${makeToken('user-header', 'user', 'premium')}`;
    const sess = await getSession();
    expect(sess?.userId).toBe('user-cookie');
  });

  it('returns null for a malformed header', async () => {
    const { getSession } = await import('@/lib/auth/session');
    mockAuthHeader = 'not-a-bearer';
    const sess = await getSession();
    expect(sess).toBeNull();
  });

  it('returns null for a bearer header with a bogus token', async () => {
    const { getSession } = await import('@/lib/auth/session');
    mockAuthHeader = 'Bearer totally.fake.token';
    const sess = await getSession();
    expect(sess).toBeNull();
  });

  it('is case-insensitive for the Bearer scheme', async () => {
    const { getSession } = await import('@/lib/auth/session');
    mockAuthHeader = `bearer ${makeToken('user-case')}`;
    const sess = await getSession();
    expect(sess?.userId).toBe('user-case');
  });
});
