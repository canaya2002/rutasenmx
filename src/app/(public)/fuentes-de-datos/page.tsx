import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { getLocale } from '@/lib/i18n/server';
import { PageShell } from '@/components/layout/PageShell';
import { pickDecoration } from '@/lib/data/general-images';
import { Database, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

const PAGE_PATH = '/fuentes-de-datos';
const PAGE_TITLE = 'Fuentes de datos / Data sources';
const PAGE_DESCRIPTION =
  'Las APIs, datasets y fuentes oficiales que alimentan Rutas en MX: SECTUR, INAH, SIC Cultura, INEGI, CAPUFE, Mapbox. Con frecuencias de actualización, licencias y cobertura.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    keywords: [
      'fuentes de datos Rutas en MX',
      'datos abiertos turismo México',
      'SECTUR API',
      'SIC Cultura datos',
      'INAH datos abiertos',
      'INEGI API',
      'datos oficiales México',
    ],
  });
}

interface SourceEntry {
  key: string;
  name: string;
  short: string;
  category: 'official' | 'mapping' | 'partners';
  coverage: string;
  frequency: string;
  license: string;
  url: string;
  purpose: string;
}

const SOURCES: SourceEntry[] = [
  {
    key: 'sectur',
    name: 'SECTUR',
    short: 'Secretaría de Turismo',
    category: 'official',
    coverage: 'Pueblos Mágicos (177+), Atlas Turístico Nacional',
    frequency: 'Mensual',
    license: 'Datos abiertos / MX',
    url: 'https://www.gob.mx/sectur',
    purpose: 'Catálogo oficial de Pueblos Mágicos: nombre, estado, municipio, año de designación.',
  },
  {
    key: 'inah',
    name: 'INAH',
    short: 'Instituto Nacional de Antropología e Historia',
    category: 'official',
    coverage: '200+ zonas arqueológicas, museos INAH, monumentos históricos',
    frequency: 'Trimestral',
    license: 'Datos abiertos / INAH',
    url: 'https://www.inah.gob.mx',
    purpose: 'Zonas arqueológicas abiertas al público, horarios, tarifas y coordenadas verificadas.',
  },
  {
    key: 'sic',
    name: 'SIC Cultura',
    short: 'Sistema de Información Cultural',
    category: 'official',
    coverage: '1,700+ museos y 10,000+ recintos culturales',
    frequency: 'Mensual',
    license: 'Datos abiertos / SC',
    url: 'https://sic.cultura.gob.mx',
    purpose: 'Museos de arte, historia, ciencia y cultura popular con coordenadas, temáticas y contacto.',
  },
  {
    key: 'inegi',
    name: 'INEGI',
    short: 'Instituto Nacional de Estadística y Geografía',
    category: 'official',
    coverage: 'Marco geoestadístico nacional, ruteo y distancias',
    frequency: 'Semestral',
    license: 'Datos abiertos / INEGI',
    url: 'https://www.inegi.org.mx',
    purpose: 'Validación de coordenadas, nombres de localidades, ruteo de carreteras y cálculos de distancia.',
  },
  {
    key: 'capufe',
    name: 'CAPUFE',
    short: 'Caminos y Puentes Federales',
    category: 'official',
    coverage: 'Tarifas de casetas en la red federal',
    frequency: 'Cuando cambian',
    license: 'Datos abiertos / CAPUFE',
    url: 'https://www.capufe.gob.mx',
    purpose: 'Costos de peajes y estado operativo de casetas en autopistas federales.',
  },
  {
    key: 'datatur',
    name: 'DataTur / RNT',
    short: 'Registro Nacional de Turismo',
    category: 'official',
    coverage: 'Prestadores turísticos registrados',
    frequency: 'Trimestral',
    license: 'Datos abiertos / SECTUR',
    url: 'https://datatur.sectur.gob.mx',
    purpose: 'Validación de hoteles, tours, guías y agencias con registro oficial.',
  },
  {
    key: 'mapbox',
    name: 'Mapbox',
    short: 'Tiles y geocoding',
    category: 'mapping',
    coverage: 'Mapas interactivos globales',
    frequency: 'Tiempo real',
    license: 'Comercial con atribución',
    url: 'https://www.mapbox.com',
    purpose: 'Tiles base, clustering, geocodificación inversa y rutas visuales en el mapa.',
  },
  {
    key: 'openstreetmap',
    name: 'OpenStreetMap',
    short: 'Red vial y POIs',
    category: 'mapping',
    coverage: 'Cobertura global comunitaria',
    frequency: 'Continua',
    license: 'ODbL',
    url: 'https://www.openstreetmap.org',
    purpose: 'Datos de red vial, tipos de carretera y POIs complementarios a los oficiales.',
  },
  {
    key: 'booking',
    name: 'Booking.com',
    short: 'Hospedaje',
    category: 'partners',
    coverage: 'Hoteles y rentas',
    frequency: 'Tiempo real',
    license: 'Afiliados',
    url: 'https://www.booking.com',
    purpose: 'Disponibilidad y precios de hospedaje en destinos cubiertos (solo enlaces de afiliado).',
  },
];

const CATEGORY_LABEL: Record<SourceEntry['category'], { es: string; en: string }> = {
  official: { es: 'Datos oficiales', en: 'Official data' },
  mapping: { es: 'Cartografía', en: 'Mapping' },
  partners: { es: 'Socios comerciales', en: 'Commercial partners' },
};

const SECTIONS = [
  { id: 'principios',  title: 'Principios' },
  { id: 'oficiales',   title: 'Datos oficiales' },
  { id: 'cartografia', title: 'Cartografía' },
  { id: 'socios',      title: 'Socios comerciales' },
  { id: 'editorial',   title: 'Datos editoriales' },
  { id: 'calidad',     title: 'Calidad y auditoría' },
  { id: 'reportar',    title: 'Reportar un error' },
];

export default async function FuentesDeDatosPage() {
  const locale = await getLocale();
  const isEn = locale === 'en';  const grouped = {
    official: SOURCES.filter((s) => s.category === 'official'),
    mapping: SOURCES.filter((s) => s.category === 'mapping'),
    partners: SOURCES.filter((s) => s.category === 'partners'),
  };

  return (
    <PageShell
      title={isEn ? 'Data sources' : 'Fuentes de datos'}
      kicker={isEn ? 'Company · Data' : 'Empresa · Datos'}
      summary={
        isEn
          ? 'The APIs, datasets and official sources that power Rutas en MX, including update cadence, licensing and coverage.'
          : 'Las APIs, datasets y fuentes oficiales que alimentan Rutas en MX, con frecuencia de actualización, licencias y cobertura.'
      }
      decorKey="fuentes-de-datos"
      current="fuentes-de-datos"
      accent="sky"
      sections={SECTIONS}
      stats={[
        { value: String(SOURCES.length), label: isEn ? 'Integrated sources' : 'Fuentes integradas' },
        { value: String(grouped.official.length), label: isEn ? 'Official datasets' : 'Datasets oficiales' },
        { value: '2,000+', label: isEn ? 'Verified places' : 'Lugares verificados' },
        { value: '30 d', label: isEn ? 'Avg. freshness' : 'Frescura promedio' },
      ]}
    >
      <section id="principios" className="mb-14 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          {isEn ? 'Guiding principles' : 'Principios rectores'}
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: Database,
              t: isEn ? 'Open first' : 'Datos abiertos primero',
              d: isEn
                ? 'We prefer open, official sources over proprietary databases whenever possible.'
                : 'Preferimos fuentes oficiales abiertas sobre bases propietarias siempre que sea posible.',
            },
            {
              icon: RefreshCw,
              t: isEn ? 'Transparent freshness' : 'Frescura transparente',
              d: isEn
                ? 'Every source lists its update cadence and we show last-sync dates on critical data.'
                : 'Cada fuente indica su frecuencia de actualización y mostramos la fecha de último sync en datos críticos.',
            },
            {
              icon: CheckCircle2,
              t: isEn ? 'Always attributed' : 'Siempre atribuidas',
              d: isEn
                ? 'Every data point carries its provenance. Attribution is visible on detail pages.'
                : 'Cada dato lleva su procedencia. La atribución aparece en las páginas de detalle.',
            },
            {
              icon: AlertTriangle,
              t: isEn ? 'Fallbacks for outages' : 'Respaldos ante caídas',
              d: isEn
                ? 'When an API is down we use cached snapshots and flag the UI so users know.'
                : 'Cuando una API está caída usamos snapshots cacheados y marcamos la UI para avisar al usuario.',
            },
          ].map(({ icon: Icon, t, d }) => (
            <li key={t} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{t}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{d}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <SourceSection
        id="oficiales"
        title={isEn ? 'Official data' : 'Datos oficiales'}
        description={
          isEn
            ? 'The bedrock of our catalogue — government datasets covering tourism, heritage, culture and geography.'
            : 'La base de nuestro catálogo — datasets gubernamentales de turismo, patrimonio, cultura y geografía.'
        }
        items={grouped.official}
        categoryLabel={CATEGORY_LABEL.official[isEn ? 'en' : 'es']}
      />

      <SourceSection
        id="cartografia"
        title={isEn ? 'Mapping' : 'Cartografía'}
        description={
          isEn
            ? 'Mapping stacks that make interactive maps fast and accurate.'
            : 'Bases cartográficas que hacen que los mapas interactivos sean rápidos y precisos.'
        }
        items={grouped.mapping}
        categoryLabel={CATEGORY_LABEL.mapping[isEn ? 'en' : 'es']}
      />

      <SourceSection
        id="socios"
        title={isEn ? 'Commercial partners' : 'Socios comerciales'}
        description={
          isEn
            ? 'Clearly labelled commercial integrations — always as affiliate links, never as hidden advertising.'
            : 'Integraciones comerciales claramente etiquetadas — siempre como enlaces de afiliado, nunca como publicidad oculta.'
        }
        items={grouped.partners}
        categoryLabel={CATEGORY_LABEL.partners[isEn ? 'en' : 'es']}
      />

      <section id="editorial" className="mb-14 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          {isEn ? 'Editorial data' : 'Datos editoriales'}
        </h2>
        <p className="mt-4 max-w-3xl leading-7 text-slate-600">
          {isEn ? (
            <>
              Descriptions, routes, curated collections and editorial guides are
              written by our in-house team. When content relies on external sources
              we include the corresponding citation and date. See our{' '}
              <Link href="/politica-editorial">editorial policy</Link> for details.
            </>
          ) : (
            <>
              Descripciones, rutas, colecciones curadas y guías editoriales son
              redactadas por nuestro equipo interno. Cuando un contenido se apoya
              en fuentes externas incluimos la cita y fecha correspondiente. Ver
              nuestra <Link href="/politica-editorial">política editorial</Link>{' '}
              para más detalles.
            </>
          )}
        </p>
      </section>

      <section id="calidad" className="mb-14 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          {isEn ? 'Quality & audit' : 'Calidad y auditoría'}
        </h2>
        <ul className="mt-5 list-disc space-y-2 pl-6 leading-7 text-slate-600 marker:text-emerald-500">
          <li>{isEn ? 'Coordinates validated against INEGI.' : 'Coordenadas validadas contra INEGI.'}</li>
          <li>{isEn ? 'Prices and opening hours re-verified within the last 4 weeks.' : 'Precios y horarios verificados en las últimas 4 semanas.'}</li>
          <li>{isEn ? 'Scheduled crawls for official sources; incremental sync with SHA-256 hashing.' : 'Sincronización incremental de fuentes oficiales con hashing SHA-256 de registros.'}</li>
          <li>{isEn ? 'Quarterly internal audit with a 200-record random sample.' : 'Auditoría interna trimestral con muestreo aleatorio de 200 registros.'}</li>
          <li>{isEn ? 'Public changelog of material corrections.' : 'Bitácora pública de correcciones materiales.'}</li>
        </ul>
      </section>

      <section id="reportar" className="rounded-3xl bg-gradient-to-br from-slate-900 to-sky-900 p-8 text-white shadow-xl sm:p-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
              {isEn ? 'Report an error' : 'Reportar un error'}
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              {isEn ? 'Spotted something off?' : '¿Viste algo que no cuadra?'}
            </h2>
            <p className="mt-2 max-w-xl text-slate-200">
              {isEn
                ? 'Every published correction shows up in our public changelog.'
                : 'Cada corrección publicada se registra en nuestra bitácora pública.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/correcciones"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              {isEn ? 'View changelog' : 'Ver bitácora'}
            </Link>
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {isEn ? 'Contact form' : 'Formulario'}
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function SourceSection({
  id,
  title,
  description,
  items,
  categoryLabel,
}: {
  id: string;
  title: string;
  description: string;
  items: SourceEntry[];
  categoryLabel: string;
}) {
  return (
    <section id={id} className="mb-14">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
        {categoryLabel}
      </p>
      <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
      <p className="mt-3 max-w-3xl leading-7 text-slate-600">{description}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <article
            key={item.key}
            className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                <p className="text-sm text-slate-500">{item.short}</p>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ExternalLink className="h-3 w-3" />
                Sitio
              </a>
            </div>
            <p className="text-sm leading-6 text-slate-600">{item.purpose}</p>
            <dl className="mt-1 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="font-semibold uppercase tracking-wider text-slate-400">Cobertura</dt>
                <dd className="mt-0.5 text-slate-700">{item.coverage}</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wider text-slate-400">Frecuencia</dt>
                <dd className="mt-0.5 text-slate-700">{item.frequency}</dd>
              </div>
              <div className="col-span-2">
                <dt className="font-semibold uppercase tracking-wider text-slate-400">Licencia</dt>
                <dd className="mt-0.5 text-slate-700">{item.license}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
