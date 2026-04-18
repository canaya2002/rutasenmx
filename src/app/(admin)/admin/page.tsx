import type { Metadata } from 'next';
import { db, places, users, trips, subscriptions, importRuns } from '@/db';
import { count, eq, desc, isNull } from 'drizzle-orm';
import Link from 'next/link';
import { getLocale } from '@/lib/i18n/server';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
};

async function getStats() {
  const [[placesCount], [usersCount], [tripsCount], [subsCount]] = await Promise.all([
    db.select({ value: count() }).from(places).where(isNull(places.deletedAt)),
    db.select({ value: count() }).from(users).where(isNull(users.deletedAt)),
    db.select({ value: count() }).from(trips).where(isNull(trips.deletedAt)),
    db.select({ value: count() }).from(subscriptions).where(eq(subscriptions.status, 'active')),
  ]);

  return {
    places: placesCount.value,
    users: usersCount.value,
    trips: tripsCount.value,
    subscriptions: subsCount.value,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();
  const locale = await getLocale();
  const isEn = locale === 'en';
  const T = (es: string, en: string) => (isEn ? en : es);

  let recentImports: Array<{
    id: string;
    sourceName: string;
    status: string;
    createdAt: Date;
    totalRecords: number | null;
    errors: number | null;
  }> = [];

  try {
    recentImports = await db
      .select({
        id: importRuns.id,
        sourceName: importRuns.sourceName,
        status: importRuns.status,
        createdAt: importRuns.createdAt,
        totalRecords: importRuns.totalRecords,
        errors: importRuns.errors,
      })
      .from(importRuns)
      .orderBy(desc(importRuns.createdAt))
      .limit(5);
  } catch {
    // importRuns table may not exist yet
  }

  const statCards = [
    { label: T('Lugares', 'Places'), value: stats.places, href: '/admin/lugares', color: 'bg-blue-100 text-blue-700' },
    { label: T('Usuarios', 'Users'), value: stats.users, href: '#', color: 'bg-green-100 text-green-700' },
    { label: T('Viajes', 'Trips'), value: stats.trips, href: '#', color: 'bg-purple-100 text-purple-700' },
    { label: T('Suscripciones activas', 'Active subscriptions'), value: stats.subscriptions, href: '/admin/planes', color: 'bg-emerald-50 text-emerald-700' },
  ];

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-slate-900">
        Admin Dashboard
      </h1>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <p className="text-sm font-medium text-slate-500">
              {stat.label}
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {stat.value.toLocaleString(isEn ? 'en-US' : 'es-MX')}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {T('Acciones rápidas', 'Quick actions')}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/importaciones"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            {T('Ejecutar importación', 'Run import')}
          </Link>
          <Link
            href="/admin/lugares"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            {T('Gestionar lugares', 'Manage places')}
          </Link>
          <Link
            href="/admin/feature-flags"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Feature flags
          </Link>
        </div>
      </div>

      {/* Recent imports */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {T('Importaciones recientes', 'Recent imports')}
        </h2>
        {recentImports.length === 0 ? (
          <p className="text-sm text-slate-500">
            {T('No hay importaciones registradas.', 'No imports recorded.')}
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {T('Fuente', 'Source')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {T('Estado', 'Status')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {T('Registros', 'Records')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {T('Errores', 'Errors')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {T('Fecha', 'Date')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {recentImports.map((run) => (
                  <tr key={run.id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {run.sourceName}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        run.status === 'completed' ? 'bg-green-100 text-green-700' :
                        run.status === 'running' ? 'bg-blue-100 text-blue-700' :
                        run.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {run.totalRecords ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {run.errors ?? 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(run.createdAt).toLocaleDateString(isEn ? 'en-US' : 'es-MX')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
