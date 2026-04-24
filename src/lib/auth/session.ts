import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies, headers } from 'next/headers';

// ── Types ───────────────────────────────────────────────────────────────────
export interface SessionPayload extends JWTPayload {
  userId: string;
  role: 'user' | 'admin' | 'editor';
  plan: 'free' | 'pro' | 'premium';
}

// ── Config ──────────────────────────────────────────────────────────────────
const SESSION_COOKIE = process.env.AUTH_COOKIE_NAME ?? 'rmx-session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

function getSecret(): Uint8Array {
  // Accept any of these names to survive historic renames across projects.
  // AUTH_SECRET is the variable documented in .env.example.
  const secret =
    process.env.AUTH_SECRET ??
    process.env.JWT_SECRET ??
    process.env.NEXTAUTH_SECRET;
  if (!secret) {
    // During build time the secret may not be available.
    // Return a dummy key — getSession() will catch the verification error.
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      return new TextEncoder().encode('build-time-placeholder-do-not-use');
    }
    throw new Error(
      'AUTH_SECRET (or JWT_SECRET) environment variable is not set',
    );
  }
  return new TextEncoder().encode(secret);
}

// ── Create ──────────────────────────────────────────────────────────────────
export async function createSession(
  userId: string,
  role: SessionPayload['role'] = 'user',
  plan: SessionPayload['plan'] = 'free',
): Promise<string> {
  const token = await new SignJWT({ userId, role, plan })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .setIssuer('rutasenmx.com')
    .setAudience('rutasenmx.com')
    .sign(getSecret());

  return token;
}

// ── Verify ──────────────────────────────────────────────────────────────────
export async function verifySession(token: string): Promise<SessionPayload> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: 'rutasenmx.com',
      audience: 'rutasenmx.com',
    });
    return payload as SessionPayload;
  } catch {
    throw new Error('Invalid or expired session token');
  }
}

// ── Get (read cookie OR Authorization header + verify) ────────────────────
/**
 * Resolves the caller's session from either:
 *   1. An HTTP-only cookie (web, same-origin)
 *   2. An `Authorization: Bearer <jwt>` header (mobile / third-party clients)
 *
 * We intentionally accept either source at this single chokepoint so every
 * route handler inherits both auth modes for free. Mobile stores the JWT in
 * SecureStore and re-attaches it on each request; web sticks with cookies.
 */
export async function getSession(): Promise<SessionPayload | null> {
  let token: string | null = null;

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    if (sessionCookie?.value) token = sessionCookie.value;
  } catch {
    // `cookies()` throws in some static contexts — fall through to header.
  }

  if (!token) {
    try {
      const hdrs = await headers();
      const authHeader = hdrs.get('authorization') ?? hdrs.get('Authorization');
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.slice('Bearer '.length).trim();
      }
    } catch {
      // `headers()` only works in dynamic/request contexts.
    }
  }

  if (!token) return null;

  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}

// ── Set cookie ──────────────────────────────────────────────────────────────
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

// ── Clear ───────────────────────────────────────────────────────────────────
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
