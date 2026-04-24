import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import {
  getSocialProfile,
  socialProfileInputSchema,
  upsertSocialProfile,
} from '@/lib/social/profile';
import { requireSocialAccess, isGuardError } from '@/lib/social/guards';
import { emit, EVENTS } from '@/lib/analytics';

export async function GET() {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const profile = await getSocialProfile(sessionOrError.userId);
  return NextResponse.json({ profile });
}

export async function POST(request: NextRequest) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  try {
    const input = socialProfileInputSchema.parse(body);
    const profile = await upsertSocialProfile(sessionOrError.userId, input);
    emit(EVENTS.social_profile_saved, {
      userId: sessionOrError.userId,
      properties: {
        hasPhoto: !!profile.photoUrl,
        interestCount: profile.interests.length,
        intent: profile.intent,
        destino: profile.destinoEstadoSlug,
      },
    });
    return NextResponse.json({ profile });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: err.issues },
        { status: 400 },
      );
    }
    console.error('[social/profile]', err);
    return NextResponse.json(
      { error: 'No se pudo guardar el perfil' },
      { status: 500 },
    );
  }
}
