import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildItemListSchema,
  buildWebPageSchema,
  buildGraph,
} from '@/lib/seo/schema';
import { mockStates } from '@/lib/data/mock';
import { allGuides, getStateForGuide } from '@/lib/data/guides';
import { getTranslations } from '@/lib/i18n/server';
import { JsonLd } from '@/components/seo/JsonLd';
import GuiasClient from './guias-client';
import { pickGuiaImage } from '@/lib/data/guia-images';

const PAGE_PATH = '/guias';
const PAGE_TITLE = 'Guías de viaje por México: 200+ artículos por estado y tema';
const PAGE_DESCRIPTION =
  'Más de 200 guías editoriales para viajar por México: Pueblos Mágicos, zonas arqueológicas, road trips, gastronomía regional, cultura e itinerarios por estado. Busca por estado o tema y encuentra tu próximo viaje.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    keywords: [
      'guías de viaje México',
      'guías por estado México',
      'consejos viaje México',
      'tips road trip México',
      'qué hacer en México',
      'turismo México',
      'gastronomía mexicana',
      'pueblos mágicos guía',
      'zonas arqueológicas México',
      'itinerarios México',
      'cómo llegar México',
      'viajes en carretera México',
    ],
  });
}

export default async function GuiasPage() {
  const t = await getTranslations();
  const breadcrumbs = buildBreadcrumbs([{ label: t.common.guides, href: PAGE_PATH }]);

  const guidesWithState = allGuides.map((article) => {
    const state = getStateForGuide(article.slug);
    return {
      ...article,
      stateSlug: state?.slug ?? null,
      stateName: state?.name ?? null,
      cover: pickGuiaImage(article.slug),
    };
  });

  const collectionSchema = buildCollectionPageSchema(
    PAGE_TITLE,
    PAGE_DESCRIPTION,
    allGuides.map((a) => ({
      name: a.title,
      url: `https://rutasenmx.com/guias/${a.slug}`,
      image: a.image,
      description: a.description,
    })),
  );

  const itemListSchema = buildItemListSchema(
    allGuides.map((a) => ({
      name: a.title,
      url: `https://rutasenmx.com/guias/${a.slug}`,
      image: a.image,
    })),
  );

  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  // Merged graph for this page: WebPage + CollectionPage + ItemList + Breadcrumbs
  const graph = buildGraph([
    buildWebPageSchema(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, {
      lastReviewed: new Date().toISOString().split('T')[0],
    }),
    collectionSchema,
    itemListSchema,
    breadcrumbSchema,
  ]);

  return (
    <>
      <JsonLd data={graph} />
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

        {/* Hero */}
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            {t.pages.guias.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            {t.pages.guias.description}
          </p>
          <p className="mt-3 max-w-3xl text-sm text-zinc-500">
            {t.pages.guias.totalCount?.replace('{count}', String(allGuides.length)) ??
              `${allGuides.length} guías disponibles, organizadas por estado y tema. Usa el buscador o el filtro para encontrar la que necesitas.`}
          </p>
        </header>

        <GuiasClient guides={guidesWithState} states={mockStates} />

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
