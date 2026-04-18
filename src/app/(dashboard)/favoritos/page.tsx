import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { db, savedPlaces, places, placeCategories } from '@/db';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { getTranslations, getLocale } from '@/lib/i18n/server';

export const metadata: Metadata = {
  title: 'Favoritos',
  robots: { index: false, follow: false },
};

export default async function FavoritosPage() {
  const session = await getSession();
  if (!session) redirect('/iniciar-sesion');
  const t = await getTranslations();
  const locale = await getLocale();
  const isEn = locale === 'en';

  const favorites = await db
    .select({
      id: savedPlaces.id,
      notes: savedPlaces.notes,
      createdAt: savedPlaces.createdAt,
      placeId: places.id,
      placeName: places.name,
      placeSlug: places.slug,
      placeState: places.state,
      placeImage: places.primaryImageUrl,
      categoryName: placeCategories.name,
      categorySlug: placeCategories.slug,
    })
    .from(savedPlaces)
    .innerJoin(places, eq(savedPlaces.placeId, places.id))
    .leftJoin(placeCategories, eq(places.categoryId, placeCategories.id))
    .where(eq(savedPlaces.userId, session.userId))
    .orderBy(desc(savedPlaces.createdAt));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {t.common.favorites}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isEn
            ? `${favorites.length} saved place${favorites.length !== 1 ? 's' : ''}`
            : `${favorites.length} lugar${favorites.length !== 1 ? 'es' : ''} guardado${favorites.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16">
          <svg className="mb-4 h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            {isEn ? 'No favorites yet' : 'No tienes favoritos aún'}
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            {isEn
              ? 'Explore places and save your favorites to find them easily.'
              : 'Explora lugares y guarda tus favoritos para encontrarlos fácilmente.'}
          </p>
          <Link
            href="/explorar"
            className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            {isEn ? 'Explore places' : 'Explorar lugares'}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              className="group relative rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              {/* Image */}
              <div className="aspect-[4/3] overflow-hidden rounded-t-xl bg-slate-100">
                {fav.placeImage ? (
                  <img
                    src={fav.placeImage}
                    alt={fav.placeName}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    {isEn ? 'No image' : 'Sin imagen'}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <Link
                  href={`/lugares/${fav.placeSlug}`}
                  className="font-semibold text-slate-900 hover:text-emerald-600"
                >
                  {fav.placeName}
                </Link>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  {fav.categoryName && <span>{fav.categoryName}</span>}
                  {fav.categoryName && fav.placeState && <span>-</span>}
                  {fav.placeState && <span>{fav.placeState}</span>}
                </div>
                {fav.notes && (
                  <p className="mt-2 text-sm text-slate-600">
                    {fav.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
