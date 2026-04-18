import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/seo/schema';
import {
  getStateBySlug,
  getPlacesByStateAndCategory,
  getStatesWithCategory,
} from '@/lib/data/mock';

interface Props {
  params: Promise<{ estado: string }>;
}

export async function generateStaticParams() {
  const states = getStatesWithCategory('zonas-arqueologicas');
  return states.map((s) => ({ estado: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { estado } = await params;
  const state = getStateBySlug(estado);
  if (!state) return {};

  return buildPageMetadata({
    title: `Zonas arqueológicas en ${state.name}: directorio y mapa`,
    description: `Directorio completo de zonas arqueológicas en ${state.name}. Horarios, precios, ubicación y cómo llegar a cada sitio prehispánico.`,
    path: `/zonas-arqueologicas/${state.slug}`,
    keywords: [
      `zonas arqueológicas ${state.name}`,
      `ruinas ${state.name}`,
      `pirámides ${state.name}`,
    ],
  });
}

export default async function ZonasArqueologicasByEstadoPage({ params }: Props) {
  const { estado } = await params;
  const state = getStateBySlug(estado);
  if (!state) notFound();

  const zonas = getPlacesByStateAndCategory(estado, 'zonas-arqueologicas');
  const breadcrumbs = buildBreadcrumbs([
    { label: 'Zonas arqueológicas', href: '/zonas-arqueologicas' },
    { label: state.name, href: `/zonas-arqueologicas/${state.slug}` },
  ]);

  const collectionSchema = buildCollectionPageSchema(
    `Zonas arqueológicas en ${state.name}`,
    `Directorio de zonas arqueológicas en ${state.name}.`,
    zonas.map((z) => ({
      name: z.name,
      url: `https://rutasenmx.com/lugares/${z.slug}`,
      image: z.image,
      description: z.description,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Zonas arqueológicas en {state.name}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            {zonas.length > 0
              ? `Explora las ${zonas.length} zona${zonas.length === 1 ? '' : 's'} arqueológica${zonas.length === 1 ? '' : 's'} registrada${zonas.length === 1 ? '' : 's'} en ${state.name}, con horarios, precios y ubicación.`
              : `Actualmente no tenemos zonas arqueológicas registradas en ${state.name}. Pronto agregaremos más destinos.`}
          </p>
        </header>

        {/* Grid */}
        {zonas.length > 0 && (
          <section aria-label={`Zonas arqueológicas en ${state.name}`}>
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
                    <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-amber-600">
                      {zona.name}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{zona.description}</p>
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
        )}

        {/* Back links */}
        <section className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/zonas-arqueologicas"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            &larr; Todas las zonas arqueológicas
          </Link>
          <Link
            href={`/estados/${state.slug}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Ver todo en {state.name}
          </Link>
        </section>
      </main>
    </>
  );
}
