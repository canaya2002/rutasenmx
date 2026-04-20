import { NextResponse } from 'next/server';

import { requireAuth, PlanLimitError, AuthError } from '@/lib/auth/middleware';
import { canAccess } from '@/lib/subscription/plans';

/**
 * Single guard for every /api/social/* route. Ensures the caller is
 * authenticated AND has the `social_connect` feature unlocked (premium).
 * Returns the session or a NextResponse with the appropriate error.
 */
export async function requireSocialAccess() {
  try {
    const session = await requireAuth();
    if (!canAccess(session.plan, 'social_connect')) {
      return NextResponse.json(
        {
          error: 'Conectar está disponible solo en el plan Premium',
          upgradeRequired: 'premium',
        },
        { status: 403 },
      );
    }
    return session;
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof PlanLimitError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}

export function isGuardError(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
