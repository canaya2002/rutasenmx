import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { recordSwipe } from '@/lib/social/discovery';
import { getProfilesByUserIds } from '@/lib/social/discovery';
import { requireSocialAccess, isGuardError } from '@/lib/social/guards';
import { emit, EVENTS } from '@/lib/analytics';
import { sendPushToUser } from '@/lib/push/send';

const schema = z.object({
  toUserId: z.string().uuid(),
  action: z.enum(['like', 'pass']),
});

export async function POST(request: NextRequest) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await recordSwipe(
      sessionOrError.userId,
      parsed.data.toUserId,
      parsed.data.action,
    );

    emit(EVENTS.swipe, {
      userId: sessionOrError.userId,
      properties: { action: parsed.data.action, matched: result.matched },
    });

    // When a match happens, return the other profile for the "it's a match!" modal.
    if (result.matched) {
      emit(EVENTS.match_created, {
        userId: sessionOrError.userId,
        properties: { matchId: result.matchId ?? null, otherUserId: parsed.data.toUserId },
      });
      const profiles = await getProfilesByUserIds([parsed.data.toUserId]);
      const myProfile = await getProfilesByUserIds([sessionOrError.userId]);
      const myName = myProfile.get(sessionOrError.userId)?.displayName ?? 'Alguien';
      // Notify the OTHER user that they got a match — fire-and-forget.
      void sendPushToUser(parsed.data.toUserId, {
        title: '¡Es un match!',
        body: `${myName} también te dio like. Manda el primer mensaje.`,
        data: {
          type: 'match',
          matchId: result.matchId ?? null,
          path: result.matchId ? `/conectar/chat/${result.matchId}` : '/conectar/matches',
        },
      });
      return NextResponse.json({
        ...result,
        otherProfile: profiles.get(parsed.data.toUserId) ?? null,
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al procesar swipe';
    const status = message.includes('límite') ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
