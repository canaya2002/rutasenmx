import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildItemListSchema,
} from '@/lib/seo/schema';
import { allRoutes } from '@/lib/data/routes';
import { getPlaceBySlug } from '@/lib/data/mock';
import { getTranslations } from '@/lib/i18n/server';
import { RouteStaticMapPreview, type RouteStaticStop } from '@/components/map/RouteStaticMapPreview';
import { MapPin, Navigation } from 'lucide-react';

const PAGE_PATH = '/rutas';
const PAGE_TITLE = 'Rutas por México: 100+ road trips con mapas, paradas y costos';
const PAGE_DESCRIPTION =
  'Más de 100 rutas por carretera en México con paradas recomendadas, distancias, tiempos de manejo, costos y consejos para cada tramo. Desde microescapadas desde CDMX hasta la Ruta Maya y Barrancas del Cobre.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: `${PAGE_TITLE} | Rutas en MX`,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    keywords: [
      'rutas por México',
      'road trip México',
      'carreteras México',
      'viaje por carretera México',
      'mejores rutas México',
      'ruta maya',
      'ruta del mezcal',
      'barrancas del cobre',
      'pueblos mágicos ruta',
      'itinerarios México',
      'escapadas desde CDMX',
      'road trips Baja California',
    ],
  });
}

const difficultyColor: Record<string, string> = {
  facil: 'bg-green-100 text-green-700',
  moderada: 'bg-yellow-100 text-yellow-700',
  avanzada: 'bg-red-100 text-red-700',
};

export default async function RutasPage() {
  const t = await getTranslations();
  const difficultyLabel: Record<string, string> = {
    facil: t.pages.rutas.difficultyEasy,
    moderada: t.pages.rutas.difficultyModerate,
    avanzada: t.pages.rutas.difficultyAdvanced,
  };
  const breadcrumbs = buildBreadcrumbs([{ label: t.common.routes, href: PAGE_PATH }]);

  const collectionSchema = buildCollectionPageSchema(
    PAGE_TITLE,
    PAGE_DESCRIPTION,
    allRoutes.map((r) => ({
      name: r.name,
      url: `https://rutasenmx.com/rutas/${r.slug}`,
      image: r.image,
      description: r.description,
    })),
  );

  const itemListSchema = buildItemListSchema(
    allRoutes.map((r) => ({
      name: r.name,
      url: `https://rutasenmx.com/rutas/${r.slug}`,
      image: r.image,
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

        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            {t.pages.rutas.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            {t.pages.rutas.description}
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            {allRoutes.length}{' '}
            {t.pages.rutas.totalRoutes ?? 'rutas disponibles en todo el territorio mexicano'}.
          </p>
        </header>

        <section aria-label={t.pages.rutas.listLabel}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {allRoutes.map((route) => {
              const mapStops: RouteStaticStop[] = route.stops
                .map((s) => {
                  const place = getPlaceBySlug(s.placeSlug);
                  // Prefer the place's real coords, then the stop's inline fallback.
                  const lat = place?.lat ?? s.lat;
                  const lng = place?.lng ?? s.lng;
                  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
                  return { lat: lat as number, lng: lng as number };
                })
                .filter((s): s is RouteStaticStop => s !== null);
              return (
                <Link
                  key={route.slug}
                  href={`/rutas/${route.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-xl"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-zinc-50">
                    <RouteStaticMapPreview
                      stops={mapStops}
                      alt={`Mapa de la ruta ${route.name}`}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-100" />
                    <span
                      className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm backdrop-blur-sm ${difficultyColor[route.difficulty]}`}
                    >
                      {difficultyLabel[route.difficulty]}
                    </span>
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
                      <Navigation className="h-3 w-3 text-[#06C167]" />
                      {route.distanceKm} km
                    </span>
                    {mapStops.length > 0 && (
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
                        <MapPin className="h-3 w-3 text-[#06C167]" />
                        {mapStops.length} {t.pages.rutas.stops}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-[#06C167]">
                      {route.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-[#06C167]/70">
                      {route.origin} &rarr; {route.destination}
                    </p>
                    <p className="mt-2 flex-1 line-clamp-2 text-sm text-zinc-500">
                      {route.description}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {route.durationDays} {t.pages.rutas.days}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-zinc-300" />
                      <span>~{route.drivingHours}h {t.pages.rutas.driving}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-bold text-zinc-900">
            {t.pages.rutas.keepExploring}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/pueblos-magicos"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.common.pueblosMagicos}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                {t.pages.rutas.traditionAndMagic}
              </p>
            </Link>
            <Link
              href="/zonas-arqueologicas"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.common.archaeologicalZones}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">{t.pages.rutas.prehispanicMexico}</p>
            </Link>
            <Link
              href="/guias"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">{t.common.guides}</h3>
              <p className="mt-1 text-sm text-zinc-500">{t.pages.rutas.editorialGuides}</p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
