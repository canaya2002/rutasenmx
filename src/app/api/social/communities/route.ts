import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  createCommunity,
  listCommunities,
} from '@/lib/social/communities';
import { requireSocialAccess, isGuardError } from '@/lib/social/guards';
import { RateLimitError } from '@/lib/social/rate-limit';

export async function GET(request: NextRequest) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const url = new URL(request.url);
  const typeRaw = url.searchParams.get('type');
  const type =
    typeRaw === 'forum' || typeRaw === 'group' || typeRaw === 'channel'
      ? typeRaw
      : undefined;
  const q = url.searchParams.get('q') ?? undefined;

  const communities = await listCommunities(sessionOrError.userId, { type, q });
  return NextResponse.json({ communities });
}

const createSchema = z.object({
  name: z.string().min(3).max(160),
  description: z.string().max(600).optional(),
  coverPhotoUrl: z.string().url().max(500).optional(),
  requiresApproval: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const community = await createCommunity(sessionOrError.userId, {
      type: 'group',
      ...parsed.data,
    });
    return NextResponse.json({ community });
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
