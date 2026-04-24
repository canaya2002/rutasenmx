import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { flagContent } from '@/lib/social/communities';
import { requireSocialAccess, isGuardError } from '@/lib/social/guards';
import { emit, EVENTS } from '@/lib/analytics';

interface Ctx {
  params: Promise<{ postId: string }>;
}

const schema = z.object({
  reason: z.string().min(2).max(80),
  note: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest, ctx: Ctx) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const { postId } = await ctx.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  try {
    await flagContent(sessionOrError.userId, {
      postId,
      reason: parsed.data.reason,
      note: parsed.data.note,
    });
    emit(EVENTS.post_flagged, {
      userId: sessionOrError.userId,
      properties: { postId, reason: parsed.data.reason },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error' },
      { status: 400 },
    );
  }
}
