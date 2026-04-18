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

const PAGE_PATH = '/pueblos-magicos';
const PAGE_TITLE = 'Pueblos Mágicos de México: guía completa y mapa';
const PAGE_DESCRIPTION =
  'Guía completa de los Pueblos Mágicos de México. Encuentra los mejores pueblos mágicos por estado, con mapas, fotos, qué hacer y cómo llegar.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    keywords: [
      'pueblos mágicos',
      'pueblos mágicos de México',
      'lista pueblos mágicos',
      'mapa pueblos mágicos',
      'mejores pueblos mágicos',
    ],
  });
}

export default async function PueblosMagicosPage() {
  const t = await getTranslations();
  const pueblos = getPlacesByCategory('pueblos-magicos');
  const statesWithPueblos = getStatesWithCategory('pueblos-magicos');
  const breadcrumbs = buildBreadcrumbs([{ label: t.common.pueblosMagicos, href: PAGE_PATH }]);

  const collectionSchema = buildCollectionPageSchema(
    PAGE_TITLE,
    PAGE_DESCRIPTION,
    pueblos.map((p) => ({
      name: p.name,
      url: `https://rutasenmx.com/lugares/${p.slug}`,
      image: p.image,
      description: p.description,
    })),
  );

  const itemListSchema = buildItemListSchema(
    pueblos.map((p) => ({
      name: p.name,
      url: `https://rutasenmx.com/lugares/${p.slug}`,
      image: p.image,
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
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            {t.pages.pueblosMagicos.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            {t.pages.pueblosMagicos.description}
          </p>
        </header>

        {/* Density map — every Pueblo Mágico plotted */}
        <section className="mb-12">
          <div className="relative h-64 w-full overflow-hidden rounded-3xl border border-slate-200 shadow-md sm:h-80">
            <DensityStaticMap
              points={pueblos
                .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
                .map((p) => ({ lat: p.lat, lng: p.lng }))}
              alt="Mapa de Pueblos Mágicos de México"
              pinColor="06C167"
              maxPoints={60}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-md backdrop-blur-sm">
              <MapPin className="mr-1 inline h-3 w-3 text-[#06C167]" />
              {pueblos.length} Pueblos Mágicos en el mapa
            </div>
          </div>
        </section>

        {/* Filter by state */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-zinc-900">{t.pages.pueblosMagicos.filterByState}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {statesWithPueblos.map((state) => (
              <Link
                key={state.slug}
                href={`/pueblos-magicos/${state.slug}`}
                className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm text-zinc-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700-400"
              >
                {state.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Grid of pueblos */}
        <section aria-label={t.pages.pueblosMagicos.listLabel}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pueblos.map((pueblo) => {
              // Intentional product decision: every Pueblo Mágico card shows
              // the live map preview — never the stock image — so the grid is
              // visually consistent and each card communicates location.
              const hasCoords =
                Number.isFinite(pueblo.lat) && Number.isFinite(pueblo.lng);
              return (
                <Link
                  key={pueblo.slug}
                  href={`/lugares/${pueblo.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
                    {hasCoords ? (
                      <StaticMapPreview
                        lat={pueblo.lat}
                        lng={pueblo.lng}
                        alt={`Mapa de ${pueblo.name}`}
                        pinColor="06C167"
                        zoom={12}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                        {pueblo.name}
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#06C167]/95 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/icon/pueblomagicoicon.svg" alt="" className="h-3.5 w-3.5 brightness-0 invert" aria-hidden />
                      Pueblo Mágico
                    </span>
                    {hasCoords && (
                      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
                        <MapPin className="h-3 w-3 text-[#06C167]" />
                        {pueblo.lat.toFixed(3)}, {pueblo.lng.toFixed(3)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-[#06C167]">
                      {pueblo.name}
                    </h3>
                    <p className="mt-0.5 text-sm font-medium text-[#06C167]/70">{pueblo.stateName}</p>
                    <p className="mt-2 flex-1 line-clamp-2 text-sm text-zinc-500">
                      {pueblo.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {pueblo.badges.slice(0, 3).map((badge) => (
                        <span
                          key={badge}
                          className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Internal links */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-zinc-900">
            {t.pages.pueblosMagicos.keepExploring}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/museos"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">{t.common.museums}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {t.pages.pueblosMagicos.discoverBestMuseums}
              </p>
            </Link>
            <Link
              href="/zonas-arqueologicas"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.common.archaeologicalZones}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">{t.pages.pueblosMagicos.prehispanicLegacy}</p>
            </Link>
            <Link
              href="/rutas"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">{t.common.routes}</h3>
              <p className="mt-1 text-sm text-zinc-500">{t.pages.pueblosMagicos.bestRoadRoutes}</p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
