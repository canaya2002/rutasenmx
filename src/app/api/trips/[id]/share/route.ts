import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';

import { db, trips } from '@/db';
import { getSession } from '@/lib/auth/session';

/**
 * POST   /api/trips/[id]/share   → enable public sharing, generate token
 * DELETE /api/trips/[id]/share   → disable sharing, clear token
 *
 * The token is URL-safe and 24 chars of entropy (~144 bits) so guessing is
 * computationally infeasible. Rotating it (call POST again) immediately
 * invalidates the previous link.
 */

interface Ctx {
  params: Promise<{ id: string }>;
}

function generateToken(): string {
  return randomBytes(18).toString('base64url');
}

async function assertOwnership(
  tripId: string,
  userId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: trips.id })
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
    .limit(1);
  return Boolean(row);
}

export async function POST(_request: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  const { id } = await ctx.params;

  const owns = await assertOwnership(id, session.userId);
  if (!owns) {
    return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });
  }

  // Loop to avoid the astronomically-unlikely unique-index collision.
  let token = generateToken();
  for (let i = 0; i < 3; i++) {
    try {
      await db
        .update(trips)
        .set({ isPublic: true, shareToken: token })
        .where(eq(trips.id, id));
      break;
    } catch (err) {
      if (i === 2) throw err;
      token = generateToken();
    }
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ??
    'https://rutasenmx.com';

  return NextResponse.json({
    ok: true,
    token,
    url: `${baseUrl}/compartido/${token}`,
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  const { id } = await ctx.params;

  const owns = await assertOwnership(id, session.userId);
  if (!owns) {
    return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });
  }

  await db
    .update(trips)
    .set({ isPublic: false, shareToken: null })
    .where(eq(trips.id, id));

  return NextResponse.json({ ok: true });
}
