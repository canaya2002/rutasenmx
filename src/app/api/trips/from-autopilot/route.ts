import { NextResponse } from 'next/server';
import { z } from 'zod';
import slugify from 'slugify';
import { randomBytes } from 'node:crypto';
import { and, eq, isNull, sql } from 'drizzle-orm';

import { db, trips, tripDays, tripStops, places } from '@/db';
import { getSession } from '@/lib/auth/session';
import { PLAN_LIMITS } from '@/lib/constants';
import { emit, EVENTS } from '@/lib/analytics';

/**
 * Persists an AutopilotOutput as a real trip + trip_days + trip_stops.
 *
 * Called from the Autopilot wizard's "Guardar viaje" button. The body is the
 * itinerary the API already returned to the client — we re-validate it
 * server-side (never trust the shape of client-held data) and enforce the
 * user's plan limit on number of saved trips.
 */

const stopSchema = z.object({
  placeId: z.string().optional().nullable(),
  placeName: z.string(),
  placeSlug: z.string().optional(),
  category: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  reason: z.string().optional(),
  suggestedDuration: z.number().optional(),
  highlights: z.array(z.string()).optional(),
});

const daySchema = z.object({
  dayNumber: z.number(),
  date: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  stops: z.array(stopSchema),
  drivingMinutes: z.number().optional(),
  drivingKm: z.number().optional(),
});

const bodySchema = z.object({
  tripTitle: z.string().min(1).max(400),
  tripDescription: z.string().optional(),
  days: z.array(daySchema),
  totalDistance: z.number().optional(),
  totalDuration: z.number().optional(),
  source: z.enum(['llm', 'heuristic']).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Itinerario invalido', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;

    // Plan limit enforcement
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

    // Derive origin/destination from first/last stop (or leave blank).
    const firstStop = data.days[0]?.stops[0];
    const lastDay = data.days[data.days.length - 1];
    const lastStop = lastDay?.stops[lastDay.stops.length - 1];

    const baseSlug = slugify(data.tripTitle, { lower: true, strict: true }).slice(0, 380);
    const slug = `${baseSlug}-${randomBytes(3).toString('hex')}`;

    // One transaction: trip → days → stops. Partial writes are confusing,
    // so we commit the whole itinerary or nothing.
    const newTripId = await db.transaction(async (tx) => {
      const [trip] = await tx
        .insert(trips)
        .values({
          userId: session.userId,
          title: data.tripTitle,
          slug,
          description: data.tripDescription ?? null,
          originName: firstStop?.placeName ?? null,
          originLat: firstStop?.lat ?? null,
          originLng: firstStop?.lng ?? null,
          destinationName: lastStop?.placeName ?? null,
          destinationLat: lastStop?.lat ?? null,
          destinationLng: lastStop?.lng ?? null,
          totalDistanceKm: data.totalDistance ?? null,
          totalDurationMinutes: data.totalDuration ?? null,
          status: 'planning',
        })
        .returning({ id: trips.id });

      const stopRows: Array<typeof tripStops.$inferInsert> = [];

      for (const day of data.days) {
        const [createdDay] = await tx
          .insert(tripDays)
          .values({
            tripId: trip.id,
            dayNumber: day.dayNumber,
            date: day.date ?? null,
            title: day.title ?? null,
            notes: day.description ?? null,
          })
          .returning({ id: tripDays.id });

        day.stops.forEach((stop, idx) => {
          stopRows.push({
            tripId: trip.id,
            tripDayId: createdDay.id,
            // Only link placeId if it looks like a valid UUID — AutopilotOutput
            // stops sometimes carry non-UUID placeholder IDs from the heuristic.
            placeId: isUuid(stop.placeId) ? (stop.placeId as string) : null,
            customName: stop.placeName,
            customLat: stop.lat,
            customLng: stop.lng,
            sortOrder: idx,
            notes: stop.reason ?? null,
            durationMinutes: stop.suggestedDuration ?? null,
          });
        });
      }

      if (stopRows.length > 0) {
        // Drop any stops referencing places that don't actually exist, to avoid
        // blowing up the FK on places.
        const placeIds = Array.from(
          new Set(stopRows.map((s) => s.placeId).filter(Boolean) as string[]),
        );
        let valid = new Set<string>();
        if (placeIds.length > 0) {
          const rows = await tx
            .select({ id: places.id })
            .from(places)
            .where(sql`${places.id} = ANY(${placeIds}::uuid[])`);
          valid = new Set(rows.map((r) => r.id));
        }
        for (const row of stopRows) {
          if (row.placeId && !valid.has(row.placeId)) row.placeId = null;
        }
        await tx.insert(tripStops).values(stopRows);
      }

      return trip.id;
    });

    emit(EVENTS.trip_saved_from_autopilot, {
      userId: session.userId,
      properties: {
        tripId: newTripId,
        plan: session.plan,
        dayCount: data.days.length,
        source: data.source ?? null,
      },
    });

    return NextResponse.json(
      { tripId: newTripId, redirect: `/mis-viajes/${newTripId}` },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error en POST /api/trips/from-autopilot:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

function isUuid(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
  );
}
