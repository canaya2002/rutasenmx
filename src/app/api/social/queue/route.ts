import { type NextRequest, NextResponse } from 'next/server';

import {
  getDiscoveryQueue,
  type DiscoveryFilters,
} from '@/lib/social/discovery';
import { getSocialProfile } from '@/lib/social/profile';
import { requireSocialAccess, isGuardError } from '@/lib/social/guards';

export async function GET(request: NextRequest) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  // User must have a social profile before they can see others.
  const mine = await getSocialProfile(sessionOrError.userId);
  if (!mine) {
    return NextResponse.json(
      { error: 'Crea tu perfil social para comenzar', needsProfile: true },
      { status: 409 },
    );
  }

  const url = new URL(request.url);
  const filters: DiscoveryFilters = {};
  const destino = url.searchParams.get('destino');
  if (destino) filters.destinoEstadoSlug = destino;
  const intent = url.searchParams.get('intent');
  if (intent) filters.intent = intent;
  const minAge = url.searchParams.get('minAge');
  if (minAge) filters.minAge = Number(minAge);
  const maxAge = url.searchParams.get('maxAge');
  if (maxAge) filters.maxAge = Number(maxAge);
  const interestsRaw = url.searchParams.get('interests');
  if (interestsRaw) {
    filters.interests = interestsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const queue = await getDiscoveryQueue(sessionOrError.userId, filters);
  return NextResponse.json({ queue });
}
