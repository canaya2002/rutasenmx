import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import Link from 'next/link';

import { db, savedPlaces } from '@/db';
import { getSession } from '@/lib/auth/session';
import { getPlaceBySlug } from '@/lib/data/mock';
import { getTranslations, getLocale } from '@/lib/i18n/server';
import { FavoriteCard } from '@/components/favorites/FavoriteCard';

export const metadata: Metadata = {
  title: 'Favoritos',
  robots: { index: false, follow: false },
};

/**
 * Favorites dashboard. Reads from `saved_places` keyed by slug (the catalog
 * is editorial static content — see `src/lib/data/mock.ts` — not a DB table)
 * and enriches each row with the place metadata server-side so the client
 * gets a complete card payload.
 *
 * Rows whose slug no longer exists in the catalog are hidden (soft-delete
 * from the user's POV) instead of erroring.
 */
export default async function FavoritosPage() {
  const session = await getSession();
  if (!session) redirect('/iniciar-sesion');

  const t = await getTranslations();
  const locale = await getLocale();
  const isEn = locale === 'en';

  const rows = await db
    .select({
      id: savedPlaces.id,
      placeSlug: savedPlaces.placeSlug,
      notes: savedPlaces.notes,
      createdAt: savedPlaces.createdAt,
    })
    .from(savedPlaces)
    .where(
      and(
        eq(savedPlaces.userId, session.userId),
        isNotNull(savedPlaces.placeSlug),
      ),
    )
    .orderBy(desc(savedPlaces.createdAt));

  const favorites = rows
    .map((r) => {
      const place = r.placeSlug ? getPlaceBySlug(r.placeSlug) : undefined;
      if (!place) return null;
      return {
        id: r.id,
        slug: place.slug,
        name: place.name,
        image: place.image,
        categoryName: place.categoryName,
        stateName: place.stateName,
        notes: r.notes,
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

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
          <svg
            className="mb-4 h-12 w-12 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
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
            <FavoriteCard key={fav.id} fav={fav} isEn={isEn} />
          ))}
        </div>
      )}
    </div>
  );
}
