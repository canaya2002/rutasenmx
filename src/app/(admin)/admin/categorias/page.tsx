import type { Metadata } from 'next';
import { db, placeCategories } from '@/db';
import { asc } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Categorias | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminCategoriasPage() {
  const categories = await db
    .select()
    .from(placeCategories)
    .orderBy(asc(placeCategories.sortOrder));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Categorias
        </h1>
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Nueva categoria
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Icono</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Color</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Orden</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Activa</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {cat.name}
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{cat.slug}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{cat.icon || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  {cat.color ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-4 w-4 rounded" style={{ backgroundColor: cat.color }} />
                      {cat.color}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{cat.sortOrder}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    cat.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {cat.isActive ? 'Si' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <button type="button" className="text-blue-600 hover:text-blue-800">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
