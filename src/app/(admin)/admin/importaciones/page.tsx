import type { Metadata } from 'next';
import { db, importRuns } from '@/db';
import { desc } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Importaciones | Admin',
  robots: { index: false, follow: false },
};

const IMPORT_SOURCES = [
  { key: 'pueblos-magicos', label: 'Pueblos Magicos' },
  { key: 'museos', label: 'Museos INAH' },
  { key: 'zonas-arqueologicas', label: 'Zonas Arqueologicas' },
  { key: 'sitios-inah', label: 'Sitios INAH' },
] as const;

export default async function AdminImportacionesPage() {
  let runs: Array<{
    id: string;
    sourceName: string;
    status: string;
    startedAt: Date | null;
    completedAt: Date | null;
    totalRecords: number | null;
    inserted: number | null;
    updated: number | null;
    skipped: number | null;
    errors: number | null;
    dryRun: boolean;
    createdAt: Date;
  }> = [];

  try {
    runs = await db
      .select({
        id: importRuns.id,
        sourceName: importRuns.sourceName,
        status: importRuns.status,
        startedAt: importRuns.startedAt,
        completedAt: importRuns.completedAt,
        totalRecords: importRuns.totalRecords,
        inserted: importRuns.inserted,
        updated: importRuns.updated,
        skipped: importRuns.skipped,
        errors: importRuns.errors,
        dryRun: importRuns.dryRun,
        createdAt: importRuns.createdAt,
      })
      .from(importRuns)
      .orderBy(desc(importRuns.createdAt))
      .limit(100);
  } catch {
    // Table may not exist yet
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Importaciones
        </h1>
      </div>

      {/* Start import buttons */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Iniciar nueva importacion
        </h2>
        <div className="flex flex-wrap gap-3">
          {IMPORT_SOURCES.map((source) => (
            <form key={source.key} action={`/api/admin/import/${source.key}`} method="POST">
              <button
                type="submit"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {source.label}
              </button>
            </form>
          ))}
        </div>
      </div>

      {/* Import runs table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Fuente</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Insertados</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Actualizados</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Omitidos</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Errores</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Dry run</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {runs.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                  No hay importaciones registradas.
                </td>
              </tr>
            ) : (
              runs.map((run) => (
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
                  <td className="px-4 py-3 text-sm text-slate-500">{run.totalRecords ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{run.inserted ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{run.updated ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{run.skipped ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{run.errors ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{run.dryRun ? 'Si' : 'No'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {new Date(run.createdAt).toLocaleString('es-MX')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
