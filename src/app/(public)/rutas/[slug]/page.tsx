import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { rutaBreadcrumbs } from '@/lib/seo/breadcrumbs';
import {
  buildBreadcrumbSchema,
  buildRouteSchema,
  buildGraph,
  buildWebPageSchema,
} from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { getPlaceBySlug, getStateBySlug } from '@/lib/data/mock';
import { allRoutes, getAnyRouteBySlug } from '@/lib/data/routes';
import { getTranslations, getLocale } from '@/lib/i18n/server';
import { RoutePreviewMap, type RoutePreviewStop } from '@/components/map/RoutePreviewMap';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return allRoutes.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const route = getAnyRouteBySlug(slug);
  if (!route) return {};

  return buildPageMetadata({
    title: `${route.name}: mapa, paradas y guía de viaje | Rutas en MX`,
    description: route.description,
    path: `/rutas/${route.slug}`,
    keywords: [
      route.name,
      `ruta ${route.origin} a ${route.destination}`,
      'road trip México',
      `carretera ${route.origin} ${route.destination}`,
      ...route.stops.map((s) => s.placeName),
      ...route.highlights.slice(0, 3),
    ],
  });
}

const difficultyColor: Record<string, string> = {
  facil: 'bg-green-100 text-green-700',
  moderada: 'bg-yellow-100 text-yellow-700',
  avanzada: 'bg-red-100 text-red-700',
};

export default async function RutaPage({ params }: Props) {
  const { slug } = await params;
  const route = getAnyRouteBySlug(slug);
  if (!route) notFound();

  const t = await getTranslations();
  const locale = await getLocale();
  const isEn = locale === 'en';

  const difficultyLabel: Record<string, string> = {
    facil: t.pages.rutas.difficultyEasy,
    moderada: t.pages.rutas.difficultyModerate,
    avanzada: t.pages.rutas.difficultyAdvanced,
  };

  const labels = {
    mapComingSoon: isEn ? 'Route map (coming soon)' : 'Mapa de la ruta (próximamente)',
    itineraryStops: isEn ? 'Itinerary stops' : 'Paradas del itinerario',
    routeHighlights: isEn ? 'Route highlights' : 'Destacados de la ruta',
    routeData: isEn ? 'Route data' : 'Datos de la ruta',
    distance: isEn ? 'Distance' : 'Distancia',
    duration: isEn ? 'Duration' : 'Duración',
    drivingTime: isEn ? 'Driving time' : 'Tiempo de manejo',
    stops: isEn ? 'Stops' : 'Paradas',
    difficulty: isEn ? 'Difficulty' : 'Dificultad',
    estimatedCost: isEn ? 'Estimated cost' : 'Costo estimado',
    statesOnRoute: isEn ? 'States on this route' : 'Estados en esta ruta',
    moreRoutes: isEn ? 'More routes' : 'Más rutas',
    moreRoutesDesc: isEn
      ? 'Discover all road trip routes in Mexico.'
      : 'Descubre todas las rutas por carretera en México.',
    viewAllRoutes: isEn ? 'View all routes' : 'Ver todas las rutas',
    travelGuides: isEn ? 'Travel guides' : 'Guías de viaje',
    travelGuidesDesc: isEn
      ? 'Practical tips for your road trip through Mexico.'
      : 'Consejos prácticos para tu road trip por México.',
    viewGuides: isEn ? 'View guides →' : 'Ver guías →',
    recommendedStay: isEn ? 'Recommended stay' : 'Estancia recomendada',
    days: isEn ? 'days' : 'días',
    hours: isEn ? 'hours' : 'horas',
  };

  const breadcrumbs = rutaBreadcrumbs(route.name, route.slug);

  const stopsWithPlace = route.stops.map((stop) => ({
    ...stop,
    place: getPlaceBySlug(stop.placeSlug),
  }));

  const mapStops: RoutePreviewStop[] = stopsWithPlace.flatMap((s, i) => {
    const lat = s.place?.lat ?? s.lat;
    const lng = s.place?.lng ?? s.lng;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    const stop: RoutePreviewStop = {
      id: s.placeSlug,
      name: s.placeName,
      lat: lat as number,
      lng: lng as number,
      category: s.place?.category,
      slug: s.place ? s.placeSlug : undefined,
      order: s.order ?? i + 1,
    };
    return [stop];
  });

  const states = route.statesSlugs
    .map((s) => getStateBySlug(s))
    .filter(Boolean);

  const routeSchema = buildRouteSchema({
    name: route.name,
    slug: route.slug,
    description: route.description,
    image: route.image,
    durationDays: route.durationDays,
    distanceKm: route.distanceKm,
    origin: route.origin,
    destination: route.destination,
    estimatedCostMXN: route.estimatedCostMXN,
    difficulty: route.difficulty,
    highlights: route.highlights,
    stops: stopsWithPlace.map((stop) => ({
      name: stop.placeName,
      slug: stop.placeSlug,
      latitude: stop.place?.lat,
      longitude: stop.place?.lng,
    })),
  });

  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  const costFormatted = new Intl.NumberFormat(isEn ? 'en-US' : 'es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(route.estimatedCostMXN / 100);

  const graph = buildGraph([
    buildWebPageSchema(route.name, route.description, `/rutas/${route.slug}`, {
      primaryImage: route.image,
      lastReviewed: new Date().toISOString().split('T')[0],
    }),
    routeSchema,
    breadcrumbSchema,
  ]);

  return (
    <>
      <JsonLd data={graph} />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="mb-12">
          <span
            className={`mb-3 inline-block rounded-full px-3 py-1 text-xs font-medium ${difficultyColor[route.difficulty]}`}
          >
            {difficultyLabel[route.difficulty]}
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            {route.name}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            {route.description}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {route.origin} &rarr; {route.destination}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-12">
            {/* Functional route map + Google Maps deep link */}
            <section>
              {mapStops.length > 0 ? (
                <RoutePreviewMap
                  stops={mapStops}
                  trace
                  title={`${route.origin} → ${route.destination}`}
                  height="h-[420px]"
                />
              ) : (
                <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50">
                  <p className="text-sm text-zinc-400">{labels.mapComingSoon}</p>
                </div>
              )}
            </section>

            {/* Stops / Itinerary */}
            <section>
              <h2 className="text-2xl font-bold text-zinc-900">
                {labels.itineraryStops}
              </h2>
              <ol className="mt-6 space-y-4">
                {stopsWithPlace.map((stop, idx) => {
                  const isLast = idx === stopsWithPlace.length - 1;
                  const stopLat = stop.place?.lat ?? stop.lat;
                  const stopLng = stop.place?.lng ?? stop.lng;
                  const hasCoords = Number.isFinite(stopLat) && Number.isFinite(stopLng);
                  const gmaps = hasCoords
                    ? `https://www.google.com/maps/search/?api=1&query=${(stopLat as number).toFixed(6)},${(stopLng as number).toFixed(6)}`
                    : null;
                  const waze = hasCoords
                    ? `https://waze.com/ul?ll=${(stopLat as number).toFixed(6)}%2C${(stopLng as number).toFixed(6)}&navigate=yes`
                    : null;
                  return (
                    <li key={stop.placeSlug} className="relative">
                      {!isLast && (
                        <span aria-hidden className="absolute left-[15px] top-10 h-[calc(100%-0.5rem)] w-px border-l-2 border-dashed border-emerald-200" />
                      )}
                      <div className="relative rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
                        <div className="flex items-start gap-4">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white shadow-sm ring-4 ring-emerald-50">
                            {stop.order}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              {stop.place ? (
                                <Link
                                  href={`/lugares/${stop.placeSlug}`}
                                  className="text-lg font-semibold text-zinc-900 hover:text-[#06C167]"
                                >
                                  {stop.placeName}
                                </Link>
                              ) : (
                                // No matching place in catalogue → plain text (avoids 404).
                                <span className="text-lg font-semibold text-zinc-900">{stop.placeName}</span>
                              )}
                              {stop.place && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                                  {stop.place.categoryName}
                                </span>
                              )}
                            </div>
                            {stop.note && <p className="mt-1.5 text-sm text-zinc-600">{stop.note}</p>}
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                              <span>
                                {labels.recommendedStay}:{' '}
                                {stop.stayMinutes >= 60
                                  ? `${Math.floor(stop.stayMinutes / 60)}h${stop.stayMinutes % 60 > 0 ? ` ${stop.stayMinutes % 60}min` : ''}`
                                  : `${stop.stayMinutes}min`}
                              </span>
                              {stop.place && <span aria-hidden>·</span>}
                              {stop.place && <span>{stop.place.stateName}</span>}
                            </div>
                            {(gmaps || waze) && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {gmaps && (
                                  <a
                                    href={gmaps}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-slate-700"
                                  >
                                    Google Maps →
                                  </a>
                                )}
                                {waze && (
                                  <a
                                    href={waze}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                                  >
                                    Waze →
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* Highlights */}
            {route.highlights.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-zinc-900">
                  {labels.routeHighlights}
                </h2>
                <ul className="mt-4 space-y-2">
                  {route.highlights.map((hl) => (
                    <li key={hl} className="flex items-start gap-2 text-zinc-600">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                      {hl}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Route stats */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900">
                {labels.routeData}
              </h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-zinc-700">{labels.distance}</dt>
                  <dd className="text-zinc-500">{route.distanceKm} km</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-700">{labels.duration}</dt>
                  <dd className="text-zinc-500">{route.durationDays} {labels.days}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-700">{labels.drivingTime}</dt>
                  <dd className="text-zinc-500">~{route.drivingHours} {labels.hours}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-700">{labels.stops}</dt>
                  <dd className="text-zinc-500">{route.stops.length}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-700">{labels.difficulty}</dt>
                  <dd className="text-zinc-500">{difficultyLabel[route.difficulty]}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-700">{labels.estimatedCost}</dt>
                  <dd className="text-zinc-500">{costFormatted}</dd>
                </div>
              </dl>
            </div>

            {/* States on route */}
            {states.length > 0 && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-zinc-900">
                  {labels.statesOnRoute}
                </h3>
                <ul className="mt-4 space-y-2">
                  {states.map((state) =>
                    state ? (
                      <li key={state.slug}>
                        <Link
                          href={`/estados/${state.slug}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {state.name}
                        </Link>
                      </li>
                    ) : null,
                  )}
                </ul>
              </div>
            )}

            {/* All routes */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900">
                {labels.moreRoutes}
              </h3>
              <p className="mt-2 text-sm text-zinc-500">{labels.moreRoutesDesc}</p>
              <Link
                href="/rutas"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {labels.viewAllRoutes}
              </Link>
            </div>

            {/* Guides */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900">
                {labels.travelGuides}
              </h3>
              <p className="mt-2 text-sm text-zinc-500">{labels.travelGuidesDesc}</p>
              <Link
                href="/guias"
                className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {labels.viewGuides}
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
