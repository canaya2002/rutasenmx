import { NextResponse } from 'next/server';

import { upvotePost } from '@/lib/social/communities';
import { requireSocialAccess, isGuardError } from '@/lib/social/guards';
import { RateLimitError } from '@/lib/social/rate-limit';

interface Ctx {
  params: Promise<{ postId: string }>;
}

export async function POST(_: Request, ctx: Ctx) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const { postId } = await ctx.params;
  try {
    const result = await upvotePost(sessionOrError.userId, postId);
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
