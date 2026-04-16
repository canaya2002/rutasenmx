import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { lugarBreadcrumbs } from '@/lib/seo/breadcrumbs';
import {
  buildBreadcrumbSchema,
  buildPlaceSchema,
  buildMuseumSchema,
} from '@/lib/seo/schema';
import {
  mockPlaces,
  getPlaceBySlug,
  getNearbyPlaces,
  getPlacesByStateAndCategory,
} from '@/lib/data/mock';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return mockPlaces.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const place = getPlaceBySlug(slug);
  if (!place) return {};

  return buildPageMetadata({
    title: `${place.name}, ${place.stateName}: qué hacer, cómo llegar y tips`,
    description: place.description,
    path: `/lugares/${place.slug}`,
    keywords: [
      place.name,
      `${place.name} ${place.stateName}`,
      `qué hacer en ${place.name}`,
      `cómo llegar a ${place.name}`,
      place.categoryName,
    ],
  });
}

export default async function LugarPage({ params }: Props) {
  const { slug } = await params;
  const place = getPlaceBySlug(slug);
  if (!place) notFound();

  const nearbyPlaces = getNearbyPlaces(slug, 4);
  const sameCategoryInState = getPlacesByStateAndCategory(
    place.stateSlug,
    place.category,
  ).filter((p) => p.slug !== slug);

  const breadcrumbs = lugarBreadcrumbs(
    place.name,
    place.slug,
    place.categoryName,
    place.category,
    place.stateName,
    place.stateSlug,
  );

  const placeSchema =
    place.category === 'museos'
      ? buildMuseumSchema({
          name: place.name,
          slug: place.slug,
          description: place.description,
          image: place.image,
          latitude: place.lat,
          longitude: place.lng,
          address: place.address,
          estado: place.stateName,
          openingHours: place.openingHours,
          telephone: place.telephone,
          priceRange: place.price,
        })
      : buildPlaceSchema({
          name: place.name,
          slug: place.slug,
          description: place.description,
          image: place.image,
          latitude: place.lat,
          longitude: place.lng,
          address: place.address,
          estado: place.stateName,
        });

  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  const categoryHref =
    place.category === 'pueblos-magicos'
      ? '/pueblos-magicos'
      : place.category === 'museos'
        ? '/museos'
        : '/zonas-arqueologicas';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }}
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
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Link
              href={categoryHref}
              className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
            >
              {place.categoryName}
            </Link>
            <Link
              href={`/estados/${place.stateSlug}`}
              className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
            >
              {place.stateName}
            </Link>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            {place.name}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            {place.description}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-12">
            {/* Map placeholder */}
            <section>
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50">
                <p className="text-sm text-zinc-400">
                  Mapa de {place.name} (próximamente)
                </p>
              </div>
            </section>

            {/* Long description */}
            <section>
              <h2 className="text-2xl font-bold text-zinc-900">
                Sobre {place.name}
              </h2>
              <p className="mt-4 leading-7 text-zinc-600">
                {place.longDescription}
              </p>
            </section>

            {/* Badges */}
            {place.badges.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-zinc-900">
                  Características
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {place.badges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Same category in state */}
            {sameCategoryInState.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-zinc-900">
                  Más {place.categoryName.toLowerCase()} en {place.stateName}
                </h2>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {sameCategoryInState.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/lugares/${p.slug}`}
                      className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600">
                        {p.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                        {p.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Nearby places */}
            {nearbyPlaces.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-zinc-900">
                  Lugares cercanos
                </h2>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {nearbyPlaces.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/lugares/${p.slug}`}
                      className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <span className="mb-1 inline-block rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                        {p.categoryName}
                      </span>
                      <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600">
                        {p.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                        {p.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Practical info */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900">
                Información práctica
              </h3>
              <dl className="mt-4 space-y-3 text-sm">
                {place.openingHours && (
                  <div>
                    <dt className="font-medium text-zinc-700">Horario</dt>
                    <dd className="text-zinc-500">{place.openingHours}</dd>
                  </div>
                )}
                {place.price && (
                  <div>
                    <dt className="font-medium text-zinc-700">Precio</dt>
                    <dd className="text-zinc-500">{place.price}</dd>
                  </div>
                )}
                {place.telephone && (
                  <div>
                    <dt className="font-medium text-zinc-700">Teléfono</dt>
                    <dd className="text-zinc-500">{place.telephone}</dd>
                  </div>
                )}
                {place.address && (
                  <div>
                    <dt className="font-medium text-zinc-700">Dirección</dt>
                    <dd className="text-zinc-500">{place.address}</dd>
                  </div>
                )}
                {place.website && (
                  <div>
                    <dt className="font-medium text-zinc-700">Sitio web</dt>
                    <dd>
                      <a
                        href={place.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Visitar sitio
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* State link */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900">
                Explora {place.stateName}
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Descubre más lugares, rutas y actividades en {place.stateName}.
              </p>
              <Link
                href={`/estados/${place.stateSlug}`}
                className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Ver {place.stateName}
              </Link>
            </div>

            {/* Category link */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900">
                {place.categoryName}
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Explora todos los {place.categoryName.toLowerCase()} de México.
              </p>
              <Link
                href={categoryHref}
                className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Ver todos &rarr;
              </Link>
            </div>

            {/* Plan trip */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900">
                Planea tu viaje
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Encuentra rutas que incluyen {place.name}.
              </p>
              <Link
                href="/rutas"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Ver rutas
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
