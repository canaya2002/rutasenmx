import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { and, asc, eq, isNotNull } from 'drizzle-orm';

import { db, trips, tripDays, tripStops } from '@/db';

export const metadata: Metadata = {
  title: 'Viaje compartido | Rutas en MX',
  description:
    'Visualiza un viaje compartido por otro usuario de Rutas en MX.',
  // Shared trips are private-by-token — don't index in search engines.
  robots: { index: false, follow: false },
};

// Always render fresh — share-token lookups shouldn't be statically cached.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ token: string }>;
}

/**
 * Shared trip viewer.
 *
 * Renders a read-only view of a trip whose owner enabled "Compartir" and has
 * `isPublic = true` + a stable `shareToken`. The token is the ONLY proof of
 * access — anyone with the link gets read access. Owner can rotate the
 * token to revoke access.
 *
 * No auth required on this page; that's intentional so friends without an
 * account can still view the itinerary.
 */
export default async function CompartidoPage({ params }: PageProps) {
  const { token } = await params;

  if (!token || token.length < 10) {
    notFound();
  }

  const [trip] = await db
    .select({
      id: trips.id,
      title: trips.title,
      description: trips.description,
      originName: trips.originName,
      destinationName: trips.destinationName,
      totalDistanceKm: trips.totalDistanceKm,
      totalDurationMinutes: trips.totalDurationMinutes,
      currency: trips.currency,
      totalCostEstimateCents: trips.totalCostEstimateCents,
    })
    .from(trips)
    .where(
      and(
        eq(trips.shareToken, token),
        eq(trips.isPublic, true),
        isNotNull(trips.shareToken),
      ),
    )
    .limit(1);

  if (!trip) {
    notFound();
  }

  const days = await db
    .select({
      id: tripDays.id,
      dayNumber: tripDays.dayNumber,
      title: tripDays.title,
      notes: tripDays.notes,
      date: tripDays.date,
    })
    .from(tripDays)
    .where(eq(tripDays.tripId, trip.id))
    .orderBy(asc(tripDays.dayNumber));

  const stops = await db
    .select({
      id: tripStops.id,
      tripDayId: tripStops.tripDayId,
      customName: tripStops.customName,
      sortOrder: tripStops.sortOrder,
      notes: tripStops.notes,
      durationMinutes: tripStops.durationMinutes,
      isWaypointOnly: tripStops.isWaypointOnly,
    })
    .from(tripStops)
    .where(eq(tripStops.tripId, trip.id))
    .orderBy(asc(tripStops.sortOrder));

  const stopsByDay = new Map<string, typeof stops>();
  for (const s of stops) {
    const k = s.tripDayId ?? 'unassigned';
    if (!stopsByDay.has(k)) stopsByDay.set(k, []);
    stopsByDay.get(k)!.push(s);
  }

  const hours = trip.totalDurationMinutes
    ? Math.round((trip.totalDurationMinutes / 60) * 10) / 10
    : null;

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <header className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
          Viaje compartido
        </p>
        <h1 className="mt-1 text-3xl font-bold text-foreground">
          {trip.title}
        </h1>
        {trip.originName && trip.destinationName ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {trip.originName} → {trip.destinationName}
          </p>
        ) : null}
        {trip.description ? (
          <p className="mt-3 text-sm text-foreground/80">{trip.description}</p>
        ) : null}

        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {trip.totalDistanceKm ? (
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Distancia
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-foreground">
                {Math.round(trip.totalDistanceKm)} km
              </dd>
            </div>
          ) : null}
          {hours != null ? (
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Manejo
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-foreground">
                {hours} h
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Días
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-foreground">
              {days.length}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Paradas
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-foreground">
              {stops.length}
            </dd>
          </div>
        </dl>
      </header>

      <section className="mt-6 space-y-4">
        {days.map((day) => {
          const dayStops = stopsByDay.get(day.id) ?? [];
          return (
            <article
              key={day.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h2 className="text-lg font-bold text-foreground">
                Día {day.dayNumber}
                {day.title ? ` — ${day.title}` : ''}
              </h2>
              {day.notes ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {day.notes}
                </p>
              ) : null}
              {dayStops.length === 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Sin paradas asignadas.
                </p>
              ) : (
                <ol className="mt-3 space-y-2">
                  {dayStops.map((s, idx) => (
                    <li
                      key={s.id}
                      className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/50 p-3"
                    >
                      <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {s.customName ?? 'Parada'}
                        </p>
                        {s.durationMinutes ? (
                          <p className="text-xs text-muted-foreground">
                            {s.durationMinutes >= 60
                              ? `${Math.round(s.durationMinutes / 60)} h`
                              : `${s.durationMinutes} min`}
                          </p>
                        ) : null}
                        {s.notes ? (
                          <p className="mt-1 text-xs text-foreground/70">
                            {s.notes}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </article>
          );
        })}
      </section>

      <footer className="mt-8 rounded-2xl border border-border bg-card/50 p-5 text-center">
        <p className="text-sm text-muted-foreground">
          Este viaje fue creado en <strong>Rutas en MX</strong>.
        </p>
        <a
          href="/planear"
          className="mt-3 inline-block rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-black transition hover:bg-emerald-400"
        >
          Planea el tuyo con IA
        </a>
      </footer>
    </main>
  );
}
