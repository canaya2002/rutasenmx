import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema, buildCollectionPageSchema, buildItemListSchema } from '@/lib/seo/schema';
import { getPlacesByCategory, getStatesWithCategory } from '@/lib/data/mock';
import { getTranslations } from '@/lib/i18n/server';

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
            {t.pages.zonasArqueologicas.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            {t.pages.zonasArqueologicas.description}
          </p>
        </header>

        {/* Map placeholder */}
        <section className="mb-12">
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50">
            <p className="text-sm text-zinc-400">{t.pages.zonasArqueologicas.mapPlaceholder}</p>
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
                className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm text-zinc-700 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700-400"
              >
                {state.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Grid */}
        <section aria-label={t.pages.zonasArqueologicas.listLabel}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {zonas.map((zona) => (
              <Link
                key={zona.slug}
                href={`/lugares/${zona.slug}`}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="aspect-[16/10] w-full bg-zinc-100">
                  <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                    {zona.name}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-amber-600">
                    {zona.name}
                  </h3>
                  <p className="mt-0.5 text-sm font-medium text-zinc-400">{zona.stateName}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                    {zona.description}
                  </p>
                  {(zona.openingHours || zona.price) && (
                    <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400">
                      {zona.openingHours && <span>{zona.openingHours}</span>}
                      {zona.price && <span>{zona.price}</span>}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
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
