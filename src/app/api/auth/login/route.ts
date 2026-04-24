import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';

import { createSession, setSessionCookie } from '@/lib/auth/session';
import { getCurrentPlanSlug } from '@/lib/subscription/current-plan';
import { emit, EVENTS } from '@/lib/analytics';
import { checkAuthRateLimit, getClientIp } from '@/lib/auth/rate-limit';
import { loginSchema } from '@shared/schemas/auth';

/**
 * POST /api/auth/login
 *
 * Accepts cookie (web) or header (mobile) auth consumers.
 *
 * Rate-limit: 5 attempts per IP per 60s (brute-force defense).
 *
 * When the request carries `X-Client-Platform: mobile`, we also return the
 * JWT in the response body so the mobile client can store it in SecureStore
 * and re-attach it as `Authorization: Bearer` on subsequent requests. Web
 * clients get the HTTP-only cookie and ignore the body token.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkAuthRateLimit(`login:${ip}`, 5, 60);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `Demasiados intentos. Intenta de nuevo en ${rl.retryAfterSeconds}s`,
        retryAfter: rl.retryAfterSeconds,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos invalidos', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Correo o contrasena incorrectos' },
        { status: 401 },
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Correo o contrasena incorrectos' },
        { status: 401 },
      );
    }

    if (user.deletedAt) {
      return NextResponse.json(
        { error: 'Esta cuenta ha sido desactivada' },
        { status: 403 },
      );
    }

    // Create session with the user's actual active plan (falls back to 'free').
    const plan = await getCurrentPlanSlug(user.id);
    const token = await createSession(
      user.id,
      user.role as 'user' | 'admin' | 'editor',
      plan,
    );

    await setSessionCookie(token);

    emit(EVENTS.login, { userId: user.id, properties: { plan } });

    const platform = request.headers.get('x-client-platform')?.toLowerCase();
    const isMobile = platform === 'mobile' || platform === 'ios' || platform === 'android';

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan,
        avatarUrl: user.avatarUrl ?? null,
      },
      // Only return the token to mobile clients — web uses the HTTP-only cookie.
      ...(isMobile ? { token } : {}),
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
