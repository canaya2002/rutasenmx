import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  mockArticles,
  getArticleBySlug,
  getPlaceBySlug,
  getRouteBySlug,
} from '@/lib/data/mock';

/** Simple markdown-to-HTML for article content */
function renderContent(content: string): string {
  if (content.startsWith('<')) return content; // already HTML
  return content
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => {
      const isOrdered = /^\d/.test(match);
      const tag = isOrdered ? 'ol' : 'ul';
      return `<${tag}>${match}</${tag}>`;
    })
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[holu])(.+)$/gm, (_, text) => text.trim() ? `<p>${text}</p>` : '')
    .replace(/<p><\/p>/g, '')
    .replace(/<\/p><p>/g, '</p>\n<p>');
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return mockArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  return buildPageMetadata({
    title: article.title,
    description: article.description,
    path: `/guias/${article.slug}`,
    keywords: article.tags,
  });
}

export default async function GuiaPage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const relatedPlaces = article.relatedPlaceSlugs
    .map((s) => getPlaceBySlug(s))
    .filter(Boolean);

  const relatedRoutes = article.relatedRouteSlugs
    .map((s) => getRouteBySlug(s))
    .filter(Boolean);

  const breadcrumbs = [
    { label: 'Inicio', href: '/' },
    { label: 'Guias', href: '/guias' },
    { label: article.title, href: `/guias/${article.slug}` },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    url: `https://rutasenmx.com/guias/${article.slug}`,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    author: {
      '@type': 'Organization',
      name: 'Rutas en MX',
      url: 'https://rutasenmx.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Rutas en MX',
      url: 'https://rutasenmx.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://rutasenmx.com/guias/${article.slug}`,
    },
    inLanguage: 'es-MX',
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Breadcrumbs items={breadcrumbs} />

        <article>
          <header className="mb-8">
            <div className="mb-3 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              {article.title}
            </h1>
            <p className="mt-3 text-lg text-zinc-600">
              {article.description}
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500">
              <span>Por {article.author}</span>
              <span>
                Publicado:{' '}
                {new Date(article.datePublished).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              {article.dateModified !== article.datePublished && (
                <span>
                  Actualizado:{' '}
                  {new Date(article.dateModified).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          </header>

          <div className="prose prose-zinc max-w-none">
            <div dangerouslySetInnerHTML={{ __html: renderContent(article.content) }} />
          </div>
        </article>

        {/* Related places */}
        {relatedPlaces.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-xl font-bold text-zinc-900">
              Lugares mencionados
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedPlaces.map((place) =>
                place ? (
                  <Link
                    key={place.slug}
                    href={`/lugares/${place.slug}`}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50"
                  >
                    <div>
                      <p className="font-medium text-zinc-900">
                        {place.name}
                      </p>
                      <p className="text-sm text-zinc-500">{place.stateName}</p>
                    </div>
                  </Link>
                ) : null,
              )}
            </div>
          </section>
        )}

        {/* Related routes */}
        {relatedRoutes.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-xl font-bold text-zinc-900">
              Rutas relacionadas
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedRoutes.map((route) =>
                route ? (
                  <Link
                    key={route.slug}
                    href={`/rutas/${route.slug}`}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50"
                  >
                    <div>
                      <p className="font-medium text-zinc-900">
                        {route.name}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {route.origin} → {route.destination}
                      </p>
                    </div>
                  </Link>
                ) : null,
              )}
            </div>
          </section>
        )}

        <div className="mt-8 border-t border-zinc-200 pt-6">
          <Link
            href="/guias"
            className="text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            Ver todas las guias
          </Link>
        </div>
      </main>
    </>
  );
}
