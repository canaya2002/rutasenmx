import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema, buildCollectionPageSchema, buildItemListSchema } from '@/lib/seo/schema';
import { mockRoutes } from '@/lib/data/mock';
import { getTranslations } from '@/lib/i18n/server';

const PAGE_PATH = '/rutas';
const PAGE_TITLE = 'Rutas por México: road trips, mapas y paradas';
const PAGE_DESCRIPTION =
  'Descubre las mejores rutas por carretera en México. Road trips con mapas, paradas recomendadas, distancias, costos y consejos para cada ruta.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: 'Rutas por México: road trips, mapas y paradas | Rutas en MX',
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    keywords: [
      'rutas por México',
      'road trip México',
      'carreteras México',
      'viaje por carretera México',
      'mejores rutas México',
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
    mockRoutes.map((r) => ({
      name: r.name,
      url: `https://rutasenmx.com/rutas/${r.slug}`,
      image: r.image,
      description: r.description,
    })),
  );

  const itemListSchema = buildItemListSchema(
    mockRoutes.map((r) => ({
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

        {/* Hero */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            {t.pages.rutas.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            {t.pages.rutas.description}
          </p>
        </header>

        {/* Grid */}
        <section aria-label={t.pages.rutas.listLabel}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mockRoutes.map((route) => (
              <Link
                key={route.slug}
                href={`/rutas/${route.slug}`}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="aspect-[16/10] w-full bg-zinc-100">
                  <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                    {route.name}
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColor[route.difficulty]}`}
                    >
                      {difficultyLabel[route.difficulty]}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {route.durationDays} {t.pages.rutas.days}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-blue-600">
                    {route.name}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    {route.origin} &rarr; {route.destination}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                    {route.description}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400">
                    <span>{route.distanceKm} km</span>
                    <span>{route.stops.length} {t.pages.rutas.stops}</span>
                    <span>~{route.drivingHours}h {t.pages.rutas.driving}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Internal links */}
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
