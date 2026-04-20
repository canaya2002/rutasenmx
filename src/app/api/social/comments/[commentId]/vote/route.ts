import { NextResponse } from 'next/server';

import { upvoteComment } from '@/lib/social/communities';
import { requireSocialAccess, isGuardError } from '@/lib/social/guards';
import { RateLimitError } from '@/lib/social/rate-limit';

interface Ctx {
  params: Promise<{ commentId: string }>;
}

export async function POST(_: Request, ctx: Ctx) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const { commentId } = await ctx.params;
  try {
    const result = await upvoteComment(sessionOrError.userId, commentId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: err.message, retryAfter: err.retryAfterSeconds },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error' },
      { status: 400 },
    );
  }
}
