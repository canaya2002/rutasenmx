import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  MapPin,
  Sparkles,
  Compass,
  AlertTriangle,
  Clock,
  Navigation,
  Thermometer,
  Utensils,
  BedDouble,
  ShieldCheck,
} from 'lucide-react';

import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import {
  buildBreadcrumbSchema,
  buildPlaceSchema,
  buildFAQSchema,
} from '@/lib/seo/schema';
import {
  getAllPueblos,
  getPuebloBySlug,
  getPueblosByEstadoSlug,
  EXPERIENCE_LABELS,
  EXPERIENCE_EMOJIS,
} from '@/lib/pueblos-magicos';
import { buildArticleSections } from '@/lib/pueblos-content';
import { PlaceMiniMap } from '@/components/map/PlaceMiniMap';
import { pickGuiaSet } from '@/lib/data/guia-images';

export function generateStaticParams() {
  return getAllPueblos().map((p) => ({ estado: p.estadoSlug, slug: p.slug }));
}

interface Props {
  params: Promise<{ estado: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { estado, slug } = await params;
  const pueblo = getPuebloBySlug(slug);
  if (!pueblo || pueblo.estadoSlug !== estado) return {};

  const imageSet = pickGuiaSet(pueblo.slug, 0);
  return buildPageMetadata({
    title: `${pueblo.name}, ${pueblo.estado}: guía completa del Pueblo Mágico`,
    description: pueblo.resumen,
    path: `/pueblos-magicos/${pueblo.estadoSlug}/${pueblo.slug}`,
    keywords: [
      pueblo.name.toLowerCase(),
      `${pueblo.name.toLowerCase()} pueblo mágico`,
      `qué hacer en ${pueblo.name.toLowerCase()}`,
      `guía ${pueblo.name.toLowerCase()}`,
      `${pueblo.name.toLowerCase()} ${pueblo.estado.toLowerCase()}`,
      ...pueblo.experiences,
    ],
    image: imageSet.hero ?? undefined,
  });
}

// Simple inline markdown: bold + paragraphs
function renderBody(body: string): string {
  return body
    .split('\n\n')
    .map((p) => {
      const html = p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return `<p>${html}</p>`;
    })
    .join('');
}

function sectionIcon(id: string) {
  switch (id) {
    case 'intro':
      return Sparkles;
    case 'atracciones':
      return Compass;
    case 'experiencias':
      return Sparkles;
    case 'cuando-visitar':
      return Thermometer;
    case 'como-llegar':
      return Navigation;
    case 'donde-dormir':
      return BedDouble;
    case 'gastronomia':
      return Utensils;
    case 'consejos':
      return ShieldCheck;
    case 'alrededores':
      return Compass;
    case 'verificar':
      return AlertTriangle;
    default:
      return Sparkles;
  }
}

export default async function PuebloDetailPage({ params }: Props) {
  const { estado, slug } = await params;
  const pueblo = getPuebloBySlug(slug);
  if (!pueblo || pueblo.estadoSlug !== estado) notFound();

  const neighbors = getPueblosByEstadoSlug(pueblo.estadoSlug)
    .filter((p) => p.slug !== pueblo.slug)
    .slice(0, 6);

  const { sections, faqs } = buildArticleSections(pueblo, neighbors);
  const imageSet = pickGuiaSet(pueblo.slug, 4);

  const breadcrumbs = buildBreadcrumbs([
    { label: 'Pueblos Mágicos', href: '/pueblos-magicos' },
    {
      label: pueblo.estado,
      href: `/pueblos-magicos/${pueblo.estadoSlug}`,
    },
    {
      label: pueblo.name,
      href: `/pueblos-magicos/${pueblo.estadoSlug}/${pueblo.slug}`,
    },
  ]);

  const placeSchema = buildPlaceSchema({
    name: pueblo.name,
    slug: pueblo.slug,
    description: pueblo.longDescription ?? pueblo.resumen,
    image: imageSet.hero ?? undefined,
    latitude: pueblo.lat,
    longitude: pueblo.lng,
    estado: pueblo.estado,
    municipio: pueblo.name,
    category: 'Pueblo Mágico',
    tags: pueblo.experiences,
  });

  const faqSchema = buildFAQSchema(faqs.map((f) => ({ question: f.q, answer: f.a })));
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main>
        {/* Hero con imagen de portada */}
        {imageSet.hero ? (
          <div className="relative h-[55vh] min-h-[380px] w-full overflow-hidden">
            <Image
              src={imageSet.hero}
              alt={`Vista de ${pueblo.name}, ${pueblo.estado}`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0">
              <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:px-8">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/95 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  ✨ Pueblo Mágico
                </div>
                <h1 className="mt-4 text-4xl font-bold tracking-tight text-white drop-shadow sm:text-5xl lg:text-6xl">
                  {pueblo.name}
                </h1>
                <p className="mt-2 text-lg text-white/90 drop-shadow">
                  {pueblo.estado} · {pueblo.macroregion}
                  {pueblo.yearDesignated &&
                    ` · Nombrado en ${pueblo.yearDesignated}`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-b border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-white">
            <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#06C167]/10 px-3 py-1 text-xs font-semibold text-[#06C167]">
                ✨ Pueblo Mágico
              </div>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
                {pueblo.name}
              </h1>
              <p className="mt-2 text-lg text-slate-500">
                {pueblo.estado} · {pueblo.macroregion}
              </p>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="mb-6 text-xs text-slate-500">
            <Link href="/" className="hover:text-[#06C167]">
              Inicio
            </Link>{' '}
            <span className="mx-1">/</span>
            <Link href="/pueblos-magicos" className="hover:text-[#06C167]">
              Pueblos Mágicos
            </Link>{' '}
            <span className="mx-1">/</span>
            <Link
              href={`/pueblos-magicos/${pueblo.estadoSlug}`}
              className="hover:text-[#06C167]"
            >
              {pueblo.estado}
            </Link>{' '}
            <span className="mx-1">/</span>
            <span className="text-slate-700">{pueblo.name}</span>
          </nav>

          {/* Resumen + experiencias */}
          <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-lg leading-8 text-slate-700">{pueblo.resumen}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {pueblo.experiences.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  <span>{EXPERIENCE_EMOJIS[tag]}</span>
                  {EXPERIENCE_LABELS[tag]}
                </span>
              ))}
            </div>
          </section>

          {/* Dato curioso destacado */}
          <section className="mb-10">
            <div className="rounded-3xl border-l-4 border-emerald-500 bg-gradient-to-br from-emerald-50 to-white p-6">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                <Sparkles className="h-4 w-4" />
                Dato curioso
              </div>
              <p className="mt-3 text-xl font-serif italic leading-8 text-slate-800">
                “{pueblo.datoCurioso}”
              </p>
            </div>
          </section>

          {/* Mapa + coords */}
          <section className="mb-10">
            {pueblo.coordPrecision === 'approximate' && (
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Ubicación aproximada. Para mejorar la precisión corre{' '}
                  <code className="rounded bg-amber-100 px-1 text-xs">
                    npx tsx scripts/geocode-pueblos-magicos.ts
                  </code>
                  .
                </span>
              </div>
            )}
            <PlaceMiniMap
              lat={pueblo.lat}
              lng={pueblo.lng}
              name={pueblo.name}
              className="h-80 w-full"
            />
            <p className="mt-2 text-xs text-slate-500">
              <MapPin className="mr-1 inline h-3 w-3 text-[#06C167]" />
              {pueblo.lat.toFixed(4)}, {pueblo.lng.toFixed(4)} (
              {pueblo.coordPrecision === 'exact' ? 'exacta' : 'aproximada'})
            </p>
          </section>

          {/* Tabla de contenidos */}
          <aside className="mb-10 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              En esta guía
            </p>
            <ul className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
              {sections.map((s) => {
                const Icon = sectionIcon(s.id);
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="inline-flex items-center gap-2 text-slate-700 hover:text-[#06C167]"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {s.heading}
                    </a>
                  </li>
                );
              })}
              <li>
                <a
                  href="#faq"
                  className="inline-flex items-center gap-2 text-slate-700 hover:text-[#06C167]"
                >
                  <Clock className="h-3.5 w-3.5" />
                  Preguntas frecuentes
                </a>
              </li>
            </ul>
          </aside>

          {/* Secciones del artículo */}
          <article className="space-y-12">
            {sections.map((s, i) => {
              const Icon = sectionIcon(s.id);
              const showImage = imageSet.gallery[i % imageSet.gallery.length];
              const wantImageHere = s.kind === 'prose' && showImage;
              return (
                <section id={s.id} key={s.id} className="scroll-mt-16">
                  <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-900">
                    <Icon className="h-5 w-5 text-[#06C167]" />
                    {s.heading}
                  </h2>

                  {wantImageHere && (
                    <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5">
                      <Image
                        src={showImage}
                        alt={`${pueblo.name}, ${pueblo.estado}`}
                        fill
                        sizes="(max-width: 1024px) 100vw, 880px"
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div
                    className="prose prose-slate mt-4 max-w-none prose-p:leading-8 prose-li:leading-7 prose-strong:text-slate-900"
                    dangerouslySetInnerHTML={{
                      __html: renderBody(s.body),
                    }}
                  />
                </section>
              );
            })}

            {/* Long description cuando el seed detallado la tiene */}
            {pueblo.longDescription && (
              <section className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6">
                <h2 className="text-xl font-bold text-zinc-900">
                  Retrato editorial de {pueblo.name}
                </h2>
                <p className="mt-3 leading-8 text-slate-700">
                  {pueblo.longDescription}
                </p>
              </section>
            )}

            {/* FAQ */}
            <section id="faq" className="scroll-mt-16">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-900">
                <Clock className="h-5 w-5 text-[#06C167]" />
                Preguntas frecuentes
              </h2>
              <div className="mt-5 space-y-3">
                {faqs.map((f, i) => (
                  <details
                    key={i}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-slate-900">
                      {f.q}
                      <span className="text-[#06C167] transition group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 leading-7 text-slate-700">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>

            {/* Pueblos cercanos */}
            {neighbors.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-zinc-900">
                  Otros Pueblos Mágicos de {pueblo.estado}
                </h2>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {neighbors.map((n) => (
                    <Link
                      key={n.id}
                      href={`/pueblos-magicos/${n.estadoSlug}/${n.slug}`}
                      className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                    >
                      <h3 className="text-base font-semibold text-slate-900 group-hover:text-[#06C167]">
                        {n.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                        {n.resumen}
                      </p>
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/pueblos-magicos/${pueblo.estadoSlug}`}
                  className="mt-6 inline-block text-sm font-medium text-[#06C167] hover:underline"
                >
                  Ver los {neighbors.length + 1} Pueblos Mágicos de{' '}
                  {pueblo.estado} →
                </Link>
              </section>
            )}

            {/* Origen de datos */}
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Origen de los datos</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>
                  <strong>Datos base (seed):</strong> resumen, dato curioso y
                  atracciones provienen de la curaduría oficial de 177 Pueblos
                  Mágicos.
                </li>
                <li>
                  <strong>Datos enriquecidos:</strong> coordenadas geocodeadas
                  con OpenStreetMap, secciones de clima, gastronomía y consejos
                  se generan a partir de la macrorregión y las experiencias
                  detectadas en el seed.
                </li>
                <li>
                  <strong>Por verificar:</strong> horarios, precios,
                  accesibilidad y estado operativo de cada atracción. Valida
                  antes de viajar.
                </li>
              </ul>
            </section>
          </article>
        </div>
      </main>
    </>
  );
}
