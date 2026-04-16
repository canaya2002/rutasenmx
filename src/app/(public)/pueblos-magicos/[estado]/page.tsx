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
  const states = getStatesWithCategory('pueblos-magicos');
  return states.map((s) => ({ estado: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { estado } = await params;
  const state = getStateBySlug(estado);
  if (!state) return {};

  return buildPageMetadata({
    title: `Pueblos Mágicos en ${state.name}`,
    description: `Descubre los Pueblos Mágicos de ${state.name}: guía completa con qué hacer, cómo llegar y mapa interactivo.`,
    path: `/pueblos-magicos/${state.slug}`,
    keywords: [
      `pueblos mágicos ${state.name}`,
      `pueblos mágicos en ${state.name}`,
      `turismo ${state.name}`,
    ],
  });
}

export default async function PueblosMagicosByEstadoPage({ params }: Props) {
  const { estado } = await params;
  const state = getStateBySlug(estado);
  if (!state) notFound();

  const pueblos = getPlacesByStateAndCategory(estado, 'pueblos-magicos');
  const breadcrumbs = buildBreadcrumbs([
    { label: 'Pueblos Mágicos', href: '/pueblos-magicos' },
    { label: state.name, href: `/pueblos-magicos/${state.slug}` },
  ]);

  const collectionSchema = buildCollectionPageSchema(
    `Pueblos Mágicos en ${state.name}`,
    `Descubre los Pueblos Mágicos de ${state.name}.`,
    pueblos.map((p) => ({
      name: p.name,
      url: `https://rutasenmx.com/lugares/${p.slug}`,
      image: p.image,
      description: p.description,
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

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Pueblos Mágicos en {state.name}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            {pueblos.length > 0
              ? `Explora los ${pueblos.length} Pueblo${pueblos.length === 1 ? '' : 's'} Mágico${pueblos.length === 1 ? '' : 's'} de ${state.name}. Cada uno ofrece experiencias únicas de cultura, naturaleza y tradición.`
              : `Actualmente no tenemos Pueblos Mágicos registrados en ${state.name}. Pronto agregaremos más destinos.`}
          </p>
        </header>

        {/* Grid */}
        {pueblos.length > 0 ? (
          <section aria-label={`Pueblos Mágicos en ${state.name}`}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pueblos.map((pueblo) => (
                <Link
                  key={pueblo.slug}
                  href={`/lugares/${pueblo.slug}`}
                  className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="aspect-[16/10] w-full bg-zinc-100">
                    <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                      {pueblo.name}
                    </div>
                  </div>
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-blue-600">
                      {pueblo.name}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{pueblo.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {pueblo.badges.slice(0, 3).map((badge) => (
                        <span
                          key={badge}
                          className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Back links */}
        <section className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/pueblos-magicos"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            &larr; Todos los Pueblos Mágicos
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
