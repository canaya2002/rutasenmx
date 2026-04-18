import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  buildBreadcrumbSchema,
  buildOrganizationSchema,
  buildWebPageSchema,
  buildGraph,
} from '@/lib/seo/schema';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { getLocale, getTranslations } from '@/lib/i18n/server';
import { PageShell } from '@/components/layout/PageShell';
import { pickDecoration, pickDecorations } from '@/lib/data/general-images';
import { Target, Compass, Map, Users, Shield, Heart, Leaf, Award } from 'lucide-react';

const PAGE_PATH = '/acerca-de';
const PAGE_TITLE = 'Acerca de Rutas en MX';
const PAGE_DESCRIPTION =
  'La historia, el equipo, los valores y la misión detrás de Rutas en MX: la plataforma mexicana para planear viajes por carretera con datos oficiales y curaduría editorial.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    keywords: [
      'acerca de Rutas en MX',
      'sobre Rutas en MX',
      'road trip México',
      'planificador de rutas México',
      'equipo editorial viajes México',
      'turismo responsable',
    ],
  });
}

const VALUES = [
  {
    icon: Shield,
    title: 'Exactitud',
    desc: 'Combinamos APIs oficiales de SECTUR, INAH, SIC Cultura e INEGI con verificación editorial humana. Cada dato publicado cita fuente y fecha.',
  },
  {
    icon: Heart,
    title: 'Independencia',
    desc: 'Las recomendaciones no se compran ni se regalan. Los contenidos patrocinados se etiquetan de forma explícita y no afectan rankings.',
  },
  {
    icon: Leaf,
    title: 'Turismo responsable',
    desc: 'Promovemos destinos preparados para recibir visitantes, con respeto a las comunidades locales y al patrimonio natural y cultural.',
  },
  {
    icon: Award,
    title: 'Accesibilidad',
    desc: 'Diseñamos para que la información sea útil tanto para el viajero experimentado como para quien planea su primer road trip.',
  },
];

const PILLARS = [
  { icon: Map,     title: 'Rutas curadas',         desc: 'Más de 100 rutas con paradas verificadas, costos estimados de casetas y combustible, y dificultad por tramo.' },
  { icon: Compass, title: 'Catálogo nacional',     desc: 'Pueblos Mágicos, museos, zonas arqueológicas, cenotes, haciendas, playas y más en los 32 estados.' },
  { icon: Target,  title: 'Planificador con IA',   desc: 'Autopilot diseña itinerarios personalizados a partir de fechas, presupuesto, ritmo y estilo.' },
  { icon: Users,   title: 'Comunidad editorial',   desc: '200+ guías editoriales actualizables, escritas por periodistas y editores locales.' },
];

const TIMELINE = [
  { year: '2024', title: 'Primer prototipo', desc: 'Nace la idea tras un viaje por la Ruta del Mezcal: planear por carretera en México era más difícil de lo que debería.' },
  { year: '2025', title: 'Primera versión pública', desc: 'Lanzamos el catálogo de Pueblos Mágicos y rutas curadas, con mapa interactivo y datos oficiales.' },
  { year: '2026', title: 'Autopilot y colaboración', desc: 'Añadimos el planificador con IA, colecciones temáticas, exportación de itinerarios y modo offline premium.' },
];

export default async function AcercaDePage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const isEn = locale === 'en';

  const breadcrumbs = buildBreadcrumbs([{ label: t.common.about, href: PAGE_PATH }]);
  const graph = buildGraph([
    { ...buildWebPageSchema(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, { lastReviewed: new Date().toISOString().split('T')[0] }), '@type': 'AboutPage' },
    buildOrganizationSchema(),
    buildBreadcrumbSchema(breadcrumbs),
  ]);  const mosaic = pickDecorations('acerca-mosaic', 4);

  return (
    <>
      <JsonLd data={graph} />

      <PageShell
        title={isEn ? 'About Rutas en MX' : 'Acerca de Rutas en MX'}
        kicker={isEn ? 'About · Company' : 'Acerca · Empresa'}
        summary={
          isEn
            ? 'We are a Mexico-based editorial team building the cleanest, most trustworthy road-trip planner for the country — powered by open data and human curation.'
            : 'Somos un equipo editorial mexicano construyendo el planificador de viajes por carretera más limpio y confiable del país — con datos abiertos y curaduría humana.'
        }
        decorKey="acerca-de"
        current="acerca-de"
        stats={[
          { value: '32', label: isEn ? 'States covered' : 'Estados cubiertos' },
          { value: '2,000+', label: isEn ? 'Verified places' : 'Lugares verificados' },
          { value: '100+', label: isEn ? 'Curated routes' : 'Rutas curadas' },
          { value: '240+', label: isEn ? 'Editorial guides' : 'Guías editoriales' },
        ]}
      >
        {/* Mission */}
        <section className="mb-14 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            {isEn ? 'Mission' : 'Misión'}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {isEn
              ? 'Make road-tripping through Mexico effortless — and real.'
              : 'Hacer del viaje por carretera en México algo fácil y auténtico.'}
          </h2>
          <div className="mt-6 grid gap-6 leading-7 text-slate-600 sm:grid-cols-2">
            <p>
              {isEn
                ? 'From the Pacific coast to the Yucatán peninsula, Mexico offers some of the best driving in the world. We want every traveller — local or international — to plan, discover and enjoy it without friction.'
                : 'Desde las costas del Pacífico hasta la península de Yucatán, México ofrece algunas de las mejores carreteras del mundo. Queremos que cualquier viajero — local o internacional — pueda planearlo, descubrirlo y disfrutarlo sin fricción.'}
            </p>
            <p>
              {isEn
                ? 'We believe travel information should be as rigorous as the news. Our recommendations are backed by open government data, editorial fact-checking and feedback from the community.'
                : 'Creemos que la información de viajes debe ser tan rigurosa como la información periodística. Nuestras recomendaciones se basan en datos abiertos oficiales, verificación editorial y retroalimentación de la comunidad.'}
            </p>
          </div>
        </section>

        {/* Pillars */}
        <section className="mb-14">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            {isEn ? 'What we do' : 'Qué hacemos'}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {isEn ? 'Four pillars, one road' : 'Cuatro pilares, un mismo camino'}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PILLARS.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg"
              >
                <div className="absolute right-4 top-4 text-2xl font-black text-slate-100 group-hover:text-emerald-100">
                  0{i + 1}
                </div>
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-14 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            {isEn ? 'Our story' : 'Nuestra historia'}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {isEn ? 'How we got here' : 'Cómo llegamos aquí'}
          </h2>
          <ol className="relative mt-8 space-y-6 border-l border-slate-200 pl-6">
            {TIMELINE.map((item) => (
              <li key={item.year} className="relative">
                <span aria-hidden className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-white" />
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{item.year}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Values */}
        <section className="mb-14">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            {isEn ? 'Our values' : 'Nuestros valores'}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {isEn ? 'The rules we don’t bend' : 'Las reglas que no rompemos'}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mosaic */}
        {mosaic.length === 4 && (
          <section className="mb-14">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              {isEn ? 'In pictures' : 'En imágenes'}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {isEn ? 'The country we cover' : 'El país que cubrimos'}
            </h2>
            <div className="mt-6 grid grid-cols-6 gap-2 auto-rows-[140px] sm:auto-rows-[180px] sm:gap-3">
              {['col-span-4 row-span-2', 'col-span-2 row-span-2', 'col-span-3 row-span-2', 'col-span-3 row-span-2'].map(
                (cls, i) => (
                  <div
                    key={mosaic[i] + i}
                    className={`group relative overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5 ${cls}`}
                  >
                    <Image
                      src={mosaic[i]}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 66vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>
                ),
              )}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-8 text-white shadow-xl sm:p-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                {isEn ? 'Get in touch' : 'Ponte en contacto'}
              </p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                {isEn ? 'Questions, suggestions, pitches?' : '¿Dudas, sugerencias, pitch editorial?'}
              </h2>
              <p className="mt-2 max-w-xl text-slate-200">
                {isEn
                  ? 'We read every message. Tell us about the road, the place, the error, the idea.'
                  : 'Leemos cada mensaje. Cuéntanos del camino, del lugar, del error, de la idea.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contacto"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                {isEn ? 'Contact form' : 'Formulario'}
              </Link>
              <Link
                href="/metodologia"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {isEn ? 'Methodology' : 'Metodología'}
              </Link>
            </div>
          </div>
        </section>
      </PageShell>
    </>
  );
}
