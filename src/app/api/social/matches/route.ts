import { NextResponse } from 'next/server';

import { listMatches } from '@/lib/social/chat';
import { requireSocialAccess, isGuardError } from '@/lib/social/guards';

export async function GET() {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const matches = await listMatches(sessionOrError.userId);
  return NextResponse.json({ matches });
}
