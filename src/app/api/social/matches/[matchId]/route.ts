import { NextResponse } from 'next/server';

import { closeMatch } from '@/lib/social/chat';
import { requireSocialAccess, isGuardError } from '@/lib/social/guards';

interface Ctx {
  params: Promise<{ matchId: string }>;
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const { matchId } = await ctx.params;
  try {
    await closeMatch(matchId, sessionOrError.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
