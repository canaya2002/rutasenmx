import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema, buildCollectionPageSchema, buildItemListSchema } from '@/lib/seo/schema';
import { getPlacesByCategory, getStatesWithCategory } from '@/lib/data/mock';
import { getTranslations } from '@/lib/i18n/server';

const PAGE_PATH = '/museos';
const PAGE_TITLE = 'Museos en México: directorio, mapa y horarios';
const PAGE_DESCRIPTION =
  'Directorio completo de museos en México. Encuentra horarios, precios, ubicación y cómo llegar a los mejores museos de cada estado.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    keywords: [
      'museos en México',
      'museos CDMX',
      'mejores museos México',
      'horarios museos',
      'museos gratuitos',
    ],
  });
}

export default async function MuseosPage() {
  const t = await getTranslations();
  const museos = getPlacesByCategory('museos');
  const statesWithMuseos = getStatesWithCategory('museos');
  const breadcrumbs = buildBreadcrumbs([{ label: t.common.museums, href: PAGE_PATH }]);

  const collectionSchema = buildCollectionPageSchema(
    PAGE_TITLE,
    PAGE_DESCRIPTION,
    museos.map((m) => ({
      name: m.name,
      url: `https://rutasenmx.com/lugares/${m.slug}`,
      image: m.image,
      description: m.description,
    })),
  );

  const itemListSchema = buildItemListSchema(
    museos.map((m) => ({
      name: m.name,
      url: `https://rutasenmx.com/lugares/${m.slug}`,
      image: m.image,
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
            {t.pages.museos.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            {t.pages.museos.description}
          </p>
        </header>

        {/* Filter by state */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-zinc-900">{t.pages.museos.filterByState}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {statesWithMuseos.map((state) => (
              <Link
                key={state.slug}
                href={`/museos/${state.slug}`}
                className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm text-zinc-700 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700-400"
              >
                {state.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Grid */}
        <section aria-label={t.pages.museos.listLabel}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {museos.map((museo) => (
              <Link
                key={museo.slug}
                href={`/lugares/${museo.slug}`}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="aspect-[16/10] w-full bg-zinc-100">
                  <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                    {museo.name}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-purple-600">
                    {museo.name}
                  </h3>
                  <p className="mt-0.5 text-sm font-medium text-zinc-400">{museo.stateName}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                    {museo.description}
                  </p>
                  {(museo.openingHours || museo.price) && (
                    <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400">
                      {museo.openingHours && <span>{museo.openingHours}</span>}
                      {museo.price && <span>{museo.price}</span>}
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
            {t.pages.museos.keepExploring}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/pueblos-magicos"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.common.pueblosMagicos}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">{t.pages.museos.traditionAndMagic}</p>
            </Link>
            <Link
              href="/zonas-arqueologicas"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.common.archaeologicalZones}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">{t.pages.museos.prehispanicMexico}</p>
            </Link>
            <Link
              href="/guias"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">{t.common.guides}</h3>
              <p className="mt-1 text-sm text-zinc-500">{t.pages.museos.editorialGuides}</p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
