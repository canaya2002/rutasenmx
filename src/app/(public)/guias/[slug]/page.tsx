import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildGraph,
} from '@/lib/seo/schema';
import { getPlaceBySlug, getRouteBySlug } from '@/lib/data/mock';
import { allGuides, getGuideBySlug, getStateForGuide } from '@/lib/data/guides';
import { getTranslations, getLocale } from '@/lib/i18n/server';
import { RoutePreviewMap, type RoutePreviewStop } from '@/components/map/RoutePreviewMap';
import Image from 'next/image';
import { pickGuiaSet } from '@/lib/data/guia-images';

/** Simple markdown-to-HTML para contenido en formato markdown */
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
  return allGuides.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getGuideBySlug(slug);
  if (!article) return {};

  return buildPageMetadata({
    title: `${article.title} | Rutas en MX`,
    description: article.description,
    path: `/guias/${article.slug}`,
    keywords: [
      ...article.tags,
      'guía de viaje México',
      'road trip México',
      'turismo México',
      'rutas por carretera',
    ],
    type: 'article',
    publishedTime: article.datePublished,
    modifiedTime: article.dateModified,
    image: article.image,
  });
}

export default async function GuiaPage({ params }: Props) {
  const { slug } = await params;
  const article = getGuideBySlug(slug);
  if (!article) notFound();

  const t = await getTranslations();
  const locale = await getLocale();
  const state = getStateForGuide(slug);

  const relatedPlaces = article.relatedPlaceSlugs
    .map((s) => getPlaceBySlug(s))
    .filter(Boolean);

  const relatedRoutes = article.relatedRouteSlugs
    .map((s) => getRouteBySlug(s))
    .filter(Boolean);

  const mapStops: RoutePreviewStop[] = relatedPlaces
    .filter((p): p is NonNullable<typeof p> => !!p && typeof p.lat === 'number' && typeof p.lng === 'number')
    .slice(0, 20)
    .map((p, i) => ({
      id: p.id ?? p.slug,
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      category: p.category,
      slug: p.slug,
      order: i + 1,
    }));

  // Guías relacionadas del mismo estado (hasta 4)
  const relatedGuides = state
    ? allGuides
        .filter((g) => g.slug !== slug)
        .filter((g) => {
          const gState = getStateForGuide(g.slug);
          return gState?.slug === state.slug;
        })
        .slice(0, 4)
    : [];

  const breadcrumbs = [
    { label: t.common.home, href: '/' },
    { label: t.common.guides, href: '/guias' },
    ...(state ? [{ label: state.name, href: `/estados/${state.slug}` }] : []),
    { label: article.title, href: `/guias/${article.slug}` },
  ];

  const isEn = locale === 'en';

  // Word count estimate for richer Article schema
  const wordCount = article.content
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

  const articleSection = state
    ? `Guías de ${state.name}`
    : article.tags.find((tag) =>
        ['pueblos mágicos', 'gastronomía', 'road trip', 'cultura'].some((s) =>
          tag.toLowerCase().includes(s),
        ),
      ) ?? 'Guías de viaje';

  const articleSchema = buildArticleSchema({
    title: article.title,
    slug: article.slug,
    description: article.description,
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    authorName: article.author,
    keywords: article.tags,
    wordCount,
    articleSection,
    about: state ? { name: state.name, region: state.name } : undefined,
  });

  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  const graph = buildGraph([articleSchema, breadcrumbSchema]);

  // Batch-pick a unique hero + 3 gallery images for this guide so the hero
  // never repeats inside the inline gallery. Always prefer the files in
  // public/guias/ (they exist) over `article.image` (which for auto-generated
  // guides points to state images that were never committed to public/).
  const imageSet = pickGuiaSet(article.slug, 3);
  const heroImage = imageSet.hero ?? (article.image && article.image.length > 0 ? article.image : null);
  const hasArticleOrHero = !!heroImage;

  const labels = {
    by: isEn ? 'By' : 'Por',
    published: isEn ? 'Published' : 'Publicado',
    updated: isEn ? 'Updated' : 'Actualizado',
    mentionedPlaces: isEn ? 'Mentioned places' : 'Lugares mencionados',
    relatedRoutes: isEn ? 'Related routes' : 'Rutas relacionadas',
    relatedGuides: isEn ? `More guides about ${state?.name ?? ''}` : `Más guías sobre ${state?.name ?? ''}`,
    seeAll: isEn ? 'See all guides' : 'Ver todas las guías',
  };

  return (
    <>
      <JsonLd data={graph} />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Breadcrumbs items={breadcrumbs} />

        {(() => {
          return heroImage ? (
            <div className="relative mb-8 aspect-[21/9] w-full overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/5">
              <Image
                src={heroImage}
                alt={article.title}
                fill
                sizes="(max-width: 1024px) 100vw, 880px"
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                {state && (
                  <Link
                    href={`/estados/${state.slug}`}
                    className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur-sm transition hover:bg-white"
                  >
                    {state.name}
                  </Link>
                )}
                <h1 className="mt-3 text-balance text-3xl font-bold leading-tight text-white drop-shadow-md sm:text-4xl lg:text-5xl">
                  {article.title}
                </h1>
              </div>
            </div>
          ) : null;
        })()}

        <article>
          <header className="mb-8">
            <div className="mb-3 flex flex-wrap gap-2">
              {state && !hasArticleOrHero && (
                <Link
                  href={`/estados/${state.slug}`}
                  className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 hover:bg-emerald-200"
                >
                  {state.name}
                </Link>
              )}
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
                >
                  {tag}
                </span>
              ))}
            </div>
            {!hasArticleOrHero && (
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                {article.title}
              </h1>
            )}
            <p className="mt-3 text-lg text-zinc-600">
              {article.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
              <span>{labels.by} {article.author}</span>
              <span>
                {labels.published}:{' '}
                {new Date(article.datePublished).toLocaleDateString(
                  isEn ? 'en-US' : 'es-MX',
                  { year: 'numeric', month: 'long', day: 'numeric' },
                )}
              </span>
              {article.dateModified !== article.datePublished && (
                <span>
                  {labels.updated}:{' '}
                  {new Date(article.dateModified).toLocaleDateString(
                    isEn ? 'en-US' : 'es-MX',
                    { year: 'numeric', month: 'long', day: 'numeric' },
                  )}
                </span>
              )}
            </div>
          </header>

          <div className="prose prose-zinc max-w-none">
            <div dangerouslySetInnerHTML={{ __html: renderContent(article.content) }} />
          </div>

          {/* Inline gallery — large hero + two equally-sized tiles below */}
          {imageSet.gallery.length >= 3 && (
            <figure className="not-prose mt-10 space-y-3">
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5">
                <Image
                  src={imageSet.gallery[0]}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 900px"
                  className="object-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {imageSet.gallery.slice(1, 3).map((src, i) => (
                  <div
                    key={src + i}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5"
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, 450px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </figure>
          )}
        </article>

        {/* Lugares mencionados + mapa */}
        {relatedPlaces.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-xl font-bold text-zinc-900">{labels.mentionedPlaces}</h2>
            {mapStops.length > 0 && (
              <div className="mb-6">
                <RoutePreviewMap
                  stops={mapStops}
                  trace={mapStops.length > 1}
                  title={article.title}
                  height="h-[360px]"
                />
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedPlaces.map((place) =>
                place ? (
                  <Link
                    key={place.slug}
                    href={`/lugares/${place.slug}`}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50"
                  >
                    <div>
                      <p className="font-medium text-zinc-900">{place.name}</p>
                      <p className="text-sm text-zinc-500">{place.stateName}</p>
                    </div>
                  </Link>
                ) : null,
              )}
            </div>
          </section>
        )}

        {/* Rutas relacionadas */}
        {relatedRoutes.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-xl font-bold text-zinc-900">{labels.relatedRoutes}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedRoutes.map((route) =>
                route ? (
                  <Link
                    key={route.slug}
                    href={`/rutas/${route.slug}`}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50"
                  >
                    <div>
                      <p className="font-medium text-zinc-900">{route.name}</p>
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

        {/* Guías relacionadas del mismo estado */}
        {relatedGuides.length > 0 && state && (
          <section className="mt-8">
            <h2 className="mb-4 text-xl font-bold text-zinc-900">{labels.relatedGuides}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedGuides.map((g) => (
                <Link
                  key={g.slug}
                  href={`/guias/${g.slug}`}
                  className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50"
                >
                  <div>
                    <p className="font-medium text-zinc-900">{g.title}</p>
                    <p className="line-clamp-2 text-sm text-zinc-500">{g.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 border-t border-zinc-200 pt-6">
          <Link
            href="/guias"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            ← {labels.seeAll}
          </Link>
        </div>
      </main>
    </>
  );
}
