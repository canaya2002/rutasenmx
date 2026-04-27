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
import {
  RouteStaticMapPreview,
  type RouteStaticStop,
} from '@/components/map/RouteStaticMapPreview';
import {
  ArrowUpRight,
  Compass,
  MapPin,
  Mountain,
  Route as RouteIcon,
  Sparkles,
  Timer,
} from 'lucide-react';

const PAGE_PATH = '/rutas';
const PAGE_TITLE =
  'Rutas por México: 100+ road trips con mapas, paradas y costos';
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

/* ---------------------------------------------------------------- */
/*  Premium difficulty palette — soft, editorial-grade               */
/* ---------------------------------------------------------------- */
const difficultyChipClass: Record<string, string> = {
  facil:
    'bg-emerald-50/90 text-emerald-700 ring-1 ring-inset ring-emerald-200/70',
  moderada:
    'bg-amber-50/90 text-amber-700 ring-1 ring-inset ring-amber-200/70',
  avanzada:
    'bg-rose-50/90 text-rose-700 ring-1 ring-inset ring-rose-200/70',
};

/* ---------------------------------------------------------------- */
/*  Page                                                             */
/* ---------------------------------------------------------------- */
export default async function RutasPage() {
  const t = await getTranslations();
  const difficultyLabel: Record<string, string> = {
    facil: t.pages.rutas.difficultyEasy,
    moderada: t.pages.rutas.difficultyModerate,
    avanzada: t.pages.rutas.difficultyAdvanced,
  };

  const breadcrumbs = buildBreadcrumbs([
    { label: t.common.routes, href: PAGE_PATH },
  ]);

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

  /* ---------- Aggregate stats for the hero band ------------------- */
  const totalKm = allRoutes.reduce((sum, r) => sum + (r.distanceKm || 0), 0);
  const stateSet = new Set<string>();
  for (const r of allRoutes) for (const s of r.statesSlugs) stateSet.add(s);
  const totalStates = stateSet.size;
  const totalStops = allRoutes.reduce(
    (sum, r) => sum + (r.stops?.length || 0),
    0,
  );

  /* ---------- Featured route (longest by distance, then most stops) ---- */
  const featured = [...allRoutes]
    .sort((a, b) => {
      const d = (b.distanceKm || 0) - (a.distanceKm || 0);
      if (d !== 0) return d;
      return (b.stops?.length || 0) - (a.stops?.length || 0);
    })[0];
  const remaining = allRoutes.filter((r) => r.slug !== featured?.slug);

  function buildMapStops(stops: typeof allRoutes[number]['stops']) {
    return stops
      .map((s) => {
        const place = getPlaceBySlug(s.placeSlug);
        const lat = place?.lat ?? s.lat;
        const lng = place?.lng ?? s.lng;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { lat: lat as number, lng: lng as number };
      })
      .filter((s): s is RouteStaticStop => s !== null);
  }

  const featuredStops = featured ? buildMapStops(featured.stops) : [];

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

      {/* ============================================================== */}
      {/*  Cinematic dark hero                                            */}
      {/* ============================================================== */}
      <section className="relative isolate overflow-hidden bg-zinc-950 text-white">
        {/* Decorative aurora */}
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
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_60%)]"
        />
        {/* Grid texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">
            <Sparkles className="h-3 w-3" />
            Curated road trips
          </span>

          <h1 className="mt-6 max-w-4xl text-balance text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            {t.pages.rutas.title}
            <span className="block bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 bg-clip-text text-transparent">
              por todo México.
            </span>
          </h1>

          <p className="mt-6 max-w-3xl text-pretty text-lg leading-8 text-white/70 sm:text-xl">
            {t.pages.rutas.description}
          </p>

          {/* Stats band */}
          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-white/10 pt-10 sm:grid-cols-4">
            <Stat
              icon={<RouteIcon className="h-4 w-4" />}
              value={allRoutes.length.toString()}
              label="Rutas curadas"
            />
            <Stat
              icon={<Compass className="h-4 w-4" />}
              value={`${totalStates}`}
              label="Estados conectados"
            />
            <Stat
              icon={<Mountain className="h-4 w-4" />}
              value={totalKm.toLocaleString('es-MX')}
              suffix="km"
              label="De carretera"
            />
            <Stat
              icon={<MapPin className="h-4 w-4" />}
              value={totalStops.toLocaleString('es-MX')}
              label="Paradas editoriales"
            />
          </dl>
        </div>
      </section>

      {/* ============================================================== */}
      {/*  Featured route — magazine-grade card                           */}
      {/* ============================================================== */}
      {featured && (
        <section className="bg-stone-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                  Destacada
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                  La más ambiciosa
                </h2>
              </div>
              <Link
                href={`/rutas/${featured.slug}`}
                className="hidden items-center gap-1 text-sm font-semibold text-zinc-900 underline-offset-4 hover:text-amber-700 hover:underline sm:inline-flex"
              >
                Ver completa
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <Link
              href={`/rutas/${featured.slug}`}
              className="group relative grid overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.25)] transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_32px_80px_-30px_rgba(217,119,6,0.35)] lg:grid-cols-[1.4fr_1fr]"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-stone-100 via-white to-amber-50/40 lg:aspect-auto">
                <RouteStaticMapPreview
                  stops={featuredStops}
                  alt={`Mapa ${featured.name}`}
                  lineColor="D97706"
                  startColor="0F172A"
                  endColor="D97706"
                  className="h-full w-full"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-zinc-950/35 via-transparent to-transparent" />
                <span
                  className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md ${difficultyChipClass[featured.difficulty]}`}
                >
                  {difficultyLabel[featured.difficulty]}
                </span>
              </div>

              <div className="flex flex-col justify-center p-8 lg:p-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                  {featured.origin} → {featured.destination}
                </p>
                <h3 className="mt-3 text-balance text-3xl font-bold leading-tight text-zinc-900 sm:text-4xl">
                  {featured.name}
                </h3>
                <p className="mt-4 text-base leading-7 text-zinc-600 line-clamp-3">
                  {featured.description}
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3 border-t border-zinc-100 pt-6 text-sm">
                  <FeaturedStat
                    label={t.pages.rutas.days}
                    value={featured.durationDays.toString()}
                  />
                  <FeaturedStat
                    label={t.pages.rutas.driving}
                    value={`${featured.drivingHours} h`}
                  />
                  <FeaturedStat
                    label="km"
                    value={featured.distanceKm.toLocaleString('es-MX')}
                  />
                </div>

                <span className="mt-8 inline-flex w-max items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-amber-700">
                  Recorrer la ruta
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/*  Main grid                                                      */}
      {/* ============================================================== */}
      <section
        aria-label={t.pages.rutas.listLabel}
        className="bg-white"
      >
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                Catálogo completo
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Todas las rutas
              </h2>
            </div>
            <p className="text-sm text-zinc-500">
              {allRoutes.length}{' '}
              {t.pages.rutas.totalRoutes ??
                'rutas disponibles en todo el territorio mexicano'}
              .
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {remaining.map((route) => {
              const mapStops = buildMapStops(route.stops);
              return (
                <Link
                  key={route.slug}
                  href={`/rutas/${route.slug}`}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.18)] transition hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_24px_60px_-24px_rgba(217,119,6,0.35)]"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-stone-100 via-white to-amber-50/40">
                    <RouteStaticMapPreview
                      stops={mapStops}
                      alt={`Mapa de la ruta ${route.name}`}
                      lineColor="D97706"
                      startColor="0F172A"
                      endColor="D97706"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/35 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
                    <span
                      className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md ${difficultyChipClass[route.difficulty]}`}
                    >
                      {difficultyLabel[route.difficulty]}
                    </span>
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-zinc-950/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                      <RouteIcon className="h-3 w-3 text-amber-300" />
                      {route.distanceKm.toLocaleString('es-MX')} km
                    </span>
                    {mapStops.length > 0 && (
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-zinc-800 ring-1 ring-zinc-200 backdrop-blur-md">
                        <MapPin className="h-3 w-3 text-amber-700" />
                        {mapStops.length} {t.pages.rutas.stops}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                      {route.origin} → {route.destination}
                    </p>
                    <h3 className="mt-2 text-balance text-lg font-bold leading-tight text-zinc-900 transition group-hover:text-amber-800">
                      {route.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-zinc-500">
                      {route.description}
                    </p>
                    <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-4 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-700">
                        <Timer className="h-3 w-3" />
                        {route.durationDays} {t.pages.rutas.days}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-700">
                        ~{route.drivingHours} h
                      </span>
                      <span className="ml-auto inline-flex items-center gap-1 text-amber-700 transition group-hover:gap-2">
                        Ver
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/*  Bottom band — keep exploring                                   */}
      {/* ============================================================== */}
      <section className="relative overflow-hidden bg-zinc-950 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">
            Sigue
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {t.pages.rutas.keepExploring}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ExploreCard
              href="/pueblos-magicos"
              eyebrow="177 destinos"
              title={t.common.pueblosMagicos}
              desc={t.pages.rutas.traditionAndMagic}
            />
            <ExploreCard
              href="/zonas-arqueologicas"
              eyebrow="196 sitios"
              title={t.common.archaeologicalZones}
              desc={t.pages.rutas.prehispanicMexico}
            />
            <ExploreCard
              href="/guias"
              eyebrow="Editorial"
              title={t.common.guides}
              desc={t.pages.rutas.editorialGuides}
            />
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------------------------------------------------------------- */
/*  Small subcomponents                                              */
/* ---------------------------------------------------------------- */
function Stat({
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
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {value}
        </span>
        {suffix && (
          <span className="text-base font-semibold text-white/60">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function FeaturedStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tracking-tight text-zinc-900">
        {value}
      </p>
    </div>
  );
}

function ExploreCard({
  href,
  eyebrow,
  title,
  desc,
}: {
  href: string;
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-6 transition hover:-translate-y-0.5 hover:border-amber-300/40 hover:bg-white/[0.07]"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-white/65">{desc}</p>
      <div className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-amber-200 transition group-hover:gap-2">
        Explorar
        <ArrowUpRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
