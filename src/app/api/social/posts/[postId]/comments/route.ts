import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createComment, listComments } from '@/lib/social/communities';
import { requireSocialAccess, isGuardError } from '@/lib/social/guards';
import { RateLimitError } from '@/lib/social/rate-limit';
import { emit, EVENTS } from '@/lib/analytics';

interface Ctx {
  params: Promise<{ postId: string }>;
}

export async function GET(_: NextRequest, ctx: Ctx) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const { postId } = await ctx.params;
  const comments = await listComments(postId, sessionOrError.userId);
  return NextResponse.json({ comments });
}

const schema = z.object({
  body: z.string().min(1).max(4000),
  parentCommentId: z.string().uuid().nullable().optional(),
});

export async function POST(request: NextRequest, ctx: Ctx) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const { postId } = await ctx.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const id = await createComment(sessionOrError.userId, {
      postId,
      body: parsed.data.body,
      parentCommentId: parsed.data.parentCommentId ?? null,
    });
    emit(EVENTS.comment_created, {
      userId: sessionOrError.userId,
      properties: { postId, commentId: id, isReply: !!parsed.data.parentCommentId },
    });
    return NextResponse.json({ id });
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
