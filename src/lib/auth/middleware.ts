import { getSession, type SessionPayload } from './session';
import { PLAN_LIMITS } from '@/lib/constants';

// ── Error types ─────────────────────────────────────────────────────────────
export class AuthError extends Error {
  public status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export class ForbiddenError extends AuthError {
  constructor(message = 'No tienes permiso para realizar esta acción') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class PlanLimitError extends AuthError {
  constructor(message = 'Tu plan actual no incluye esta funcionalidad') {
    super(message, 403);
    this.name = 'PlanLimitError';
  }
}

// ── Plan hierarchy ──────────────────────────────────────────────────────────
const PLAN_HIERARCHY: Record<string, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  premium: 3,
};

type PlanName = keyof typeof PLAN_LIMITS;

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Requires an authenticated session. Throws AuthError if no valid session.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new AuthError('Inicia sesión para continuar');
  }
  return session;
}

/**
 * Requires an admin session. Throws ForbiddenError if not admin.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== 'admin') {
    throw new ForbiddenError('Se requieren permisos de administrador');
  }
  return session;
}

/**
 * Returns the session if present, or null. Never throws.
 */
export async function optionalAuth(): Promise<SessionPayload | null> {
  return getSession();
}

/**
 * Requires the user to be on at least `minPlan`. Throws PlanLimitError otherwise.
 */
export async function requirePlan(minPlan: PlanName): Promise<SessionPayload> {
  const session = await requireAuth();
  const userLevel = PLAN_HIERARCHY[session.plan] ?? 0;
  const requiredLevel = PLAN_HIERARCHY[minPlan] ?? 0;

  if (userLevel < requiredLevel) {
    throw new PlanLimitError(
      `Se requiere el plan "${minPlan}" o superior. Tu plan actual es "${session.plan}".`,
    );
  }

  return session;
}

/**
 * Checks whether the authenticated user can save another trip.
 */
export async function canSaveTrip(currentTripCount: number): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  const limits = PLAN_LIMITS[session.plan as PlanName];
  return currentTripCount < limits.maxSavedTrips;
}

/**
 * Checks whether the authenticated user can add another stop to a trip.
 */
export async function canAddStop(currentStopCount: number): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  const limits = PLAN_LIMITS[session.plan as PlanName];
  return currentStopCount < limits.maxStopsPerTrip;
}
