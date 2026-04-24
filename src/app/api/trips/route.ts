import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import slugify from 'slugify';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';

import { db, trips } from '@/db';
import { getSession } from '@/lib/auth/session';
import { PLAN_LIMITS } from '@/lib/constants';
import { emit, EVENTS } from '@/lib/analytics';

const createSchema = z.object({
  title: z.string().min(1).max(400),
  description: z.string().max(2000).optional(),
  origin: z
    .object({
      name: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
    .optional(),
  destination: z
    .object({
      name: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
    .optional(),
  vehicleType: z.string().optional(),
  avoidTolls: z.boolean().optional(),
  avoidHighways: z.boolean().optional(),
  avoidFerries: z.boolean().optional(),
  avoidDirtRoads: z.boolean().optional(),
});

/**
 * GET /api/trips
 *
 * Returns the authenticated user's trips list (newest first, excluding soft-deleted).
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userTrips = await db
      .select()
      .from(trips)
      .where(and(eq(trips.userId, session.userId), isNull(trips.deletedAt)))
      .orderBy(desc(trips.updatedAt));

    const limits = PLAN_LIMITS[session.plan];

    return NextResponse.json({
      trips: userTrips,
      total: userTrips.length,
      limit: limits.maxSavedTrips === Infinity ? null : limits.maxSavedTrips,
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
 * Creates a new trip for the authenticated user. Enforces the user's plan limit.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Plan limit check (live count from DB)
    const limits = PLAN_LIMITS[session.plan];
    if (limits.maxSavedTrips !== Infinity) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(trips)
        .where(and(eq(trips.userId, session.userId), isNull(trips.deletedAt)));

      if (count >= limits.maxSavedTrips) {
        return NextResponse.json(
          {
            error: 'Has alcanzado el limite de viajes de tu plan',
            limit: limits.maxSavedTrips,
            plan: session.plan,
            upgradeRequired: session.plan === 'free' ? 'pro' : 'premium',
          },
          { status: 403 },
        );
      }
    }

    const data = parsed.data;
    const baseSlug = slugify(data.title, { lower: true, strict: true }).slice(0, 380);
    const slug = `${baseSlug}-${randomBytes(3).toString('hex')}`;

    const [createdTrip] = await db
      .insert(trips)
      .values({
        userId: session.userId,
        title: data.title,
        slug,
        description: data.description ?? null,
        originName: data.origin?.name ?? null,
        originLat: data.origin?.lat ?? null,
        originLng: data.origin?.lng ?? null,
        destinationName: data.destination?.name ?? null,
        destinationLat: data.destination?.lat ?? null,
        destinationLng: data.destination?.lng ?? null,
        vehicleType: data.vehicleType ?? null,
        avoidTolls: data.avoidTolls ?? false,
        avoidHighways: data.avoidHighways ?? false,
        avoidFerries: data.avoidFerries ?? false,
        avoidDirtRoads: data.avoidDirtRoads ?? false,
      })
      .returning();

    emit(EVENTS.trip_created, {
      userId: session.userId,
      properties: {
        tripId: createdTrip.id,
        plan: session.plan,
        hasOrigin: !!data.origin?.name,
        hasDestination: !!data.destination?.name,
      },
    });

    return NextResponse.json({ trip: createdTrip }, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/trips:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
