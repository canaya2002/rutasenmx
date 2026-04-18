import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { db, trips } from '@/db';
import { eq, isNull, desc } from 'drizzle-orm';
import { PLAN_LIMITS } from '@/lib/constants';
import { getTranslations, getLocale } from '@/lib/i18n/server';

export const metadata: Metadata = {
  title: 'Mis viajes',
  robots: { index: false, follow: false },
};

export default async function MisViajesPage() {
  const session = await getSession();
  if (!session) redirect('/iniciar-sesion');
  const t = await getTranslations();
  const locale = await getLocale();
  const isEn = locale === 'en';
  const L = {
    tripsUsed: (used: number, max: string | number) =>
      isEn ? `${used} of ${max} trips used` : `${used} de ${max} viajes usados`,
    unlimited: isEn ? 'unlimited' : 'ilimitados',
    upgradePlan: isEn ? 'Upgrade plan' : 'Subir de plan',
    newTrip: isEn ? 'New trip' : 'Nuevo viaje',
    noTripsYet: isEn ? 'No trips yet' : 'No tienes viajes aún',
    noTripsDesc: isEn
      ? 'Create your first trip and start planning your road trip through Mexico.'
      : 'Crea tu primer viaje y empieza a planear tu ruta por México.',
    createFirstTrip: isEn ? 'Create my first trip' : 'Crear mi primer viaje',
    noRoute: isEn ? 'No route defined' : 'Sin ruta definida',
    status: {
      draft: isEn ? 'Draft' : 'Borrador',
      planning: isEn ? 'Planning' : 'Planeando',
      active: isEn ? 'Active' : 'Activo',
      completed: isEn ? 'Completed' : 'Completado',
      archived: isEn ? 'Archived' : 'Archivado',
    },
    editedOn: isEn ? 'Edited' : 'Editado',
  };

  const userTrips = await db
    .select()
    .from(trips)
    .where(eq(trips.userId, session.userId))
    .orderBy(desc(trips.updatedAt));

  const activeTrips = userTrips.filter((t) => !t.deletedAt);
  const planKey = session.plan as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[planKey];
  const maxTrips = limits.maxSavedTrips;
  const atLimit = activeTrips.length >= maxTrips;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t.common.myTrips}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {L.tripsUsed(activeTrips.length, maxTrips === Infinity ? L.unlimited : maxTrips)}
          </p>
        </div>
        <div>
          {atLimit ? (
            <Link
              href="/precios"
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {L.upgradePlan}
            </Link>
          ) : (
            <Link
              href="/planear"
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {L.newTrip}
            </Link>
          )}
        </div>
      </div>

      {/* Plan limit bar */}
      {maxTrips !== Infinity && (
        <div className="mb-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all ${
                atLimit ? 'bg-red-500' : 'bg-black'
              }`}
              style={{ width: `${Math.min((activeTrips.length / maxTrips) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {activeTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16">
          <svg className="mb-4 h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            {L.noTripsYet}
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            {L.noTripsDesc}
          </p>
          <Link
            href="/planear"
            className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            {L.createFirstTrip}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeTrips.map((trip) => (
            <Link
              key={trip.id}
              href={`/mis-viajes/${trip.id}`}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600">
                {trip.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {trip.originName && trip.destinationName
                  ? `${trip.originName} → ${trip.destinationName}`
                  : L.noRoute}
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block h-2 w-2 rounded-full ${
                    trip.status === 'active' ? 'bg-green-500' :
                    trip.status === 'draft' ? 'bg-yellow-500' :
                    trip.status === 'completed' ? 'bg-blue-500' : 'bg-slate-400'
                  }`} />
                  {trip.status === 'draft' ? L.status.draft :
                   trip.status === 'planning' ? L.status.planning :
                   trip.status === 'active' ? L.status.active :
                   trip.status === 'completed' ? L.status.completed : L.status.archived}
                </span>
                <span>
                  {L.editedOn} {new Date(trip.updatedAt).toLocaleDateString(isEn ? 'en-US' : 'es-MX', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
