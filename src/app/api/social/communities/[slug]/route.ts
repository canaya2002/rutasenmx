import { NextResponse } from 'next/server';

import {
  getCommunityBySlug,
  joinCommunity,
  leaveCommunity,
} from '@/lib/social/communities';
import { requireSocialAccess, isGuardError } from '@/lib/social/guards';
import { emit, EVENTS } from '@/lib/analytics';

interface Ctx {
  params: Promise<{ slug: string }>;
}

export async function GET(_: Request, ctx: Ctx) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const { slug } = await ctx.params;
  const community = await getCommunityBySlug(slug, sessionOrError.userId);
  if (!community) {
    return NextResponse.json(
      { error: 'Comunidad no encontrada' },
      { status: 404 },
    );
  }
  return NextResponse.json({ community });
}

// Join
export async function POST(_: Request, ctx: Ctx) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const { slug } = await ctx.params;
  try {
    const result = await joinCommunity(sessionOrError.userId, slug);
    if (result.joined || result.pending) {
      emit(EVENTS.community_joined, {
        userId: sessionOrError.userId,
        properties: { slug, pending: result.pending },
      });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error' },
      { status: 400 },
    );
  }
}

// Leave
export async function DELETE(_: Request, ctx: Ctx) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const { slug } = await ctx.params;
  try {
    await leaveCommunity(sessionOrError.userId, slug);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error' },
      { status: 400 },
    );
  }
}
