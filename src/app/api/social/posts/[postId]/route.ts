import { NextResponse } from 'next/server';

import { getPost } from '@/lib/social/communities';
import { requireSocialAccess, isGuardError } from '@/lib/social/guards';

interface Ctx {
  params: Promise<{ postId: string }>;
}

export async function GET(_: Request, ctx: Ctx) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const { postId } = await ctx.params;
  const post = await getPost(postId, sessionOrError.userId);
  if (!post) {
    return NextResponse.json(
      { error: 'Publicación no encontrada' },
      { status: 404 },
    );
  }
  return NextResponse.json({ post });
}
