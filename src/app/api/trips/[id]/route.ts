import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

// TODO: Switch to DB queries once Drizzle connection is ready
// import { db, trips } from '@/db';
// import { eq, and } from 'drizzle-orm';

/**
 * GET /api/trips/[id]
 *
 * Returns a single trip by ID (must belong to the authenticated user).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 },
      );
    }

    const { id } = await params;

    // TODO: Replace with DB query
    // const [trip] = await db
    //   .select()
    //   .from(trips)
    //   .where(and(eq(trips.id, id), eq(trips.userId, session.userId)))
    //   .limit(1);

    const trip = {
      id,
      userId: session.userId,
      name: 'CDMX a Oaxaca',
      origin: 'Ciudad de Mexico',
      destination: 'Oaxaca de Juarez',
      startDate: '2026-05-01',
      endDate: '2026-05-05',
      days: 5,
      status: 'draft' as const,
      stops: [],
      createdAt: '2026-04-10T12:00:00Z',
      updatedAt: '2026-04-10T12:00:00Z',
    };

    // TODO: Uncomment once using real DB
    // if (!trip) {
    //   return NextResponse.json(
    //     { error: 'Viaje no encontrado' },
    //     { status: 404 },
    //   );
    // }

    return NextResponse.json({ trip });
  } catch (error) {
    console.error('Error en GET /api/trips/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/trips/[id]
 *
 * Updates an existing trip.
 *
 * Body (all optional):
 *   name, origin, destination, startDate, endDate, status, stops
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    // TODO: Verify ownership and update in DB
    // const [existing] = await db
    //   .select()
    //   .from(trips)
    //   .where(and(eq(trips.id, id), eq(trips.userId, session.userId)))
    //   .limit(1);
    //
    // if (!existing) {
    //   return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });
    // }
    //
    // const [updated] = await db
    //   .update(trips)
    //   .set({ ...body, updatedAt: new Date() })
    //   .where(eq(trips.id, id))
    //   .returning();

    const updated = {
      id,
      userId: session.userId,
      name: body.name ?? 'CDMX a Oaxaca',
      origin: body.origin ?? 'Ciudad de Mexico',
      destination: body.destination ?? 'Oaxaca de Juarez',
      startDate: body.startDate ?? null,
      endDate: body.endDate ?? null,
      status: body.status ?? 'draft',
      stops: body.stops ?? [],
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ trip: updated });
  } catch (error) {
    console.error('Error en PUT /api/trips/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/trips/[id]
 *
 * Soft-deletes a trip.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 },
      );
    }

    const { id } = await params;

    // TODO: Verify ownership and soft-delete in DB
    // const [existing] = await db
    //   .select()
    //   .from(trips)
    //   .where(and(eq(trips.id, id), eq(trips.userId, session.userId)))
    //   .limit(1);
    //
    // if (!existing) {
    //   return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });
    // }
    //
    // await db
    //   .update(trips)
    //   .set({ deletedAt: new Date() })
    //   .where(eq(trips.id, id));

    return NextResponse.json({ message: 'Viaje eliminado', id });
  } catch (error) {
    console.error('Error en DELETE /api/trips/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
