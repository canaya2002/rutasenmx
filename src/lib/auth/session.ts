import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';

// ── Types ───────────────────────────────────────────────────────────────────
export interface SessionPayload extends JWTPayload {
  userId: string;
  role: 'user' | 'admin' | 'editor';
  plan: 'free' | 'basic' | 'pro' | 'premium';
}

// ── Config ──────────────────────────────────────────────────────────────────
const SESSION_COOKIE = 'rmx-session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    // During build time the secret may not be available.
    // Return a dummy key — getSession() will catch the verification error.
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      return new TextEncoder().encode('build-time-placeholder-do-not-use');
    }
    throw new Error('JWT_SECRET environment variable is not set');
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

// ── Get (read cookie + verify) ──────────────────────────────────────────────
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    return await verifySession(sessionCookie.value);
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
