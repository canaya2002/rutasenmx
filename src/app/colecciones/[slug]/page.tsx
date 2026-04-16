import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { mockCollections, getPlaceBySlug } from '@/lib/data/mock';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return mockCollections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = mockCollections.find((c) => c.slug === slug);
  if (!collection) return {};

  return {
    title: `${collection.name} | Rutas en MX`,
    description: collection.description,
    alternates: {
      canonical: `https://rutasenmx.com/colecciones/${collection.slug}`,
    },
    openGraph: {
      title: `${collection.name} | Rutas en MX`,
      description: collection.description,
      url: `https://rutasenmx.com/colecciones/${collection.slug}`,
      siteName: 'Rutas en MX',
      locale: 'es_MX',
      type: 'website',
    },
  };
}

export default async function ColeccionPage({ params }: Props) {
  const { slug } = await params;
  const collection = mockCollections.find((c) => c.slug === slug);
  if (!collection) notFound();

  const places = collection.placeSlugs
    .map((s) => getPlaceBySlug(s))
    .filter(Boolean);

  const breadcrumbs = [
    { label: 'Inicio', href: '/' },
    { label: 'Colecciones', href: '/colecciones' },
    { label: collection.name, href: `/colecciones/${collection.slug}` },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.name,
    description: collection.description,
    url: `https://rutasenmx.com/colecciones/${collection.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: places.length,
      itemListElement: places.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p!.name,
        url: `https://rutasenmx.com/lugares/${p!.slug}`,
      })),
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-900">
          {collection.name}
        </h1>
        <p className="mb-2 text-zinc-600">
          {collection.description}
        </p>
        <p className="mb-8 text-sm text-zinc-400">
          Curada por {collection.curatedBy}
        </p>

        {places.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {places.map((place) =>
              place ? (
                <Link
                  key={place.slug}
                  href={`/lugares/${place.slug}`}
                  className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex-1">
                    <h2 className="font-semibold text-zinc-900">
                      {place.name}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      {place.stateName}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-600">
                      {place.description}
                    </p>
                  </div>
                </Link>
              ) : null,
            )}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-zinc-200 p-12 text-center">
            <p className="text-zinc-500">
              Esta coleccion aun no tiene lugares asignados.
            </p>
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/colecciones"
            className="text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            Ver todas las colecciones
          </Link>
        </div>
      </main>
    </>
  );
}
