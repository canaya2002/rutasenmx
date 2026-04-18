import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { getLocale } from '@/lib/i18n/server';
import { PageShell } from '@/components/layout/PageShell';
import { pickDecoration } from '@/lib/data/general-images';
import { Scale, Target, LineChart, Gauge, BookOpen } from 'lucide-react';

const PAGE_PATH = '/metodologia';
const PAGE_TITLE = 'Metodología / Methodology';
const PAGE_DESCRIPTION =
  'Cómo calculamos distancias, costos, rankings y recomendaciones en Rutas en MX. El método paso a paso, con pesos, fórmulas y supuestos.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    keywords: [
      'metodología Rutas en MX',
      'cómo calculamos distancias México',
      'ranking de destinos',
      'cálculo de casetas',
      'cálculo de combustible',
    ],
  });
}

const SECTIONS = [
  { id: 'resumen',        title: 'Resumen' },
  { id: 'distancias',     title: 'Distancias y tiempos' },
  { id: 'costos',         title: 'Costos de viaje' },
  { id: 'ranking',        title: 'Ranking de destinos' },
  { id: 'dificultad',     title: 'Clasificación de rutas' },
  { id: 'autopilot',      title: 'Autopilot (IA)' },
  { id: 'incertidumbre',  title: 'Incertidumbre y supuestos' },
  { id: 'cambios',        title: 'Control de cambios' },
];

export default async function MetodologiaPage() {
  const locale = await getLocale();
  const isEn = locale === 'en';
  return (
    <PageShell
      title={isEn ? 'Methodology' : 'Metodología'}
      kicker={isEn ? 'Company · Methodology' : 'Empresa · Metodología'}
      summary={
        isEn
          ? 'How we compute distances, costs and rankings — step by step, with weights, formulas and the assumptions behind each number.'
          : 'Cómo calculamos distancias, costos y rankings — paso a paso, con pesos, fórmulas y los supuestos detrás de cada número.'
      }
      decorKey="metodologia"
      current="metodologia"
      accent="amber"
      sections={SECTIONS}
      stats={[
        { value: '8', label: isEn ? 'Key formulas' : 'Fórmulas clave' },
        { value: '±5%', label: isEn ? 'Toll accuracy' : 'Precisión casetas' },
        { value: '±8%', label: isEn ? 'Fuel accuracy' : 'Precisión gasolina' },
        { value: 'v2.1', label: isEn ? 'Current version' : 'Versión vigente' },
      ]}
    >
      {isEn ? <MethodologyEn /> : <MethodologyEs />}
    </PageShell>
  );
}

function MethodologyEs() {
  return (
    <>
      <section id="resumen" className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <BookOpen className="h-4 w-4" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Resumen</h2>
        </div>
        <p className="mt-4 leading-7 text-slate-600">
          Esta página documenta la manera en que procesamos los datos que
          publicamos. Es la misma guía técnica que seguimos internamente.
          Nuestro propósito es que puedas entender y cuestionar cada número
          visible en Rutas en MX.
        </p>
      </section>

      <section id="distancias" className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Gauge className="h-4 w-4" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Distancias y tiempos</h2>
        </div>
        <ul className="mt-5 list-disc space-y-2 pl-6 leading-7 text-slate-600 marker:text-amber-500">
          <li>Usamos la <strong>Mapbox Directions API</strong> (profile <code>driving-traffic</code>) para calcular distancia y tiempo entre paradas.</li>
          <li>Aplicamos un <strong>factor de tráfico</strong> de +12% en trayectos urbanos (CDMX, GDL, MTY).</li>
          <li>Las rutas editoriales incluyen además tiempos mínimos de parada validados por el equipo.</li>
          <li>Las distancias a nivel de estado se calculan contra el centroide INEGI de cada municipio.</li>
        </ul>
      </section>

      <section id="costos" className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <LineChart className="h-4 w-4" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Costos de viaje</h2>
        </div>
        <h3 className="mt-5 text-lg font-semibold text-slate-900">Casetas</h3>
        <p className="mt-2 leading-7 text-slate-600">
          Sumamos las tarifas publicadas por <strong>CAPUFE</strong> para cada
          caseta que atraviesa la ruta, en la categoría seleccionada por el
          usuario (coche, SUV, moto). Fuente: tabulador oficial vigente.
        </p>
        <h3 className="mt-5 text-lg font-semibold text-slate-900">Combustible</h3>
        <p className="mt-2 leading-7 text-slate-600">
          Estimamos litros con <code>(distancia_km × consumo_l/100km) / 100</code>.
          El consumo por defecto es 9 L/100 km para gasolina Magna y se ajusta
          según el tipo de vehículo declarado. Multiplicamos por el{' '}
          <strong>precio promedio semanal CRE</strong> del estado por el que
          circula la ruta.
        </p>
        <h3 className="mt-5 text-lg font-semibold text-slate-900">Hospedaje y comida</h3>
        <p className="mt-2 leading-7 text-slate-600">
          Sólo aparecen cuando el usuario elige un estilo de viaje (económico,
          moderado, premium, lujo). El rango diario se calcula con medianas de
          mercado por estado (fuentes: INEGI, Booking.com, Airbnb) y se declara
          como rango, no como valor único.
        </p>
      </section>

      <section id="ranking" className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
            <Target className="h-4 w-4" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Ranking de destinos</h2>
        </div>
        <p className="mt-4 leading-7 text-slate-600">
          El orden de los destinos en listados y sugerencias resulta de un
          puntaje compuesto con los siguientes pesos:
        </p>
        <ul className="mt-5 space-y-2 leading-7 text-slate-600">
          <li><strong>30%</strong> — Relevancia turística (SECTUR, INAH, UNESCO).</li>
          <li><strong>25%</strong> — Calificación editorial interna (0–10).</li>
          <li><strong>15%</strong> — Calidad de la información (completitud del registro).</li>
          <li><strong>15%</strong> — Reseñas agregadas (si la fuente es confiable).</li>
          <li><strong>10%</strong> — Accesibilidad y temporada.</li>
          <li><strong>5%</strong> — Frescura de la última verificación.</li>
        </ul>
        <p className="mt-4 leading-7 text-slate-600">
          Los listados patrocinados se muestran por separado y no afectan este ranking.
        </p>
      </section>

      <section id="dificultad" className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Scale className="h-4 w-4" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Clasificación de rutas</h2>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            { k: 'Fácil', c: 'bg-emerald-50 text-emerald-700 border-emerald-200', d: 'Carretera federal o autopista, <300 km/día, sin terracería.' },
            { k: 'Moderada', c: 'bg-amber-50 text-amber-700 border-amber-200', d: '300–500 km/día, puede incluir sierra o carretera secundaria bien señalizada.' },
            { k: 'Avanzada', c: 'bg-rose-50 text-rose-700 border-rose-200', d: '>500 km/día o tramos de terracería, altura > 2,500 msnm, o zonas con poca gasolinera.' },
          ].map((x) => (
            <div key={x.k} className={`rounded-2xl border p-5 ${x.c}`}>
              <p className="text-sm font-bold uppercase tracking-wider">{x.k}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="autopilot" className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Autopilot (IA)</h2>
        <p className="mt-3 leading-7 text-slate-600">
          El planificador <strong>Autopilot</strong> genera itinerarios personalizados combinando tres capas:
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-6 leading-7 text-slate-600 marker:text-amber-500">
          <li><strong>Catálogo</strong> — sólo propone lugares presentes en nuestro dataset verificado.</li>
          <li><strong>Restricciones</strong> — respeta fechas, ritmo, presupuesto, radio, must-visit y preferencias.</li>
          <li><strong>Modelo</strong> — ordena y narra el itinerario. La IA se usa como redactor asistente, no como fuente de datos.</li>
        </ol>
        <p className="mt-4 leading-7 text-slate-600">
          Todo itinerario generado se etiqueta como &ldquo;Generado por IA&rdquo;. Puedes editar cualquier paso.
        </p>
      </section>

      <section id="incertidumbre" className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Incertidumbre y supuestos</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-slate-600 marker:text-amber-500">
          <li>Las tarifas de casetas pueden variar; informamos un margen de <strong>±5%</strong>.</li>
          <li>El precio de la gasolina varía semanalmente; margen típico <strong>±8%</strong>.</li>
          <li>Horarios y precios de museos y zonas arqueológicas pueden cambiar sin previo aviso.</li>
          <li>La disponibilidad de hospedaje depende del proveedor; los enlaces llevan a búsqueda en tiempo real.</li>
        </ul>
      </section>

      <section id="cambios" className="rounded-3xl bg-gradient-to-br from-amber-50 to-white p-8 shadow-sm ring-1 ring-amber-100 sm:p-10">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Control de cambios</h2>
        <p className="mt-3 leading-7 text-slate-600">
          Las modificaciones a esta metodología se documentan públicamente con
          versión, fecha de vigencia y resumen. Consulta el historial en{' '}
          <Link href="/correcciones" className="text-emerald-700 hover:underline">
            /correcciones
          </Link>
          .
        </p>
      </section>
    </>
  );
}

function MethodologyEn() {
  return (
    <>
      <section id="resumen" className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <BookOpen className="h-4 w-4" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Overview</h2>
        </div>
        <p className="mt-4 leading-7 text-slate-600">
          This page documents how we process the data we publish — the same
          technical guide we follow internally. The goal is for you to be able
          to understand and question every number on Rutas en MX.
        </p>
      </section>

      <section id="distancias" className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Distances &amp; time</h2>
        <ul className="mt-5 list-disc space-y-2 pl-6 leading-7 text-slate-600 marker:text-amber-500">
          <li>We use the <strong>Mapbox Directions API</strong> (<code>driving-traffic</code>) to compute distance and time between stops.</li>
          <li>We apply a <strong>+12% urban traffic factor</strong> in CDMX, GDL, MTY.</li>
          <li>Editorial routes include minimum stop times validated by the team.</li>
          <li>State-level distances are measured against INEGI&rsquo;s municipal centroid.</li>
        </ul>
      </section>

      <section id="costos" className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Trip costs</h2>
        <h3 className="mt-5 text-lg font-semibold text-slate-900">Tolls</h3>
        <p className="mt-2 leading-7 text-slate-600">
          We sum tolls published by <strong>CAPUFE</strong> for every booth
          crossed, in the user&rsquo;s vehicle category (car, SUV, motorcycle).
        </p>
        <h3 className="mt-5 text-lg font-semibold text-slate-900">Fuel</h3>
        <p className="mt-2 leading-7 text-slate-600">
          Litres estimated with <code>(distance_km × consumption_l_per_100) / 100</code>.
          Default consumption 9 L/100 km for Magna petrol; adjusted by declared
          vehicle type. Multiplied by the <strong>weekly CRE average</strong> for
          the relevant state.
        </p>
        <h3 className="mt-5 text-lg font-semibold text-slate-900">Lodging &amp; food</h3>
        <p className="mt-2 leading-7 text-slate-600">
          Shown when the user picks a travel style. Daily range uses state-level
          market medians (INEGI, Booking.com, Airbnb) and is always presented as
          a range, never a single number.
        </p>
      </section>

      <section id="ranking" className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Destination ranking</h2>
        <p className="mt-4 leading-7 text-slate-600">Composite score with these weights:</p>
        <ul className="mt-5 space-y-2 leading-7 text-slate-600">
          <li><strong>30%</strong> — Tourism relevance (SECTUR, INAH, UNESCO).</li>
          <li><strong>25%</strong> — In-house editorial rating (0–10).</li>
          <li><strong>15%</strong> — Data quality (record completeness).</li>
          <li><strong>15%</strong> — Aggregated reviews (trusted sources only).</li>
          <li><strong>10%</strong> — Accessibility and season.</li>
          <li><strong>5%</strong> — Freshness of last verification.</li>
        </ul>
      </section>

      <section id="dificultad" className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Route classification</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            { k: 'Easy', c: 'bg-emerald-50 text-emerald-700 border-emerald-200', d: 'Federal road or highway, <300 km/day, no dirt roads.' },
            { k: 'Moderate', c: 'bg-amber-50 text-amber-700 border-amber-200', d: '300–500 km/day, may include mountain or well-signed secondary road.' },
            { k: 'Advanced', c: 'bg-rose-50 text-rose-700 border-rose-200', d: '>500 km/day or dirt-road sections, altitude > 2,500 m, low-fuel zones.' },
          ].map((x) => (
            <div key={x.k} className={`rounded-2xl border p-5 ${x.c}`}>
              <p className="text-sm font-bold uppercase tracking-wider">{x.k}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="autopilot" className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Autopilot (AI)</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-6 leading-7 text-slate-600 marker:text-amber-500">
          <li><strong>Catalogue</strong> — only proposes verified places.</li>
          <li><strong>Constraints</strong> — honours dates, pace, budget, radius, must-visit and preferences.</li>
          <li><strong>Model</strong> — orders and narrates the itinerary. AI is a writing assistant, never a data source.</li>
        </ol>
      </section>

      <section id="incertidumbre" className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Uncertainty &amp; assumptions</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-slate-600 marker:text-amber-500">
          <li>Toll fares may vary; we report a <strong>±5%</strong> margin.</li>
          <li>Fuel price varies weekly; typical margin <strong>±8%</strong>.</li>
          <li>Museum and archaeological hours may change without notice.</li>
          <li>Lodging availability depends on the provider; links point to real-time search.</li>
        </ul>
      </section>

      <section id="cambios" className="rounded-3xl bg-gradient-to-br from-amber-50 to-white p-8 shadow-sm ring-1 ring-amber-100 sm:p-10">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Change control</h2>
        <p className="mt-3 leading-7 text-slate-600">
          Methodology changes are published with version, effective date and
          summary at{' '}
          <Link href="/correcciones" className="text-emerald-700 hover:underline">
            /corrections
          </Link>
          .
        </p>
      </section>
    </>
  );
}
