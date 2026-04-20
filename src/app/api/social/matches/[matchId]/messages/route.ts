import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { listMessages, sendMessage } from '@/lib/social/chat';
import { requireSocialAccess, isGuardError } from '@/lib/social/guards';
import { SOCIAL_MESSAGE_MAX } from '@/lib/social/constants';

interface Ctx {
  params: Promise<{ matchId: string }>;
}

export async function GET(request: NextRequest, ctx: Ctx) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const { matchId } = await ctx.params;
  const after = new URL(request.url).searchParams.get('after') ?? undefined;

  try {
    const messages = await listMessages(matchId, sessionOrError.userId, {
      after,
    });
    return NextResponse.json({ messages });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

const postSchema = z.object({
  body: z.string().trim().min(1).max(SOCIAL_MESSAGE_MAX),
});

export async function POST(request: NextRequest, ctx: Ctx) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const { matchId } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Mensaje inválido', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const message = await sendMessage(
      matchId,
      sessionOrError.userId,
      parsed.data.body,
    );
    return NextResponse.json({ message });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al enviar';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
