import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { and, eq, isNull, gt } from 'drizzle-orm';

import { db, users, passwordResetTokens } from '@/db';
import { checkAuthRateLimit, getClientIp } from '@/lib/auth/rate-limit';
import { resetPasswordSchema, isWeakPassword } from '@shared/schemas/auth';

/**
 * POST /api/auth/reset-password
 *
 * Consumes a token previously issued by /api/auth/recover. The caller sends
 * the RAW token; we hash it and compare against `password_reset_tokens.tokenHash`.
 * A token is valid iff it exists, is unused, and hasn't expired.
 *
 * On success we mark the token used in the same transaction so the link
 * cannot be replayed, even under concurrent requests.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkAuthRateLimit(`reset:${ip}`, 10, 60 * 60);
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

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { token, password } = parsed.data;

  if (isWeakPassword(password)) {
    return NextResponse.json(
      { error: 'Contraseña muy débil. Elige una distinta.' },
      { status: 400 },
    );
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const now = new Date();

  try {
    const [row] = await db
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
      })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, now),
        ),
      )
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { error: 'El enlace no es válido o ya expiró. Solicita uno nuevo.' },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Mark token used first; if someone else already used it (race), the
    // update touches 0 rows and we bail without rewriting the password.
    const claimed = await db
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResetTokens.id, row.id),
          isNull(passwordResetTokens.usedAt),
        ),
      )
      .returning({ id: passwordResetTokens.id });

    if (claimed.length === 0) {
      return NextResponse.json(
        { error: 'El enlace ya fue usado. Solicita uno nuevo.' },
        { status: 400 },
      );
    }

    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, row.userId));

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('[reset-password] unexpected error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
