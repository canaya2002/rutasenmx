import type { Metadata } from 'next';
import { db, places, placeCategories } from '@/db';
import { desc, isNull, eq, count } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Lugares | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminLugaresPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { search = '', page = '1' } = await searchParams;
  const searchStr = typeof search === 'string' ? search : '';
  const pageNum = Math.max(1, parseInt(typeof page === 'string' ? page : '1', 10));
  const limit = 50;
  const offset = (pageNum - 1) * limit;

  const [totalResult] = await db.select({ value: count() }).from(places).where(isNull(places.deletedAt));
  const total = totalResult.value;

  const query = db
    .select({
      id: places.id,
      name: places.name,
      slug: places.slug,
      state: places.state,
      isPublished: places.isPublished,
      isFeatured: places.isFeatured,
      isSponsored: places.isSponsored,
      confidenceScore: places.confidenceScore,
      categoryName: placeCategories.name,
      updatedAt: places.updatedAt,
    })
    .from(places)
    .leftJoin(placeCategories, eq(places.categoryId, placeCategories.id))
    .where(isNull(places.deletedAt))
    .orderBy(desc(places.updatedAt))
    .limit(limit)
    .offset(offset);

  const placesList = await query;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Lugares
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {total.toLocaleString('es-MX')} lugares totales
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Agregar lugar
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form method="GET" className="flex gap-2">
          <input
            name="search"
            type="text"
            defaultValue={searchStr}
            placeholder="Buscar por nombre..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Categoria
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Calidad
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {placesList.map((place) => (
              <tr key={place.id}>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {place.name}
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {place.categoryName || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {place.state || '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-1">
                    {place.isPublished && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Publicado
                      </span>
                    )}
                    {place.isFeatured && (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                        Destacado
                      </span>
                    )}
                    {place.isSponsored && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        Patrocinado
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {place.confidenceScore ?? 0}%
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button type="button" className="text-blue-600 hover:text-blue-800">
                      Editar
                    </button>
                    <button type="button" className="text-red-600 hover:text-red-800">
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <p>
          Mostrando {offset + 1}-{Math.min(offset + limit, total)} de {total}
        </p>
        <div className="flex gap-2">
          {pageNum > 1 && (
            <a
              href={`/admin/lugares?page=${pageNum - 1}${searchStr ? `&search=${searchStr}` : ''}`}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Anterior
            </a>
          )}
          {offset + limit < total && (
            <a
              href={`/admin/lugares?page=${pageNum + 1}${searchStr ? `&search=${searchStr}` : ''}`}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Siguiente
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
