import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Colecciones de destinos curados | Rutas en MX',
  description:
    'Explora colecciones curadas de destinos en Mexico: rutas tematicas, escapadas de fin de semana, pueblos magicos imperdibles y mas.',
  alternates: {
    canonical: 'https://rutasenmx.com/colecciones',
  },
  openGraph: {
    title: 'Colecciones de destinos curados | Rutas en MX',
    description:
      'Explora colecciones curadas de destinos en Mexico: rutas tematicas, escapadas de fin de semana, pueblos magicos imperdibles y mas.',
    url: 'https://rutasenmx.com/colecciones',
    siteName: 'Rutas en MX',
    locale: 'es_MX',
    type: 'website',
  },
};

const COLLECTIONS = [
  {
    slug: 'pueblos-magicos-imperdibles',
    title: 'Pueblos Magicos imperdibles',
    description: 'Los Pueblos Magicos que no te puedes perder en tu proximo viaje por carretera.',
    count: 15,
    category: 'Pueblos Magicos',
  },
  {
    slug: 'escapadas-fin-de-semana-cdmx',
    title: 'Escapadas de fin de semana desde CDMX',
    description: 'Destinos a menos de 4 horas de la Ciudad de Mexico para un fin de semana inolvidable.',
    count: 12,
    category: 'Escapadas',
  },
  {
    slug: 'zonas-arqueologicas-top',
    title: 'Zonas arqueologicas que tienes que conocer',
    description: 'Las zonas arqueologicas mas impresionantes de Mexico, desde piramides hasta ciudades perdidas.',
    count: 10,
    category: 'Cultura',
  },
  {
    slug: 'ruta-gastronomica-oaxaca',
    title: 'Ruta gastronomica por Oaxaca',
    description: 'Los mejores destinos para probar la gastronomia oaxaquena en un viaje por carretera.',
    count: 8,
    category: 'Gastronomia',
  },
  {
    slug: 'cenotes-yucatan',
    title: 'Los mejores cenotes de Yucatan',
    description: 'Una seleccion de cenotes abiertos, semiabiertos y de caverna en la peninsula de Yucatan.',
    count: 10,
    category: 'Naturaleza',
  },
  {
    slug: 'playas-pacifico',
    title: 'Playas del Pacifico mexicano',
    description: 'Desde Baja California hasta Oaxaca, las playas mas bonitas de la costa del Pacifico.',
    count: 12,
    category: 'Playas',
  },
];

export default function ColeccionesPage() {
  const breadcrumbs = [
    { label: 'Inicio', href: '/' },
    { label: 'Colecciones', href: '/colecciones' },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Colecciones de destinos curados',
    description: 'Colecciones curadas de destinos para road trips en Mexico.',
    url: 'https://rutasenmx.com/colecciones',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: COLLECTIONS.length,
      itemListElement: COLLECTIONS.map((col, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: col.title,
        url: `https://rutasenmx.com/colecciones/${col.slug}`,
      })),
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-900">
          Colecciones
        </h1>
        <p className="mb-8 max-w-2xl text-zinc-600">
          Descubre colecciones curadas de destinos para tu proximo viaje por Mexico.
          Cada coleccion agrupa los mejores lugares por tema, region o tipo de viajero.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((col) => (
            <Link
              key={col.slug}
              href={`/colecciones/${col.slug}`}
              className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="mb-3 inline-flex w-fit rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                {col.category}
              </span>
              <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-orange-600">
                {col.title}
              </h2>
              <p className="mt-2 flex-1 text-sm text-zinc-500">
                {col.description}
              </p>
              <span className="mt-4 text-xs font-medium text-zinc-400">
                {col.count} destinos
              </span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
