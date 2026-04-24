import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { blockUser, unblockUser, listBlockedUsers } from '@/lib/social/moderation';
import { requireSocialAccess, isGuardError } from '@/lib/social/guards';
import { emit, EVENTS } from '@/lib/analytics';

export async function GET() {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const ids = await listBlockedUsers(sessionOrError.userId);
  return NextResponse.json({ blocked: ids });
}

const schema = z.object({ userId: z.string().uuid() });

export async function POST(request: NextRequest) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  try {
    await blockUser(sessionOrError.userId, parsed.data.userId);
    emit(EVENTS.user_blocked, {
      userId: sessionOrError.userId,
      properties: { blockedId: parsed.data.userId },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error' },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  await unblockUser(sessionOrError.userId, parsed.data.userId);
  return NextResponse.json({ ok: true });
}
