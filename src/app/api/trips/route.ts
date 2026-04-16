import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

// TODO: Switch to DB queries once Drizzle connection is ready
// import { db, trips } from '@/db';
// import { eq, desc } from 'drizzle-orm';

/** Plan-based trip limits */
const PLAN_TRIP_LIMITS: Record<string, number> = {
  free: 3,
  basic: 10,
  pro: 50,
  premium: Infinity,
};

/**
 * GET /api/trips
 *
 * Returns the authenticated user's trips list.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 },
      );
    }

    // TODO: Replace with DB query
    // const userTrips = await db
    //   .select()
    //   .from(trips)
    //   .where(eq(trips.userId, session.userId))
    //   .orderBy(desc(trips.createdAt));

    const mockTrips = [
      {
        id: 'trip-mock-1',
        name: 'CDMX a Oaxaca',
        origin: 'Ciudad de Mexico',
        destination: 'Oaxaca de Juarez',
        days: 5,
        status: 'draft' as const,
        createdAt: '2026-04-10T12:00:00Z',
      },
    ];

    return NextResponse.json({
      trips: mockTrips,
      total: mockTrips.length,
    });
  } catch (error) {
    console.error('Error en GET /api/trips:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/trips
 *
 * Creates a new trip for the authenticated user.
 *
 * Body:
 *   name         – trip display name
 *   origin       – origin location name
 *   destination  – destination location name
 *   startDate?   – ISO date string
 *   endDate?     – ISO date string
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 },
      );
    }

    // Plan limit check
    const maxTrips = PLAN_TRIP_LIMITS[session.plan] ?? PLAN_TRIP_LIMITS.free;

    // TODO: Replace with actual count from DB
    // const [{ count }] = await db
    //   .select({ count: sql<number>`count(*)` })
    //   .from(trips)
    //   .where(eq(trips.userId, session.userId));
    const currentTripCount = 1; // mock

    if (currentTripCount >= maxTrips) {
      return NextResponse.json(
        {
          error: 'Has alcanzado el limite de viajes de tu plan',
          limit: maxTrips,
          plan: session.plan,
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    if (!body.name || !body.origin || !body.destination) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: name, origin, destination' },
        { status: 400 },
      );
    }

    // TODO: Insert into DB
    // const [newTrip] = await db.insert(trips).values({ ... }).returning();

    const newTrip = {
      id: `trip-${Date.now()}`,
      userId: session.userId,
      name: body.name,
      origin: body.origin,
      destination: body.destination,
      startDate: body.startDate ?? null,
      endDate: body.endDate ?? null,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ trip: newTrip }, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/trips:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
