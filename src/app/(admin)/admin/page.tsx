import type { Metadata } from 'next';
import { db, places, users, trips, subscriptions, importRuns } from '@/db';
import { count, eq, desc, isNull } from 'drizzle-orm';
import Link from 'next/link';

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
    { label: 'Lugares', value: stats.places, href: '/admin/lugares', color: 'bg-blue-100 text-blue-700' },
    { label: 'Usuarios', value: stats.users, href: '#', color: 'bg-green-100 text-green-700' },
    { label: 'Viajes', value: stats.trips, href: '#', color: 'bg-purple-100 text-purple-700' },
    { label: 'Suscripciones activas', value: stats.subscriptions, href: '/admin/planes', color: 'bg-orange-100 text-orange-700' },
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
              {stat.value.toLocaleString('es-MX')}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Acciones rapidas
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/importaciones"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Ejecutar importacion
          </Link>
          <Link
            href="/admin/lugares"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Gestionar lugares
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
          Importaciones recientes
        </h2>
        {recentImports.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hay importaciones registradas.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Fuente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Registros
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Errores
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Fecha
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
                      {new Date(run.createdAt).toLocaleDateString('es-MX')}
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
