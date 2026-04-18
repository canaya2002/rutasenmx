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

const PAGE_PATH = '/zonas-arqueologicas';
const PAGE_TITLE = 'Zonas arqueológicas de México: guía completa';
const PAGE_DESCRIPTION =
  'Directorio completo de zonas arqueológicas en México. Encuentra horarios, precios, ubicación y cómo llegar a los sitios prehispánicos más importantes.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    keywords: [
      'zonas arqueológicas México',
      'pirámides México',
      'ruinas prehispánicas',
      'sitios arqueológicos',
      'mayas aztecas zapotecas',
    ],
  });
}

export default async function ZonasArqueologicasPage() {
  const t = await getTranslations();
  const zonas = getPlacesByCategory('zonas-arqueologicas');
  const statesWithZonas = getStatesWithCategory('zonas-arqueologicas');
  const breadcrumbs = buildBreadcrumbs([{ label: t.common.archaeologicalZones, href: PAGE_PATH }]);

  const collectionSchema = buildCollectionPageSchema(
    PAGE_TITLE,
    PAGE_DESCRIPTION,
    zonas.map((z) => ({
      name: z.name,
      url: `https://rutasenmx.com/lugares/${z.slug}`,
      image: z.image,
      description: z.description,
    })),
  );

  const itemListSchema = buildItemListSchema(
    zonas.map((z) => ({
      name: z.name,
      url: `https://rutasenmx.com/lugares/${z.slug}`,
      image: z.image,
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
            {t.pages.zonasArqueologicas.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            {t.pages.zonasArqueologicas.description}
          </p>
        </header>

        {/* Density map — every archaeological zone plotted */}
        <section className="mb-12">
          <div className="relative h-64 w-full overflow-hidden rounded-3xl border border-slate-200 shadow-md sm:h-80">
            <DensityStaticMap
              points={zonas
                .filter((z) => Number.isFinite(z.lat) && Number.isFinite(z.lng))
                .map((z) => ({ lat: z.lat, lng: z.lng }))}
              alt="Mapa de zonas arqueológicas de México"
              pinColor="D97706"
              maxPoints={70}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-md backdrop-blur-sm">
              <MapPin className="mr-1 inline h-3 w-3 text-amber-500" />
              {zonas.length} zonas arqueológicas en el mapa
            </div>
          </div>
        </section>

        {/* Filter by state */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-zinc-900">{t.pages.zonasArqueologicas.filterByState}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {statesWithZonas.map((state) => (
              <Link
                key={state.slug}
                href={`/zonas-arqueologicas/${state.slug}`}
                className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm text-zinc-700 transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
              >
                {state.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Grid with static map previews */}
        <section aria-label={t.pages.zonasArqueologicas.listLabel}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {zonas.slice(0, 60).map((zona) => {
              const hasCoords = Number.isFinite(zona.lat) && Number.isFinite(zona.lng);
              return (
                <Link
                  key={zona.slug}
                  href={`/lugares/${zona.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-lg"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
                    {hasCoords ? (
                      <StaticMapPreview
                        lat={zona.lat}
                        lng={zona.lng}
                        alt={`Mapa de ${zona.name}`}
                        pinColor="D97706"
                        zoom={13}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-zinc-400">
                        {zona.name}
                      </div>
                    )}
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500/95 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/icon/arqueologiaicon.svg" alt="" className="h-3.5 w-3.5 brightness-0 invert" aria-hidden />
                      Zona arqueológica
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-amber-700">
                      {zona.name}
                    </h3>
                    <p className="mt-0.5 text-sm font-medium text-amber-700/70">{zona.stateName}</p>
                    <p className="mt-2 flex-1 line-clamp-2 text-sm text-zinc-500">{zona.description}</p>
                    {(zona.openingHours || zona.price) && (
                      <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400">
                        {zona.openingHours && <span>{zona.openingHours}</span>}
                        {zona.price && <span>{zona.price}</span>}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          {zonas.length > 60 && (
            <p className="mt-6 text-center text-sm text-zinc-500">
              Mostrando 60 de {zonas.length} zonas arqueológicas. Filtra por estado para ver más.
            </p>
          )}
        </section>

        {/* Internal links */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-zinc-900">
            {t.pages.zonasArqueologicas.keepExploring}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/pueblos-magicos"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.common.pueblosMagicos}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">{t.pages.zonasArqueologicas.traditionAndMagic}</p>
            </Link>
            <Link
              href="/museos"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">{t.common.museums}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {t.pages.zonasArqueologicas.bestMuseums}
              </p>
            </Link>
            <Link
              href="/rutas"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">{t.common.routes}</h3>
              <p className="mt-1 text-sm text-zinc-500">{t.pages.zonasArqueologicas.bestRoadRoutes}</p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
