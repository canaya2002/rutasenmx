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
import {
  RoutePreviewMap,
  type RoutePreviewStop,
} from '@/components/map/RoutePreviewMap';
import {
  ArrowUpRight,
  Banknote,
  Clock,
  Compass,
  Diamond,
  Mountain,
  Navigation2,
  PinIcon,
  Sparkles,
  Timer,
} from 'lucide-react';

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

const difficultyChipClass: Record<string, string> = {
  facil:
    'bg-emerald-50/90 text-emerald-700 ring-1 ring-inset ring-emerald-200/70',
  moderada:
    'bg-amber-50/90 text-amber-700 ring-1 ring-inset ring-amber-200/70',
  avanzada:
    'bg-rose-50/90 text-rose-700 ring-1 ring-inset ring-rose-200/70',
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
    mapComingSoon: isEn
      ? 'Route map (coming soon)'
      : 'Mapa de la ruta (próximamente)',
    itineraryStops: isEn ? 'Itinerary stops' : 'Itinerario',
    routeHighlights: isEn ? 'Route highlights' : 'Destacados de la ruta',
    routeData: isEn ? 'Route data' : 'Datos de la ruta',
    distance: isEn ? 'Distance' : 'Distancia',
    duration: isEn ? 'Duration' : 'Duración',
    drivingTime: isEn ? 'Driving time' : 'Tiempo al volante',
    stops: isEn ? 'Stops' : 'Paradas',
    difficulty: isEn ? 'Difficulty' : 'Dificultad',
    estimatedCost: isEn ? 'Estimated cost' : 'Costo estimado',
    statesOnRoute: isEn ? 'States on this route' : 'Estados en esta ruta',
    moreRoutes: isEn ? 'More routes' : 'Más rutas',
    moreRoutesDesc: isEn
      ? 'Explore every road trip in Mexico.'
      : 'Explora todas las rutas por carretera en México.',
    viewAllRoutes: isEn ? 'View all routes' : 'Ver todas las rutas',
    travelGuides: isEn ? 'Travel guides' : 'Guías de viaje',
    travelGuidesDesc: isEn
      ? 'Practical tips for your road trip through Mexico.'
      : 'Consejos prácticos para tu road trip por México.',
    viewGuides: isEn ? 'View guides' : 'Ver guías',
    recommendedStay: isEn ? 'Recommended stay' : 'Estancia recomendada',
    days: isEn ? 'days' : 'días',
    hours: isEn ? 'hours' : 'horas',
    addToTrip: isEn ? 'Add to my trip' : 'Agregar a mi viaje',
    planTrip: isEn ? 'Plan this trip' : 'Planear este viaje',
    eyebrowDifficulty: isEn ? 'Difficulty' : 'Dificultad',
    eyebrowFeatured: isEn ? 'Featured route' : 'Ruta destacada',
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

  /* Sibling routes for the bottom CTA */
  const otherRoutes = allRoutes
    .filter((r) => r.slug !== route.slug)
    .filter((r) => r.statesSlugs.some((s) => route.statesSlugs.includes(s)))
    .slice(0, 3);

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

      {/* ============================================================== */}
      {/*  Cinematic dark hero with floating stats                        */}
      {/* ============================================================== */}
      <section className="relative isolate overflow-hidden bg-zinc-950 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-[-6rem] h-[28rem] w-[28rem] rounded-full bg-amber-400/15 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 bottom-[-8rem] h-[34rem] w-[34rem] rounded-full bg-emerald-500/10 blur-[140px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
          {/* breadcrumbs / back link */}
          <Link
            href="/rutas"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/80 transition hover:text-amber-200"
          >
            ← {t.common.routes}
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold backdrop-blur ${difficultyChipClass[route.difficulty]}`}
            >
              <Diamond className="h-3 w-3" />
              {difficultyLabel[route.difficulty]}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/85 backdrop-blur">
              <Compass className="h-3 w-3 text-amber-300" />
              {route.origin} → {route.destination}
            </span>
            {states.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/85 backdrop-blur">
                <Mountain className="h-3 w-3 text-amber-300" />
                {states.length}{' '}
                {states.length === 1
                  ? isEn
                    ? 'state'
                    : 'estado'
                  : isEn
                  ? 'states'
                  : 'estados'}
              </span>
            )}
          </div>

          <h1 className="mt-7 max-w-5xl text-balance text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            {route.name}
          </h1>

          <p className="mt-6 max-w-3xl text-pretty text-lg leading-8 text-white/70 sm:text-xl">
            {route.description}
          </p>

          {/* Stats row */}
          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-white/10 pt-10 sm:grid-cols-4">
            <HeroStat
              icon={<Navigation2 className="h-4 w-4" />}
              value={route.distanceKm.toLocaleString('es-MX')}
              suffix="km"
              label={labels.distance}
            />
            <HeroStat
              icon={<Timer className="h-4 w-4" />}
              value={route.durationDays.toString()}
              suffix={labels.days}
              label={labels.duration}
            />
            <HeroStat
              icon={<Clock className="h-4 w-4" />}
              value={`~${route.drivingHours}`}
              suffix={labels.hours}
              label={labels.drivingTime}
            />
            <HeroStat
              icon={<PinIcon className="h-4 w-4" />}
              value={route.stops.length.toString()}
              label={labels.stops}
            />
          </dl>
        </div>
      </section>

      {/* ============================================================== */}
      {/*  Body                                                           */}
      {/* ============================================================== */}
      <main className="bg-stone-50 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 pt-12 lg:grid-cols-[1fr_22rem] lg:gap-10 lg:pt-16">
            <div className="space-y-16">
              {/* ========================== Map ========================== */}
              <section>
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                      Map
                    </p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                      {route.origin} → {route.destination}
                    </h2>
                  </div>
                </div>
                {mapStops.length > 0 ? (
                  <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.25)]">
                    <RoutePreviewMap
                      stops={mapStops}
                      trace
                      title={`${route.origin} → ${route.destination}`}
                      height="h-[480px]"
                    />
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white">
                    <p className="text-sm text-zinc-400">{labels.mapComingSoon}</p>
                  </div>
                )}
              </section>

              {/* ========================== Itinerary ========================== */}
              <section>
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                      Day by day
                    </p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                      {labels.itineraryStops}
                    </h2>
                  </div>
                  <span className="hidden text-sm text-zinc-500 sm:inline">
                    {stopsWithPlace.length} {labels.stops.toLowerCase()}
                  </span>
                </div>

                <ol className="space-y-5">
                  {stopsWithPlace.map((stop, idx) => {
                    const isLast = idx === stopsWithPlace.length - 1;
                    const stopLat = stop.place?.lat ?? stop.lat;
                    const stopLng = stop.place?.lng ?? stop.lng;
                    const hasCoords =
                      Number.isFinite(stopLat) && Number.isFinite(stopLng);
                    const gmaps = hasCoords
                      ? `https://www.google.com/maps/search/?api=1&query=${(stopLat as number).toFixed(6)},${(stopLng as number).toFixed(6)}`
                      : null;
                    const waze = hasCoords
                      ? `https://waze.com/ul?ll=${(stopLat as number).toFixed(6)}%2C${(stopLng as number).toFixed(6)}&navigate=yes`
                      : null;

                    const stayLabel =
                      stop.stayMinutes >= 60
                        ? `${Math.floor(stop.stayMinutes / 60)} h${
                            stop.stayMinutes % 60 > 0
                              ? ` ${stop.stayMinutes % 60} min`
                              : ''
                          }`
                        : `${stop.stayMinutes} min`;

                    return (
                      <li key={stop.placeSlug} className="relative pl-14">
                        {/* Connector */}
                        {!isLast && (
                          <span
                            aria-hidden
                            className="absolute left-[1.125rem] top-12 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-amber-300/80 via-amber-200/40 to-transparent"
                          />
                        )}

                        {/* Number puck */}
                        <span
                          aria-hidden
                          className="absolute left-0 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-[13px] font-bold text-amber-300 shadow-[0_8px_24px_-8px_rgba(217,119,6,0.5)] ring-4 ring-amber-100/70"
                        >
                          {stop.order}
                        </span>

                        <article className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_18px_50px_-20px_rgba(217,119,6,0.3)] sm:p-6">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              {stop.place ? (
                                <Link
                                  href={`/lugares/${stop.placeSlug}`}
                                  className="text-balance text-xl font-bold text-zinc-900 transition hover:text-amber-800 sm:text-2xl"
                                >
                                  {stop.placeName}
                                </Link>
                              ) : (
                                <span className="text-balance text-xl font-bold text-zinc-900 sm:text-2xl">
                                  {stop.placeName}
                                </span>
                              )}
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                {stop.place?.stateName && (
                                  <span className="font-medium text-zinc-600">
                                    {stop.place.stateName}
                                  </span>
                                )}
                                <span aria-hidden className="text-zinc-300">
                                  ·
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {labels.recommendedStay}: {stayLabel}
                                </span>
                              </div>
                            </div>
                            {stop.place?.categoryName && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
                                {stop.place.categoryName}
                              </span>
                            )}
                          </div>

                          {stop.note && (
                            <p className="mt-4 border-l-2 border-amber-200 pl-4 text-sm leading-7 text-zinc-700">
                              {stop.note}
                            </p>
                          )}

                          {(gmaps || waze) && (
                            <div className="mt-5 flex flex-wrap gap-2">
                              {gmaps && (
                                <a
                                  href={gmaps}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950 px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-amber-700"
                                >
                                  Google Maps
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                </a>
                              )}
                              {waze && (
                                <a
                                  href={waze}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-zinc-800 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                                >
                                  Waze
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          )}
                        </article>
                      </li>
                    );
                  })}
                </ol>
              </section>

              {/* ========================== Highlights ========================== */}
              {route.highlights.length > 0 && (
                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                    Highlights
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                    {labels.routeHighlights}
                  </h2>
                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {route.highlights.map((hl) => (
                      <div
                        key={hl}
                        className="flex items-start gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.2)]"
                      >
                        <span
                          aria-hidden
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                        </span>
                        <p className="text-[15px] leading-6 text-zinc-700">
                          {hl}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* ========================== Sidebar ========================== */}
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {/* CTA card */}
              <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-950 p-6 text-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">
                  {labels.eyebrowFeatured}
                </p>
                <h3 className="mt-2 text-xl font-bold leading-tight">
                  {labels.planTrip}
                </h3>
                <p className="mt-2 text-sm text-white/65">
                  {isEn
                    ? 'Build your itinerary with stops, dates and budget.'
                    : 'Arma tu itinerario con paradas, fechas y presupuesto.'}
                </p>
                <Link
                  href={`/planear?ruta=${route.slug}`}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-zinc-950 transition hover:bg-amber-300"
                >
                  {labels.planTrip}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Route data */}
              <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.18)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                  {labels.routeData}
                </p>
                <dl className="mt-4 divide-y divide-zinc-100 text-sm">
                  <DataRow
                    icon={<Navigation2 className="h-3.5 w-3.5" />}
                    label={labels.distance}
                    value={`${route.distanceKm.toLocaleString('es-MX')} km`}
                  />
                  <DataRow
                    icon={<Timer className="h-3.5 w-3.5" />}
                    label={labels.duration}
                    value={`${route.durationDays} ${labels.days}`}
                  />
                  <DataRow
                    icon={<Clock className="h-3.5 w-3.5" />}
                    label={labels.drivingTime}
                    value={`~${route.drivingHours} ${labels.hours}`}
                  />
                  <DataRow
                    icon={<PinIcon className="h-3.5 w-3.5" />}
                    label={labels.stops}
                    value={route.stops.length.toString()}
                  />
                  <DataRow
                    icon={<Diamond className="h-3.5 w-3.5" />}
                    label={labels.difficulty}
                    value={difficultyLabel[route.difficulty]}
                  />
                  <DataRow
                    icon={<Banknote className="h-3.5 w-3.5" />}
                    label={labels.estimatedCost}
                    value={costFormatted}
                  />
                </dl>
              </div>

              {/* States */}
              {states.length > 0 && (
                <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.18)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                    {labels.statesOnRoute}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {states.map((state) =>
                      state ? (
                        <Link
                          key={state.slug}
                          href={`/estados/${state.slug}`}
                          className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-800 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                        >
                          {state.name}
                        </Link>
                      ) : null,
                    )}
                  </div>
                </div>
              )}

              {/* All routes link */}
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.18)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                  {labels.moreRoutes}
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  {labels.moreRoutesDesc}
                </p>
                <Link
                  href="/rutas"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-zinc-900 underline-offset-4 hover:text-amber-800 hover:underline"
                >
                  {labels.viewAllRoutes}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Guides */}
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.18)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                  {labels.travelGuides}
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  {labels.travelGuidesDesc}
                </p>
                <Link
                  href="/guias"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-zinc-900 underline-offset-4 hover:text-amber-800 hover:underline"
                >
                  {labels.viewGuides}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>

          {/* ========================== Other routes ========================== */}
          {otherRoutes.length > 0 && (
            <section className="mt-20 border-t border-zinc-200/80 pt-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                Cerca
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                {isEn ? 'Other routes nearby' : 'Otras rutas en la zona'}
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {otherRoutes.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/rutas/${r.slug}`}
                    className="group rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_16px_40px_-18px_rgba(217,119,6,0.3)]"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                      {r.origin} → {r.destination}
                    </p>
                    <h3 className="mt-2 text-balance text-lg font-bold leading-tight text-zinc-900 transition group-hover:text-amber-800">
                      {r.name}
                    </h3>
                    <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-700">
                        {r.durationDays} {t.pages.rutas.days}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-700">
                        {r.distanceKm.toLocaleString('es-MX')} km
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

/* ---------------------------------------------------------------- */
/*  Sub components                                                   */
/* ---------------------------------------------------------------- */
function HeroStat({
  icon,
  value,
  suffix,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  suffix?: string;
  label: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-amber-300">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
          {label}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {value}
        </span>
        {suffix && (
          <span className="text-sm font-semibold text-white/60">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function DataRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-2 text-zinc-500">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          {icon}
        </span>
        <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
          {label}
        </span>
      </div>
      <span className="text-sm font-bold text-zinc-900">{value}</span>
    </div>
  );
}
