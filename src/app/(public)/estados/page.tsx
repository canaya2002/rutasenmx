import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema, buildCollectionPageSchema, buildItemListSchema } from '@/lib/seo/schema';
import { mockStates } from '@/lib/data/mock';
import { getStateHeroImage } from '@/lib/data/state-images';
import { getTranslations } from '@/lib/i18n/server';

const PAGE_PATH = '/estados';
const PAGE_TITLE = 'Estados de México: rutas, lugares y qué hacer';
const PAGE_DESCRIPTION =
  'Explora los 32 estados de México. Encuentra pueblos mágicos, museos, zonas arqueológicas, rutas por carretera y las mejores experiencias de cada estado.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    keywords: [
      'estados de México',
      'turismo por estado',
      'mapa de México',
      'destinos México',
      'pueblos mágicos por estado',
    ],
  });
}

export default async function EstadosPage() {
  const t = await getTranslations();
  const breadcrumbs = buildBreadcrumbs([{ label: t.common.states, href: PAGE_PATH }]);

  const collectionSchema = buildCollectionPageSchema(
    PAGE_TITLE,
    PAGE_DESCRIPTION,
    mockStates.map((state) => ({
      name: state.name,
      url: `https://rutasenmx.com/estados/${state.slug}`,
      image: state.image,
      description: state.description,
    })),
  );

  const itemListSchema = buildItemListSchema(
    mockStates.map((state) => ({
      name: state.name,
      url: `https://rutasenmx.com/estados/${state.slug}`,
      image: state.image,
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
            {t.pages.estados.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            {t.pages.estados.description}
          </p>
        </header>

        {/* State Grid — Airbnb-style destination cards */}
        <section aria-label={t.pages.estados.listLabel}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mockStates.map((state) => {
              const heroImage = getStateHeroImage(state.slug);
              return (
                <Link
                  key={state.slug}
                  href={`/estados/${state.slug}`}
                  className="group relative overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  {/* Card image */}
                  <div className="relative aspect-[4/5] w-full">
                    {heroImage ? (
                      <Image
                        src={heroImage}
                        alt={t.pages.estadoDetail.photoAlt.replace('{state}', state.name)}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-blue-400 via-teal-400 to-emerald-500" />
                    )}

                    {/* Bottom gradient overlay for text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Text overlay at bottom */}
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h2 className="text-xl font-bold text-white drop-shadow-sm">
                        {state.name}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-sm text-white/85">
                        {state.description}
                      </p>
                      <p className="mt-2 text-xs font-medium text-white/70">
                        {state.placeCount} {t.pages.estados.placesCount}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Internal links */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-zinc-900">
            {t.pages.estados.exploreByCategory}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/pueblos-magicos"
              className="rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.common.pueblosMagicos}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">{t.pages.estados.discoverMagic}</p>
            </Link>
            <Link
              href="/museos"
              className="rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">{t.common.museums}</h3>
              <p className="mt-1 text-sm text-zinc-500">{t.pages.estados.artHistoryCulture}</p>
            </Link>
            <Link
              href="/zonas-arqueologicas"
              className="rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.common.archaeologicalZones}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">{t.pages.estados.prehispanicMexico}</p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
