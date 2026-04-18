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
  const states = getStatesWithCategory('museos');
  return states.map((s) => ({ estado: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { estado } = await params;
  const state = getStateBySlug(estado);
  if (!state) return {};

  return buildPageMetadata({
    title: `Museos en ${state.name}: directorio y mapa`,
    description: `Directorio completo de museos en ${state.name}. Horarios, precios, ubicación y cómo llegar a cada museo.`,
    path: `/museos/${state.slug}`,
    keywords: [
      `museos ${state.name}`,
      `museos en ${state.name}`,
      `cultura ${state.name}`,
    ],
  });
}

export default async function MuseosByEstadoPage({ params }: Props) {
  const { estado } = await params;
  const state = getStateBySlug(estado);
  if (!state) notFound();

  const museos = getPlacesByStateAndCategory(estado, 'museos');
  const breadcrumbs = buildBreadcrumbs([
    { label: 'Museos', href: '/museos' },
    { label: state.name, href: `/museos/${state.slug}` },
  ]);

  const collectionSchema = buildCollectionPageSchema(
    `Museos en ${state.name}`,
    `Directorio de museos en ${state.name}.`,
    museos.map((m) => ({
      name: m.name,
      url: `https://rutasenmx.com/lugares/${m.slug}`,
      image: m.image,
      description: m.description,
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
            Museos en {state.name}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            {museos.length > 0
              ? `Explora los ${museos.length} museo${museos.length === 1 ? '' : 's'} registrado${museos.length === 1 ? '' : 's'} en ${state.name}, con horarios, precios y ubicación.`
              : `Actualmente no tenemos museos registrados en ${state.name}. Pronto agregaremos más destinos.`}
          </p>
        </header>

        {/* Grid */}
        {museos.length > 0 && (
          <section aria-label={`Museos en ${state.name}`}>
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
                    <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-purple-600">
                      {museo.name}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{museo.description}</p>
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
        )}

        {/* Back links */}
        <section className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/museos"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            &larr; Todos los museos
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
