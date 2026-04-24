import { NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { eq } from 'drizzle-orm';

import { db, users, passwordResetTokens } from '@/db';
import { checkAuthRateLimit, getClientIp } from '@/lib/auth/rate-limit';
import { getEmail } from '@/lib/providers/email';
import { recoverSchema } from '@shared/schemas/auth';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    'https://rutasenmx.com'
  );
}

/**
 * POST /api/auth/recover
 *
 * Always returns 200 regardless of whether the email matches a real account.
 * This prevents address enumeration — an attacker cannot probe which emails
 * are registered by comparing response codes.
 *
 * Rate-limited per-IP (5 / hour) to cap abuse while still allowing a user
 * who mistyped their email to try again from the same network.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkAuthRateLimit(`recover:${ip}`, 5, 60 * 60);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: 'Demasiados intentos desde esta red. Intenta de nuevo más tarde.',
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
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = recoverSchema.safeParse(body);
  if (!parsed.success) {
    // Still respond OK — don't leak which emails are valid syntactically.
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const normalizedEmail = parsed.data.email.toLowerCase();

  try {
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (user) {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      const resetUrl = `${appUrl()}/restablecer-contrasena/${rawToken}`;

      try {
        await getEmail().sendTemplate({
          to: user.email,
          template: 'password-reset',
          data: {
            name: user.name ?? '',
            resetUrl,
          },
        });
      } catch (err) {
        console.error('[recover] failed to send email:', err);
      }
    }
  } catch (err) {
    console.error('[recover] unexpected error:', err);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
