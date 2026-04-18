import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema, buildCollectionPageSchema, buildItemListSchema } from '@/lib/seo/schema';
import { getPlacesByCategory, getStatesWithCategory } from '@/lib/data/mock';
import { getTranslations } from '@/lib/i18n/server';
import { StaticMapPreview } from '@/components/map/StaticMapPreview';
import { DensityStaticMap } from '@/components/map/DensityStaticMap';
import { MapPin } from 'lucide-react';

const PAGE_PATH = '/museos';
const PAGE_TITLE = 'Museos en México: directorio, mapa y horarios';
const PAGE_DESCRIPTION =
  'Directorio completo de museos en México. Encuentra horarios, precios, ubicación y cómo llegar a los mejores museos de cada estado.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    keywords: [
      'museos en México',
      'museos CDMX',
      'mejores museos México',
      'horarios museos',
      'museos gratuitos',
    ],
  });
}

export default async function MuseosPage() {
  const t = await getTranslations();
  const museos = getPlacesByCategory('museos');
  const statesWithMuseos = getStatesWithCategory('museos');
  const breadcrumbs = buildBreadcrumbs([{ label: t.common.museums, href: PAGE_PATH }]);

  const collectionSchema = buildCollectionPageSchema(
    PAGE_TITLE,
    PAGE_DESCRIPTION,
    museos.map((m) => ({
      name: m.name,
      url: `https://rutasenmx.com/lugares/${m.slug}`,
      image: m.image,
      description: m.description,
    })),
  );

  const itemListSchema = buildItemListSchema(
    museos.map((m) => ({
      name: m.name,
      url: `https://rutasenmx.com/lugares/${m.slug}`,
      image: m.image,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Hero */}
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            {t.pages.museos.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            {t.pages.museos.description}
          </p>
        </header>

        {/* Density map — every museum plotted */}
        <section className="mb-12">
          <div className="relative h-64 w-full overflow-hidden rounded-3xl border border-slate-200 shadow-md sm:h-80">
            <DensityStaticMap
              points={museos
                .filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng))
                .map((m) => ({ lat: m.lat, lng: m.lng }))}
              alt="Mapa de museos en México"
              pinColor="8B5CF6"
              maxPoints={70}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-md backdrop-blur-sm">
              <MapPin className="mr-1 inline h-3 w-3 text-purple-500" />
              {museos.length} museos en el mapa
            </div>
          </div>
        </section>

        {/* Filter by state */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-zinc-900">{t.pages.museos.filterByState}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {statesWithMuseos.map((state) => (
              <Link
                key={state.slug}
                href={`/museos/${state.slug}`}
                className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm text-zinc-700 transition hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
              >
                {state.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Grid with static map previews */}
        <section aria-label={t.pages.museos.listLabel}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {museos.slice(0, 60).map((museo) => {
              const hasCoords = Number.isFinite(museo.lat) && Number.isFinite(museo.lng);
              return (
                <Link
                  key={museo.slug}
                  href={`/lugares/${museo.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-lg"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
                    {hasCoords ? (
                      <StaticMapPreview
                        lat={museo.lat}
                        lng={museo.lng}
                        alt={`Mapa de ${museo.name}`}
                        pinColor="8B5CF6"
                        zoom={14}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-zinc-400">
                        {museo.name}
                      </div>
                    )}
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-purple-500/95 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/icon/museumicon.svg" alt="" className="h-3.5 w-3.5 brightness-0 invert" aria-hidden />
                      Museo
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-purple-600">
                      {museo.name}
                    </h3>
                    <p className="mt-0.5 text-sm font-medium text-purple-700/70">{museo.stateName}</p>
                    <p className="mt-2 flex-1 line-clamp-2 text-sm text-zinc-500">{museo.description}</p>
                    {(museo.openingHours || museo.price) && (
                      <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400">
                        {museo.openingHours && <span>{museo.openingHours}</span>}
                        {museo.price && <span>{museo.price}</span>}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          {museos.length > 60 && (
            <p className="mt-6 text-center text-sm text-zinc-500">
              Mostrando 60 de {museos.length} museos. Filtra por estado para ver más.
            </p>
          )}
        </section>

        {/* Internal links */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-zinc-900">
            {t.pages.museos.keepExploring}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/pueblos-magicos"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.common.pueblosMagicos}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">{t.pages.museos.traditionAndMagic}</p>
            </Link>
            <Link
              href="/zonas-arqueologicas"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.common.archaeologicalZones}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">{t.pages.museos.prehispanicMexico}</p>
            </Link>
            <Link
              href="/guias"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">{t.common.guides}</h3>
              <p className="mt-1 text-sm text-zinc-500">{t.pages.museos.editorialGuides}</p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
