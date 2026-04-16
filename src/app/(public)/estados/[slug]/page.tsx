import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { estadoBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/seo/schema';
import {
  mockStates,
  getStateBySlug,
  getPlacesByState,
  getPlacesByStateAndCategory,
  getRelatedStates,
} from '@/lib/data/mock';
import { mockRoutes } from '@/lib/data/mock';
import { getStateHeroImage, getStateGallery } from '@/lib/data/state-images';
import { getTranslations } from '@/lib/i18n/server';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return mockStates.map((state) => ({ slug: state.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) return {};

  return buildPageMetadata({
    title: `${state.name}: rutas, Pueblos Mágicos, museos y qué hacer`,
    description: state.description,
    path: `/estados/${state.slug}`,
    keywords: [
      state.name,
      `turismo ${state.name}`,
      `qué hacer en ${state.name}`,
      `pueblos mágicos ${state.name}`,
      `rutas ${state.name}`,
    ],
  });
}

export default async function EstadoPage({ params }: Props) {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) notFound();

  const allPlaces = getPlacesByState(slug);
  const pueblos = getPlacesByStateAndCategory(slug, 'pueblos-magicos');
  const museos = getPlacesByStateAndCategory(slug, 'museos');
  const zonas = getPlacesByStateAndCategory(slug, 'zonas-arqueologicas');
  const relatedStates = getRelatedStates(slug, 4);
  const stateRoutes = mockRoutes.filter((r) => r.statesSlugs.includes(slug));

  const t = await getTranslations();
  const heroImage = getStateHeroImage(slug);
  const gallery = getStateGallery(slug);
  // Remove the hero from the gallery grid so it isn't shown twice
  const galleryWithoutHero = gallery.filter((img) => img !== heroImage);

  const breadcrumbs = estadoBreadcrumbs(state.name, state.slug);

  const collectionSchema = buildCollectionPageSchema(
    `${state.name}: lugares y rutas`,
    state.description,
    allPlaces.map((p) => ({
      name: p.name,
      url: `https://rutasenmx.com/lugares/${p.slug}`,
      image: p.image,
      description: p.description,
    })),
  );

  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-zinc-500">
          <ol className="flex items-center gap-2">
            {breadcrumbs.map((item, idx) => (
              <li key={item.href} className="flex items-center gap-2">
                {idx > 0 && <span aria-hidden="true">/</span>}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="text-zinc-900">{item.label}</span>
                ) : (
                  <Link href={item.href} className="hover:text-zinc-900">
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Hero banner */}
        {heroImage ? (
          <section className="relative mb-10 overflow-hidden rounded-2xl">
            <div className="relative aspect-[21/9] w-full">
              <Image
                src={heroImage}
                alt={t.pages.estadoDetail.featuredPhotoAlt.replace('{state}', state.name)}
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
                <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-md sm:text-5xl">
                  {state.name}
                </h1>
                <p className="mt-2 max-w-2xl text-base leading-7 text-white/90 sm:text-lg">
                  {state.description}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {t.pages.estadoDetail.capital}: {state.capital} &middot; {state.placeCount} {t.pages.estadoDetail.registeredPlaces}
                </p>
              </div>
            </div>
          </section>
        ) : (
          <header className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              {state.name}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
              {state.description}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {t.pages.estadoDetail.capital}: {state.capital} &middot; {state.placeCount} {t.pages.estadoDetail.registeredPlaces}
            </p>
          </header>
        )}

        {/* Photo gallery */}
        {galleryWithoutHero.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-zinc-900">
              {t.pages.estadoDetail.photosOf.replace('{state}', state.name)}
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {galleryWithoutHero.map((src) => (
                <div
                  key={src}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl"
                >
                  <Image
                    src={src}
                    alt={t.pages.estadoDetail.photoAlt.replace('{state}', state.name)}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-16">
            {/* Pueblos Mágicos */}
            {pueblos.length > 0 && (
              <section>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-zinc-900">
                    {t.pages.estadoDetail.pueblosMagicosIn.replace('{state}', state.name)}
                  </h2>
                  <Link
                    href={`/pueblos-magicos/${state.slug}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {t.pages.estadoDetail.viewAll}
                  </Link>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {pueblos.map((place) => (
                    <Link
                      key={place.slug}
                      href={`/lugares/${place.slug}`}
                      className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600">
                        {place.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{place.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {place.badges.slice(0, 3).map((badge) => (
                          <span
                            key={badge}
                            className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Museos */}
            {museos.length > 0 && (
              <section>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-zinc-900">
                    {t.pages.estadoDetail.museosIn.replace('{state}', state.name)}
                  </h2>
                  <Link
                    href={`/museos/${state.slug}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {t.pages.estadoDetail.viewAll}
                  </Link>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {museos.map((place) => (
                    <Link
                      key={place.slug}
                      href={`/lugares/${place.slug}`}
                      className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600">
                        {place.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{place.description}</p>
                      {place.openingHours && (
                        <p className="mt-2 text-xs text-zinc-400">{place.openingHours}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Zonas arqueológicas */}
            {zonas.length > 0 && (
              <section>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-zinc-900">
                    {t.pages.estadoDetail.zonasIn.replace('{state}', state.name)}
                  </h2>
                  <Link
                    href={`/zonas-arqueologicas/${state.slug}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {t.pages.estadoDetail.viewAllFem}
                  </Link>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {zonas.map((place) => (
                    <Link
                      key={place.slug}
                      href={`/lugares/${place.slug}`}
                      className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600">
                        {place.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{place.description}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Rutas */}
            {stateRoutes.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-zinc-900">
                  {t.pages.estadoDetail.rutasIn.replace('{state}', state.name)}
                </h2>
                <div className="mt-6 space-y-4">
                  {stateRoutes.map((route) => (
                    <Link
                      key={route.slug}
                      href={`/rutas/${route.slug}`}
                      className="group block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600">
                        {route.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                        {route.description}
                      </p>
                      <p className="mt-2 text-xs text-zinc-400">
                        {route.distanceKm} km &middot; {route.durationDays} {t.pages.estadoDetail.days} &middot;{' '}
                        {route.stops.length} {t.pages.estadoDetail.stops}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Featured places */}
            {allPlaces.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-zinc-900">
                  {t.pages.estadoDetail.allPlacesIn.replace('{state}', state.name)}
                </h2>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {allPlaces.map((place) => (
                    <Link
                      key={place.slug}
                      href={`/lugares/${place.slug}`}
                      className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <span className="mb-1 inline-block rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                        {place.categoryName}
                      </span>
                      <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600">
                        {place.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{place.description}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Related states */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.pages.estadoDetail.nearbyStates}
              </h3>
              <ul className="mt-4 space-y-3">
                {relatedStates.map((rs) => (
                  <li key={rs.slug}>
                    <Link
                      href={`/estados/${rs.slug}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {rs.name}
                    </Link>
                    <p className="line-clamp-1 text-xs text-zinc-400">{rs.placeCount} {t.pages.estados.placesCount}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick links */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.pages.estadoDetail.categories}
              </h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link
                    href={`/pueblos-magicos/${state.slug}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {t.pages.estadoDetail.pueblosMagicosIn.replace('{state}', state.name)}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/museos/${state.slug}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {t.pages.estadoDetail.museosIn.replace('{state}', state.name)}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/zonas-arqueologicas/${state.slug}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {t.pages.estadoDetail.zonasIn.replace('{state}', state.name)}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Rutas link */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.pages.estadoDetail.planYourTrip}
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                {t.pages.estadoDetail.discoverBestRoutes.replace('{state}', state.name)}
              </p>
              <Link
                href="/rutas"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {t.pages.estadoDetail.viewRoutes}
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
