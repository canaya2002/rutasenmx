import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema, buildCollectionPageSchema, buildItemListSchema } from '@/lib/seo/schema';
import { getPlacesByCategory, getStatesWithCategory } from '@/lib/data/mock';
import { getTranslations } from '@/lib/i18n/server';

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
            {t.pages.pueblosMagicos.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            {t.pages.pueblosMagicos.description}
          </p>
        </header>

        {/* Map placeholder */}
        <section className="mb-12">
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50">
            <p className="text-sm text-zinc-400">{t.pages.pueblosMagicos.mapPlaceholder}</p>
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
            {pueblos.map((pueblo) => (
              <Link
                key={pueblo.slug}
                href={`/lugares/${pueblo.slug}`}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="aspect-[16/10] w-full bg-zinc-100">
                  <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                    {pueblo.name}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-blue-600">
                    {pueblo.name}
                  </h3>
                  <p className="mt-0.5 text-sm font-medium text-zinc-400">{pueblo.stateName}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                    {pueblo.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {pueblo.badges.slice(0, 3).map((badge) => (
                      <span
                        key={badge}
                        className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
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
