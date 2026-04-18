import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { getLocale } from '@/lib/i18n/server';
import { LegalShell, type LegalSection } from '@/components/legal/LegalShell';

const PAGE_PATH = '/correcciones';
const PAGE_TITLE = 'Correcciones / Corrections';
const PAGE_DESCRIPTION =
  'Bitácora pública de correcciones y actualizaciones importantes publicadas por el equipo editorial de Rutas en MX, junto al proceso para reportar un error.';
const LAST_UPDATED = '2026-04-18';
const VERSION = 'v2.0';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
  });
}

const SECTIONS_ES: LegalSection[] = [
  { id: 'como-funciona',     title: 'Cómo funciona la bitácora' },
  { id: 'clasificacion',     title: 'Clasificación de cambios' },
  { id: 'reportar',          title: 'Cómo reportar un error' },
  { id: 'plazos',            title: 'Plazos de respuesta' },
  { id: 'criterios',         title: 'Criterios para publicar una corrección' },
  { id: 'historial',         title: 'Historial de correcciones' },
  { id: 'politicas',         title: 'Políticas relacionadas' },
];

const SECTIONS_EN: LegalSection[] = [
  { id: 'como-funciona',     title: 'How the changelog works' },
  { id: 'clasificacion',     title: 'Classification of changes' },
  { id: 'reportar',          title: 'How to report an error' },
  { id: 'plazos',            title: 'Response windows' },
  { id: 'criterios',         title: 'Criteria for publishing a correction' },
  { id: 'historial',         title: 'Corrections log' },
  { id: 'politicas',         title: 'Related policies' },
];

interface CorrectionEntry {
  date: string;                 // ISO date
  severity: 'minor' | 'major' | 'clarification' | 'legal';
  area: string;                 // e.g. "Guía: Oaxaca gastronómica"
  summary: string;              // Short plain-language summary
  href?: string;
}

// Add new entries at the TOP. Keep summaries neutral and factual.
const ENTRIES: CorrectionEntry[] = [
  {
    date: '2026-04-18',
    severity: 'clarification',
    area: 'Política editorial',
    summary:
      'Publicamos la primera bitácora pública y reestructuramos las páginas legales con tabla de contenido, fechas de vigencia y versionado. / Published the first public changelog and restructured legal pages with TOC, effective dates and versioning.',
    href: '/politica-editorial',
  },
  {
    date: '2026-04-17',
    severity: 'minor',
    area: 'Pueblos Mágicos',
    summary:
      'Incorporamos 64 Pueblos Mágicos verificados del seed oficial de SECTUR y activamos la vista previa del mapa en todas las tarjetas. / Added 64 verified Pueblos Mágicos from the official SECTUR seed and enabled the map preview across every card.',
    href: '/pueblos-magicos',
  },
];

export default async function CorreccionesPage() {
  const locale = await getLocale();
  const isEn = locale === 'en';
  const breadcrumbs = buildBreadcrumbs([
    { label: isEn ? 'Corrections' : 'Correcciones', href: PAGE_PATH },
  ]);
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  const title = isEn ? 'Corrections' : 'Correcciones';
  const kicker = isEn ? 'Legal · Changelog' : 'Legal · Bitácora';
  const summary = isEn
    ? 'Our public changelog of factual corrections and material updates, plus the process to report an error.'
    : 'Bitácora pública de correcciones factuales y actualizaciones importantes, con el proceso para reportar un error.';

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <LegalShell
        title={title}
        kicker={kicker}
        summary={summary}
        lastUpdated={LAST_UPDATED}
        version={VERSION}
        readingMinutes={5}
        isEn={isEn}
        current="correcciones"
        sections={isEn ? SECTIONS_EN : SECTIONS_ES}
      >
        {isEn ? <CorrectionsEn entries={ENTRIES} /> : <CorrectionsEs entries={ENTRIES} />}
      </LegalShell>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Entry styling                                                      */
/* ------------------------------------------------------------------ */

const severityStyle: Record<
  CorrectionEntry['severity'],
  { es: string; en: string; dot: string; pill: string }
> = {
  minor: {
    es: 'Menor',
    en: 'Minor',
    dot: 'bg-sky-500',
    pill: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  },
  major: {
    es: 'Mayor',
    en: 'Major',
    dot: 'bg-amber-500',
    pill: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  },
  clarification: {
    es: 'Aclaración',
    en: 'Clarification',
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  },
  legal: {
    es: 'Legal',
    en: 'Legal',
    dot: 'bg-slate-900',
    pill: 'bg-slate-100 text-slate-700 ring-1 ring-slate-300',
  },
};

function formatDate(iso: string, isEn: boolean): string {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString(isEn ? 'en-US' : 'es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function Timeline({ entries, isEn }: { entries: CorrectionEntry[]; isEn: boolean }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-600">
          {isEn
            ? 'No corrections logged yet.'
            : 'Aún no hay correcciones registradas.'}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {isEn
            ? 'Spot an error? Use the contact form or email correcciones@rutasenmx.com.'
            : '¿Detectaste un error? Usa el formulario de contacto o escribe a correcciones@rutasenmx.com.'}
        </p>
      </div>
    );
  }
  return (
    <ol className="not-prose relative space-y-5 border-l border-slate-200 pl-6">
      {entries.map((entry, i) => {
        const s = severityStyle[entry.severity];
        return (
          <li key={`${entry.date}-${i}`} className="relative">
            <span
              aria-hidden
              className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ring-4 ring-white ${s.dot}`}
            />
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <time
                  dateTime={entry.date}
                  className="font-semibold text-slate-900"
                >
                  {formatDate(entry.date, isEn)}
                </time>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.pill}`}
                >
                  {isEn ? s.en : s.es}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{entry.area}</span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{entry.summary}</p>
              {entry.href && (
                <Link
                  href={entry.href}
                  className="mt-2 inline-flex text-xs font-semibold text-emerald-700 hover:underline"
                >
                  {isEn ? 'View affected section →' : 'Ver sección afectada →'}
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Spanish                                                            */
/* ------------------------------------------------------------------ */
function CorrectionsEs({ entries }: { entries: CorrectionEntry[] }) {
  return (
    <>
      <section id="como-funciona">
        <h2>1. Cómo funciona la bitácora</h2>
        <p>
          En Rutas en MX cada corrección importante se registra de forma pública
          en esta bitácora. Nuestro objetivo es que los lectores puedan ver qué
          cambió, cuándo y por qué, sin tener que comparar versiones
          históricas. Las entradas se ordenan de más reciente a más antigua y no
          se eliminan: si una entrada necesita ser corregida, publicamos una
          nueva entrada que la aclara.
        </p>
      </section>

      <section id="clasificacion">
        <h2>2. Clasificación de cambios</h2>
        <ul>
          <li><strong>Menor:</strong> tipografías, ortografía, datos no críticos.</li>
          <li><strong>Mayor:</strong> cambios que modifican una recomendación, un dato clave (coordenadas, costos, horarios) o un ranking.</li>
          <li><strong>Aclaración:</strong> añadimos contexto a un contenido existente sin modificar lo publicado.</li>
          <li><strong>Legal:</strong> cambios en políticas, términos o aspectos legales; se notifican por correo a cuentas activas.</li>
        </ul>
      </section>

      <section id="reportar">
        <h2>3. Cómo reportar un error</h2>
        <ol>
          <li>Copia la <strong>URL</strong> exacta donde encontraste el error.</li>
          <li>Describe qué es incorrecto y, si puedes, indica la fuente correcta (sitio oficial, publicación, coordenadas).</li>
          <li>Envíanos la información por:
            <ul>
              <li>Formulario: <Link href="/contacto">/contacto</Link></li>
              <li>Correo: <a href="mailto:correcciones@rutasenmx.com">correcciones@rutasenmx.com</a></li>
              <li>Botón &ldquo;Reportar error&rdquo; visible en cada guía y ficha de lugar.</li>
            </ul>
          </li>
        </ol>
      </section>

      <section id="plazos">
        <h2>4. Plazos de respuesta</h2>
        <ul>
          <li><strong>48 horas:</strong> acuse de recibo.</li>
          <li><strong>7 días:</strong> publicación de correcciones menores.</li>
          <li><strong>14 días:</strong> publicación de correcciones mayores o que requieren trabajo editorial.</li>
          <li><strong>Urgente:</strong> si se trata de un riesgo para la seguridad del viajero (cierre de carretera, restricción, etc.), actualizamos en cuanto podemos verificarlo y enviamos alerta por correo a usuarios con ese viaje guardado.</li>
        </ul>
      </section>

      <section id="criterios">
        <h2>5. Criterios para publicar una corrección</h2>
        <p>Registramos en la bitácora todo cambio que cumpla cualquiera de estos criterios:</p>
        <ul>
          <li>Modifica un dato factual ya publicado (fecha, costo, distancia, horario).</li>
          <li>Cambia una recomendación editorial existente.</li>
          <li>Altera rankings o listados principales.</li>
          <li>Actualiza políticas, términos o texto legal.</li>
        </ul>
        <p>
          No registramos cambios de estilo puramente cosméticos (colores,
          iconografía, tipografía) a menos que impacten la lectura.
        </p>
      </section>

      <section id="historial">
        <h2>6. Historial de correcciones</h2>
        <Timeline entries={entries} isEn={false} />
      </section>

      <section id="politicas">
        <h2>7. Políticas relacionadas</h2>
        <ul>
          <li><Link href="/politica-editorial">Política editorial</Link> — cómo creamos y revisamos el contenido.</li>
          <li><Link href="/metodologia">Metodología</Link> — cómo calculamos rankings y distancias.</li>
          <li><Link href="/fuentes-de-datos">Fuentes de datos</Link> — qué APIs y datasets alimentan la plataforma.</li>
          <li><Link href="/terminos">Términos de servicio</Link> — condiciones generales de uso.</li>
        </ul>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* English                                                            */
/* ------------------------------------------------------------------ */
function CorrectionsEn({ entries }: { entries: CorrectionEntry[] }) {
  return (
    <>
      <section id="como-funciona">
        <h2>1. How the changelog works</h2>
        <p>
          At Rutas en MX every material correction is logged publicly here. The
          goal is that readers can see what changed, when and why, without
          having to diff historical versions. Entries are ordered newest first
          and are never deleted: if an entry itself needs correcting, we
          publish a new entry that clarifies it.
        </p>
      </section>

      <section id="clasificacion">
        <h2>2. Classification of changes</h2>
        <ul>
          <li><strong>Minor</strong> — typos, spelling, non-critical data.</li>
          <li><strong>Major</strong> — changes that alter a recommendation, a key data point (coordinates, prices, hours) or a ranking.</li>
          <li><strong>Clarification</strong> — adding context to existing content without changing what was published.</li>
          <li><strong>Legal</strong> — changes to policies, terms or legal copy; notified by email to active accounts.</li>
        </ul>
      </section>

      <section id="reportar">
        <h2>3. How to report an error</h2>
        <ol>
          <li>Copy the exact <strong>URL</strong> where you found the error.</li>
          <li>Describe what is incorrect and, if possible, provide the correct source (official website, publication, coordinates).</li>
          <li>Send it via:
            <ul>
              <li>Form: <Link href="/contacto">/contact</Link></li>
              <li>Email: <a href="mailto:correcciones@rutasenmx.com">correcciones@rutasenmx.com</a></li>
              <li>&ldquo;Report error&rdquo; button visible on every guide and place detail page.</li>
            </ul>
          </li>
        </ol>
      </section>

      <section id="plazos">
        <h2>4. Response windows</h2>
        <ul>
          <li><strong>48 hours</strong> — acknowledgement.</li>
          <li><strong>7 days</strong> — minor corrections published.</li>
          <li><strong>14 days</strong> — major corrections or those requiring editorial work.</li>
          <li><strong>Urgent</strong> — if it involves traveller safety (road closure, restriction, etc.), we update as soon as we can verify and email users with that trip saved.</li>
        </ul>
      </section>

      <section id="criterios">
        <h2>5. Criteria for publishing a correction</h2>
        <p>We log any change that meets any of these criteria:</p>
        <ul>
          <li>Modifies a published fact (date, price, distance, hours).</li>
          <li>Changes an existing editorial recommendation.</li>
          <li>Alters rankings or main listings.</li>
          <li>Updates policy, terms or legal copy.</li>
        </ul>
        <p>
          We do not log purely cosmetic style changes (colours, iconography,
          typography) unless they impact readability.
        </p>
      </section>

      <section id="historial">
        <h2>6. Corrections log</h2>
        <Timeline entries={entries} isEn={true} />
      </section>

      <section id="politicas">
        <h2>7. Related policies</h2>
        <ul>
          <li><Link href="/politica-editorial">Editorial policy</Link> — how we produce and review content.</li>
          <li><Link href="/metodologia">Methodology</Link> — how we compute rankings and distances.</li>
          <li><Link href="/fuentes-de-datos">Data sources</Link> — which APIs and datasets feed the platform.</li>
          <li><Link href="/terminos">Terms of service</Link> — general usage conditions.</li>
        </ul>
      </section>
    </>
  );
}
