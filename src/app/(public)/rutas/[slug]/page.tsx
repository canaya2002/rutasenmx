import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { rutaBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema, buildRouteSchema } from '@/lib/seo/schema';
import {
  mockRoutes,
  getRouteBySlug,
  getPlaceBySlug,
  getStateBySlug,
} from '@/lib/data/mock';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return mockRoutes.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const route = getRouteBySlug(slug);
  if (!route) return {};

  return buildPageMetadata({
    title: `${route.name}: mapa, paradas y guía de viaje`,
    description: route.description,
    path: `/rutas/${route.slug}`,
    keywords: [
      route.name,
      `ruta ${route.origin} a ${route.destination}`,
      'road trip México',
      `carretera ${route.origin} ${route.destination}`,
    ],
  });
}

const difficultyLabel: Record<string, string> = {
  facil: 'Fácil',
  moderada: 'Moderada',
  avanzada: 'Avanzada',
};

const difficultyColor: Record<string, string> = {
  facil: 'bg-green-100 text-green-700',
  moderada: 'bg-yellow-100 text-yellow-700',
  avanzada: 'bg-red-100 text-red-700',
};

export default async function RutaPage({ params }: Props) {
  const { slug } = await params;
  const route = getRouteBySlug(slug);
  if (!route) notFound();

  const breadcrumbs = rutaBreadcrumbs(route.name, route.slug);

  const stopsWithPlace = route.stops.map((stop) => ({
    ...stop,
    place: getPlaceBySlug(stop.placeSlug),
  }));

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
    stops: stopsWithPlace.map((stop) => ({
      name: stop.placeName,
      slug: stop.placeSlug,
      latitude: stop.place?.lat,
      longitude: stop.place?.lng,
    })),
  });

  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  const costFormatted = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(route.estimatedCostMXN / 100);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(routeSchema) }}
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
            {/* Map placeholder */}
            <section>
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50">
                <p className="text-sm text-zinc-400">
                  Mapa de la ruta (próximamente)
                </p>
              </div>
            </section>

            {/* Stops / Itinerary */}
            <section>
              <h2 className="text-2xl font-bold text-zinc-900">
                Paradas del itinerario
              </h2>
              <div className="mt-6 space-y-4">
                {stopsWithPlace.map((stop) => (
                  <div
                    key={stop.placeSlug}
                    className="relative rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                        {stop.order}
                      </div>
                      <div className="flex-1">
                        <Link
                          href={`/lugares/${stop.placeSlug}`}
                          className="text-lg font-semibold text-zinc-900 hover:text-blue-600"
                        >
                          {stop.placeName}
                        </Link>
                        <p className="mt-1 text-sm text-zinc-500">{stop.note}</p>
                        <p className="mt-1 text-xs text-zinc-400">
                          Estancia recomendada: {stop.stayMinutes >= 60
                            ? `${Math.floor(stop.stayMinutes / 60)}h${stop.stayMinutes % 60 > 0 ? ` ${stop.stayMinutes % 60}min` : ''}`
                            : `${stop.stayMinutes}min`}
                        </p>
                        {stop.place && (
                          <p className="mt-1 text-xs text-zinc-400">
                            {stop.place.stateName} &middot; {stop.place.categoryName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Highlights */}
            {route.highlights.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-zinc-900">
                  Destacados de la ruta
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
                Datos de la ruta
              </h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-zinc-700">Distancia</dt>
                  <dd className="text-zinc-500">{route.distanceKm} km</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-700">Duración</dt>
                  <dd className="text-zinc-500">{route.durationDays} días</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-700">Tiempo de manejo</dt>
                  <dd className="text-zinc-500">~{route.drivingHours} horas</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-700">Paradas</dt>
                  <dd className="text-zinc-500">{route.stops.length}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-700">Dificultad</dt>
                  <dd className="text-zinc-500">{difficultyLabel[route.difficulty]}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-700">Costo estimado</dt>
                  <dd className="text-zinc-500">{costFormatted}</dd>
                </div>
              </dl>
            </div>

            {/* States on route */}
            {states.length > 0 && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-zinc-900">
                  Estados en esta ruta
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
                Más rutas
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Descubre todas las rutas por carretera en México.
              </p>
              <Link
                href="/rutas"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Ver todas las rutas
              </Link>
            </div>

            {/* Guides */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900">
                Guías de viaje
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Consejos prácticos para tu road trip por México.
              </p>
              <Link
                href="/guias"
                className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Ver guías &rarr;
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
