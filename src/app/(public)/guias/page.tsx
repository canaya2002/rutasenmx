import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema, buildCollectionPageSchema, buildItemListSchema } from '@/lib/seo/schema';
import { mockArticles } from '@/lib/data/mock';
import { getTranslations, getLocale } from '@/lib/i18n/server';

const PAGE_PATH = '/guias';
const PAGE_TITLE = 'Guías de viaje por México: consejos, tips y rutas';
const PAGE_DESCRIPTION =
  'Guías editoriales para viajar por México. Pueblos mágicos, zonas arqueológicas, road trips, gastronomía y consejos prácticos para tu próximo viaje.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    keywords: [
      'guías de viaje México',
      'consejos viaje México',
      'tips road trip México',
      'qué hacer en México',
      'turismo México',
    ],
  });
}

export default async function GuiasPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const breadcrumbs = buildBreadcrumbs([{ label: t.common.guides, href: PAGE_PATH }]);

  const collectionSchema = buildCollectionPageSchema(
    PAGE_TITLE,
    PAGE_DESCRIPTION,
    mockArticles.map((a) => ({
      name: a.title,
      url: `https://rutasenmx.com/guias/${a.slug}`,
      image: a.image,
      description: a.description,
    })),
  );

  const itemListSchema = buildItemListSchema(
    mockArticles.map((a) => ({
      name: a.title,
      url: `https://rutasenmx.com/guias/${a.slug}`,
      image: a.image,
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
            {t.pages.guias.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            {t.pages.guias.description}
          </p>
        </header>

        {/* Grid */}
        <section aria-label={t.pages.guias.listLabel}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mockArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/guias/${article.slug}`}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="aspect-[16/10] w-full bg-zinc-100">
                  <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                    {article.title}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-blue-600">
                    {article.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                    {article.description}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400">
                    <span>{article.author}</span>
                    <span>&middot;</span>
                    <time dateTime={article.datePublished}>
                      {new Date(article.datePublished).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                  {article.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {article.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                        >
                          {tag}
                        </span>
                      ))}
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
            {t.pages.guias.keepExploring}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/rutas"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">{t.common.routes}</h3>
              <p className="mt-1 text-sm text-zinc-500">{t.pages.guias.bestRoadRoutes}</p>
            </Link>
            <Link
              href="/pueblos-magicos"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.common.pueblosMagicos}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">{t.pages.guias.traditionAndMagic}</p>
            </Link>
            <Link
              href="/colecciones"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.common.collections}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">{t.pages.guias.curatedCollections}</p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
