import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';

import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
} from '@/lib/seo/schema';
import {
  getEstadosWithPueblos,
  getPueblosByEstadoSlug,
  EXPERIENCE_LABELS,
  EXPERIENCE_EMOJIS,
} from '@/lib/pueblos-magicos';

interface Props {
  params: Promise<{ estado: string }>;
}

export async function generateStaticParams() {
  return getEstadosWithPueblos().map((s) => ({ estado: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { estado } = await params;
  const match = getEstadosWithPueblos().find((s) => s.slug === estado);
  if (!match) return {};

  return buildPageMetadata({
    title: `Pueblos Mágicos en ${match.name}: los ${match.count} del estado`,
    description: `Guía de los ${match.count} Pueblos Mágicos de ${match.name}: resumen, dato curioso, atracciones ancla y mapa.`,
    path: `/pueblos-magicos/${match.slug}`,
    keywords: [
      `pueblos mágicos ${match.name}`,
      `pueblos mágicos en ${match.name}`,
      `turismo ${match.name}`,
    ],
  });
}

export default async function PueblosMagicosByEstadoPage({ params }: Props) {
  const { estado } = await params;
  const stateInfo = getEstadosWithPueblos().find((s) => s.slug === estado);
  if (!stateInfo) notFound();

  const pueblos = getPueblosByEstadoSlug(estado);
  const breadcrumbs = buildBreadcrumbs([
    { label: 'Pueblos Mágicos', href: '/pueblos-magicos' },
    {
      label: stateInfo.name,
      href: `/pueblos-magicos/${stateInfo.slug}`,
    },
  ]);

  const collectionSchema = buildCollectionPageSchema(
    `Pueblos Mágicos en ${stateInfo.name}`,
    `Los ${pueblos.length} Pueblos Mágicos de ${stateInfo.name}.`,
    pueblos.map((p) => ({
      name: p.name,
      url: `https://rutasenmx.com/pueblos-magicos/${p.estadoSlug}/${p.slug}`,
      description: p.resumen,
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

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <nav className="mb-6 text-xs text-slate-500">
          <Link href="/" className="hover:text-[#06C167]">
            Inicio
          </Link>{' '}
          <span className="mx-1">/</span>
          <Link href="/pueblos-magicos" className="hover:text-[#06C167]">
            Pueblos Mágicos
          </Link>{' '}
          <span className="mx-1">/</span>
          <span className="text-slate-700">{stateInfo.name}</span>
        </nav>

        <header className="mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#06C167]/10 px-3 py-1 text-xs font-semibold text-[#06C167]">
            ✨ {stateInfo.macroregion}
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Pueblos Mágicos en {stateInfo.name}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            {pueblos.length > 0
              ? `Los ${pueblos.length} Pueblos Mágicos de ${stateInfo.name}, con resumen, dato curioso y tres atracciones ancla por pueblo.`
              : `Actualmente no tenemos Pueblos Mágicos registrados en ${stateInfo.name}.`}
          </p>
        </header>

        {pueblos.length > 0 && (
          <section aria-label={`Pueblos Mágicos en ${stateInfo.name}`}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pueblos.map((p) => (
                <Link
                  key={p.id}
                  href={`/pueblos-magicos/${p.estadoSlug}/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-br from-emerald-50 via-white to-white p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#06C167]">
                        ✨ Pueblo Mágico
                      </div>
                      <h2 className="mt-1 text-lg font-bold text-slate-900 group-hover:text-[#06C167]">
                        {p.name}
                      </h2>
                    </div>
                    <span
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        p.coordPrecision === 'exact'
                          ? 'bg-[#06C167]/10 text-[#06C167]'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                      title={
                        p.coordPrecision === 'exact'
                          ? 'Ubicación exacta'
                          : 'Ubicación aproximada'
                      }
                    >
                      <MapPin className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="line-clamp-3 text-sm text-slate-600">
                      {p.resumen}
                    </p>
                    <p className="mt-3 line-clamp-2 text-xs italic text-slate-500">
                      💡 {p.datoCurioso}
                    </p>
                    <ul className="mt-3 space-y-1 text-xs text-slate-600">
                      {p.atracciones.slice(0, 3).map((atr, i) => (
                        <li key={i} className="flex gap-1.5">
                          <span className="text-[#06C167]">•</span>
                          <span className="line-clamp-1">{atr}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {p.experiences.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                        >
                          <span>{EXPERIENCE_EMOJIS[tag]}</span>
                          {EXPERIENCE_LABELS[tag]}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/pueblos-magicos"
            className="text-sm font-medium text-[#06C167] hover:underline"
          >
            &larr; Todos los Pueblos Mágicos
          </Link>
          <Link
            href={`/estados/${stateInfo.slug}`}
            className="text-sm font-medium text-[#06C167] hover:underline"
          >
            Ver todo en {stateInfo.name} &rarr;
          </Link>
        </section>
      </main>
    </>
  );
}
