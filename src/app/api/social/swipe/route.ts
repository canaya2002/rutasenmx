import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { recordSwipe } from '@/lib/social/discovery';
import { getProfilesByUserIds } from '@/lib/social/discovery';
import { requireSocialAccess, isGuardError } from '@/lib/social/guards';

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

    // When a match happens, return the other profile for the "it's a match!" modal.
    if (result.matched) {
      const profiles = await getProfilesByUserIds([parsed.data.toUserId]);
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
