import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildItemListSchema,
} from '@/lib/seo/schema';
import { getTranslations } from '@/lib/i18n/server';
import {
  getAllPueblos,
  getMacroregions,
  getEstadosWithPueblos,
  getExperienceCounts,
} from '@/lib/pueblos-magicos';
import { PueblosExplorer } from '@/components/pueblos/PueblosExplorer';

const PAGE_PATH = '/pueblos-magicos';
const PAGE_TITLE = 'Los 177 Pueblos Mágicos de México: mapa, guía y fichas';
const PAGE_DESCRIPTION =
  'Explora los 177 Pueblos Mágicos de México con mapa interactivo, ficha completa, dato curioso, atracciones ancla y filtros por macrorregión, estado y tipo de experiencia.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    keywords: [
      'pueblos mágicos',
      'pueblos mágicos de México',
      '177 pueblos mágicos',
      'lista pueblos mágicos',
      'mapa pueblos mágicos',
      'pueblos mágicos por estado',
    ],
  });
}

export default async function PueblosMagicosPage() {
  const t = await getTranslations();

  const pueblos = getAllPueblos();
  const macroregions = getMacroregions();
  const estados = getEstadosWithPueblos();
  const experienceCounts = getExperienceCounts();

  const breadcrumbs = buildBreadcrumbs([
    { label: t.common.pueblosMagicos, href: PAGE_PATH },
  ]);

  const collectionSchema = buildCollectionPageSchema(
    PAGE_TITLE,
    PAGE_DESCRIPTION,
    pueblos.map((p) => ({
      name: p.name,
      url: `https://rutasenmx.com/pueblos-magicos/${p.slug}`,
      description: p.resumen,
    })),
  );

  const itemListSchema = buildItemListSchema(
    pueblos.map((p) => ({
      name: p.name,
      url: `https://rutasenmx.com/pueblos-magicos/${p.slug}`,
    })),
  );

  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  const exactCount = pueblos.filter((p) => p.coordPrecision === 'exact').length;

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
        <header className="mb-10">
          <nav className="text-xs text-slate-500">
            <Link href="/" className="hover:text-[#06C167]">
              Inicio
            </Link>{' '}
            <span className="mx-1">/</span>
            <span className="text-slate-700">Pueblos Mágicos</span>
          </nav>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Los 177 Pueblos Mágicos de México
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            Mapa interactivo, ficha narrativa, dato curioso y tres atracciones
            ancla por cada Pueblo Mágico. Filtra por macrorregión, estado o tipo
            de experiencia para planear tu próxima ruta.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Pueblos Mágicos" value={pueblos.length.toString()} />
            <Stat
              label="Estados con PM"
              value={`${estados.length} de 32`}
              hint="CDMX no tiene Pueblos Mágicos"
            />
            <Stat label="Macrorregiones" value={macroregions.length.toString()} />
            <Stat
              label="Con coord. exacta"
              value={`${exactCount} / ${pueblos.length}`}
            />
          </div>
        </header>

        <PueblosExplorer
          pueblos={pueblos}
          macroregions={macroregions}
          estados={estados}
          experienceCounts={experienceCounts}
        />

        {/* Internal links */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold text-zinc-900">
            {t.pages.pueblosMagicos.keepExploring}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/museos"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.common.museums}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                {t.pages.pueblosMagicos.discoverBestMuseums}
              </p>
            </Link>
            <Link
              href="/zonas-arqueologicas"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.common.archaeologicalZones}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                {t.pages.pueblosMagicos.prehispanicLegacy}
              </p>
            </Link>
            <Link
              href="/rutas"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.common.routes}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                {t.pages.pueblosMagicos.bestRoadRoutes}
              </p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </div>
      {hint && <div className="mt-1 text-[10px] text-slate-400">{hint}</div>}
    </div>
  );
}
