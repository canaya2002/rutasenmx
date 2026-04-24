import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';

import { createSession, setSessionCookie } from '@/lib/auth/session';
import { emit, EVENTS } from '@/lib/analytics';
import { checkAuthRateLimit, getClientIp } from '@/lib/auth/rate-limit';
import { registerSchema, isWeakPassword } from '@shared/schemas/auth';

/**
 * POST /api/auth/register
 *
 * Rate-limit: 3 signups per IP per hour — generous enough for a shared wifi
 * (coffee shop) but tight enough to stop scripted abuse.
 *
 * Same mobile-vs-web token handling as /login: token only in body when the
 * request carries `X-Client-Platform: mobile`.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkAuthRateLimit(`register:${ip}`, 3, 60 * 60);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `Demasiados registros desde esta red. Intenta de nuevo más tarde.`,
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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos invalidos', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  if (isWeakPassword(password)) {
    return NextResponse.json(
      { error: 'Contraseña muy débil. Elige una distinta.' },
      { status: 400 },
    );
  }

  try {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este correo' },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email: normalizedEmail,
        passwordHash,
        role: 'user',
        emailVerified: false,
      })
      .returning();

    const token = await createSession(newUser.id, 'user', 'free');
    await setSessionCookie(token);

    emit(EVENTS.signup_completed, {
      userId: newUser.id,
      properties: { emailDomain: normalizedEmail.split('@')[1] ?? null },
    });

    const platform = request.headers.get('x-client-platform')?.toLowerCase();
    const isMobile = platform === 'mobile' || platform === 'ios' || platform === 'android';

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          plan: 'free',
          avatarUrl: newUser.avatarUrl ?? null,
        },
        ...(isMobile ? { token } : {}),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
