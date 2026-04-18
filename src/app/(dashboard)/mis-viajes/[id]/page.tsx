import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/session';
import { redirect, notFound } from 'next/navigation';
import { db, trips, tripStops } from '@/db';
import { eq, and, asc } from 'drizzle-orm';
import Link from 'next/link';
import { getLocale, getTranslations } from '@/lib/i18n/server';

export const metadata: Metadata = {
  title: 'Editar viaje / Edit trip',
  robots: { index: false, follow: false },
};

export default async function TripEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect('/iniciar-sesion');
  const t = await getTranslations();
  const locale = await getLocale();
  const isEn = locale === 'en';
  const T = (es: string, en: string) => (isEn ? en : es);

  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, id), eq(trips.userId, session.userId)))
    .limit(1);

  if (!trip) notFound();

  const stops = await db
    .select()
    .from(tripStops)
    .where(eq(tripStops.tripId, id))
    .orderBy(asc(tripStops.sortOrder));

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/mis-viajes"
            className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t.common.myTrips}
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            {trip.title}
          </h1>
          {trip.description && (
            <p className="mt-1 text-sm text-slate-500">
              {trip.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Share button */}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {T('Compartir', 'Share')}
          </button>
          {/* Export menu */}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {T('Exportar', 'Export')}
          </button>
        </div>
      </div>

      {/* Trip info bar */}
      <div className="mb-6 flex flex-wrap gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        {trip.originName && (
          <div>
            <span className="font-medium text-slate-500">{t.trip.origin}:</span>{' '}
            <span className="text-slate-900">{trip.originName}</span>
          </div>
        )}
        {trip.destinationName && (
          <div>
            <span className="font-medium text-slate-500">{t.trip.destination}:</span>{' '}
            <span className="text-slate-900">{trip.destinationName}</span>
          </div>
        )}
        <div>
          <span className="font-medium text-slate-500">{t.trip.stops}:</span>{' '}
          <span className="text-slate-900">{stops.length}</span>
        </div>
        {trip.totalDistanceKm && (
          <div>
            <span className="font-medium text-slate-500">{t.trip.distance}:</span>{' '}
            <span className="text-slate-900">{trip.totalDistanceKm.toFixed(1)} km</span>
          </div>
        )}
      </div>

      {/* Itinerary */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stops list */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {T('Itinerario', 'Itinerary')}
          </h2>
          {stops.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-500">
                {T('Agrega paradas a tu itinerario para empezar a planear.', 'Add stops to your itinerary to start planning.')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stops.map((stop, index) => (
                <div
                  key={stop.id}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-600">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">
                      {stop.customName || T(`Parada ${index + 1}`, `Stop ${index + 1}`)}
                    </h3>
                    {stop.notes && (
                      <p className="mt-1 text-sm text-slate-500">
                        {stop.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map placeholder */}
        <div className="aspect-square rounded-lg border border-slate-200 bg-slate-100 lg:aspect-auto lg:min-h-[400px]">
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            {T('Mapa del viaje', 'Trip map')}
          </div>
        </div>
      </div>
    </div>
  );
}
