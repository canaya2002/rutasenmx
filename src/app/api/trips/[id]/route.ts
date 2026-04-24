import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';

import { db, trips } from '@/db';
import { getSession } from '@/lib/auth/session';
import { emit, EVENTS } from '@/lib/analytics';

const updateSchema = z.object({
  title: z.string().min(1).max(400).optional(),
  description: z.string().max(2000).nullable().optional(),
  originName: z.string().nullable().optional(),
  originLat: z.number().nullable().optional(),
  originLng: z.number().nullable().optional(),
  destinationName: z.string().nullable().optional(),
  destinationLat: z.number().nullable().optional(),
  destinationLng: z.number().nullable().optional(),
  status: z.enum(['draft', 'planning', 'active', 'completed', 'archived']).optional(),
  isPublic: z.boolean().optional(),
  vehicleType: z.string().nullable().optional(),
  avoidTolls: z.boolean().optional(),
  avoidHighways: z.boolean().optional(),
  avoidFerries: z.boolean().optional(),
  avoidDirtRoads: z.boolean().optional(),
});

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
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;

    const [trip] = await db
      .select()
      .from(trips)
      .where(and(eq(trips.id, id), eq(trips.userId, session.userId)))
      .limit(1);

    if (!trip || trip.deletedAt) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });
    }

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
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select({ id: trips.id, deletedAt: trips.deletedAt })
      .from(trips)
      .where(and(eq(trips.id, id), eq(trips.userId, session.userId)))
      .limit(1);

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });
    }

    const [updated] = await db
      .update(trips)
      .set(parsed.data)
      .where(eq(trips.id, id))
      .returning();

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
 * Soft-deletes a trip (sets deletedAt).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;

    const [existing] = await db
      .select({ id: trips.id, deletedAt: trips.deletedAt })
      .from(trips)
      .where(and(eq(trips.id, id), eq(trips.userId, session.userId)))
      .limit(1);

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });
    }

    await db
      .update(trips)
      .set({ deletedAt: new Date() })
      .where(eq(trips.id, id));

    emit(EVENTS.trip_deleted, {
      userId: session.userId,
      properties: { tripId: id },
    });

    return NextResponse.json({ message: 'Viaje eliminado', id });
  } catch (error) {
    console.error('Error en DELETE /api/trips/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
