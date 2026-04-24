import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  createPost,
  getCommunityBySlug,
  listPosts,
} from '@/lib/social/communities';
import { requireSocialAccess, isGuardError } from '@/lib/social/guards';
import { RateLimitError } from '@/lib/social/rate-limit';
import { emit, EVENTS } from '@/lib/analytics';

interface Ctx {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, ctx: Ctx) {
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

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '30'), 100);
  const offset = Math.max(Number(url.searchParams.get('offset') ?? '0'), 0);

  const posts = await listPosts(community.id, sessionOrError.userId, {
    limit,
    offset,
  });
  return NextResponse.json({ posts });
}

const createSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(3).max(8000),
  photoUrls: z.array(z.string().url()).max(8).optional(),
  photoHashes: z.array(z.string().max(64)).max(8).optional(),
});

export async function POST(request: NextRequest, ctx: Ctx) {
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

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const id = await createPost(sessionOrError.userId, {
      communityId: community.id,
      title: parsed.data.title,
      body: parsed.data.body,
      photoUrls: parsed.data.photoUrls,
      photoHashes: parsed.data.photoHashes,
    });
    emit(EVENTS.post_created, {
      userId: sessionOrError.userId,
      properties: {
        communityId: community.id,
        communitySlug: community.slug,
        hasPhotos: (parsed.data.photoUrls?.length ?? 0) > 0,
      },
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
