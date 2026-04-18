import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { getLocale } from '@/lib/i18n/server';
import { LegalShell, type LegalSection } from '@/components/legal/LegalShell';

const PAGE_PATH = '/politica-editorial';
const PAGE_TITLE = 'Política editorial / Editorial policy';
const PAGE_DESCRIPTION =
  'Principios que rigen el contenido de Rutas en MX: independencia editorial, curaduría, fuentes oficiales, patrocinios, diversidad, verificación y manejo de errores.';
const LAST_UPDATED = '2026-04-18';
const EFFECTIVE = '2026-04-18';
const VERSION = 'v2.0';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
  });
}

const SECTIONS_ES: LegalSection[] = [
  { id: 'mision',           title: 'Misión editorial' },
  { id: 'principios',       title: 'Principios' },
  { id: 'quien',            title: 'Quién escribe y revisa' },
  { id: 'fuentes',          title: 'Fuentes y atribución' },
  { id: 'ranking',          title: 'Ranking y curaduría' },
  { id: 'ia',               title: 'Uso de inteligencia artificial' },
  { id: 'sponsored',        title: 'Contenido patrocinado' },
  { id: 'afiliados',        title: 'Afiliados y comisiones' },
  { id: 'diversidad',       title: 'Diversidad y accesibilidad' },
  { id: 'fotografia',       title: 'Fotografía y derechos' },
  { id: 'verificacion',     title: 'Verificación y fact-checking' },
  { id: 'errores',          title: 'Errores y correcciones' },
  { id: 'independencia',    title: 'Independencia editorial' },
  { id: 'contacto',         title: 'Contacto editorial' },
];

const SECTIONS_EN: LegalSection[] = [
  { id: 'mision',           title: 'Editorial mission' },
  { id: 'principios',       title: 'Principles' },
  { id: 'quien',            title: 'Who writes and reviews' },
  { id: 'fuentes',          title: 'Sources & attribution' },
  { id: 'ranking',          title: 'Ranking & curation' },
  { id: 'ia',               title: 'Use of AI' },
  { id: 'sponsored',        title: 'Sponsored content' },
  { id: 'afiliados',        title: 'Affiliates & commissions' },
  { id: 'diversidad',       title: 'Diversity & accessibility' },
  { id: 'fotografia',       title: 'Photography & rights' },
  { id: 'verificacion',     title: 'Verification & fact-checking' },
  { id: 'errores',          title: 'Errors & corrections' },
  { id: 'independencia',    title: 'Editorial independence' },
  { id: 'contacto',         title: 'Editorial contact' },
];

export default async function PoliticaEditorialPage() {
  const locale = await getLocale();
  const isEn = locale === 'en';
  const breadcrumbs = buildBreadcrumbs([
    { label: isEn ? 'Editorial policy' : 'Política editorial', href: PAGE_PATH },
  ]);
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  const title = isEn ? 'Editorial policy' : 'Política editorial';
  const kicker = isEn ? 'Legal · Editorial' : 'Legal · Editorial';
  const summary = isEn
    ? 'How we produce, curate and review content, how we label sponsorships, and how we keep our recommendations trustworthy and independent.'
    : 'Cómo producimos, curamos y revisamos el contenido, cómo etiquetamos los patrocinios y cómo mantenemos nuestras recomendaciones confiables e independientes.';

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <LegalShell
        title={title}
        kicker={kicker}
        summary={summary}
        lastUpdated={LAST_UPDATED}
        effectiveDate={EFFECTIVE}
        version={VERSION}
        readingMinutes={8}
        isEn={isEn}
        current="politica-editorial"
        sections={isEn ? SECTIONS_EN : SECTIONS_ES}
      >
        {isEn ? <EditorialEn /> : <EditorialEs />}
      </LegalShell>
    </>
  );
}

function EditorialEs() {
  return (
    <>
      <section id="mision">
        <h2>1. Misión editorial</h2>
        <p>
          Rutas en MX existe para ayudar a viajeros a descubrir México por
          carretera con información <strong>útil, precisa y respetuosa</strong> con
          las comunidades locales. Nuestro contenido combina datos oficiales
          abiertos con curaduría editorial humana.
        </p>
      </section>

      <section id="principios">
        <h2>2. Principios</h2>
        <ul>
          <li><strong>Utilidad:</strong> cada recomendación debe ayudarte a tomar una decisión de viaje.</li>
          <li><strong>Exactitud:</strong> citamos fuente, fecha y método cada vez que publicamos un dato cuantitativo.</li>
          <li><strong>Transparencia:</strong> señalamos patrocinios, afiliados y contenido generado o asistido por IA.</li>
          <li><strong>Respeto:</strong> promovemos turismo responsable y cuidamos la imagen de las comunidades que cubrimos.</li>
          <li><strong>Independencia:</strong> ninguna recomendación editorial se paga ni se regala.</li>
        </ul>
      </section>

      <section id="quien">
        <h2>3. Quién escribe y revisa</h2>
        <p>
          El equipo editorial está formado por periodistas de viajes y editores
          locales con experiencia en el territorio que cubren. Todo artículo nuevo
          pasa por al menos <strong>dos revisiones</strong>: una editorial y una de
          fact-checking. La identidad de los autores y la fecha de publicación y
          última actualización aparece en cada guía.
        </p>
      </section>

      <section id="fuentes">
        <h2>4. Fuentes y atribución</h2>
        <p>Usamos y atribuimos las siguientes fuentes oficiales:</p>
        <ul>
          <li><strong>SECTUR</strong> — catálogo de Pueblos Mágicos.</li>
          <li><strong>INAH</strong> — zonas arqueológicas y sitios históricos.</li>
          <li><strong>SIC Cultura</strong> — museos y patrimonio cultural.</li>
          <li><strong>INEGI</strong> — datos demográficos y geoestadísticos.</li>
          <li><strong>CAPUFE</strong> — costos y condición de casetas.</li>
        </ul>
        <p>
          La lista completa y la frecuencia de actualización está en{' '}
          <Link href="/fuentes-de-datos">/fuentes-de-datos</Link>.
        </p>
      </section>

      <section id="ranking">
        <h2>5. Ranking y curaduría</h2>
        <p>
          El orden en que aparecen los lugares y rutas se determina por señales
          objetivas (distancia, relevancia, antigüedad, cobertura mediática, estado
          de conservación) más calificación editorial. Nuestro{' '}
          <Link href="/metodologia">documento de metodología</Link> explica cada
          criterio y su peso. Los patrocinios <strong>no</strong> alteran ese
          orden; los listados patrocinados se muestran en bloques separados con la
          etiqueta &ldquo;Patrocinado&rdquo;.
        </p>
      </section>

      <section id="ia">
        <h2>6. Uso de inteligencia artificial</h2>
        <ul>
          <li>Usamos IA para <strong>tareas de apoyo</strong>: traducciones preliminares, normalización de direcciones, generación de itinerarios personalizados con el Autopilot.</li>
          <li>Todo artículo que aparece con el sello &ldquo;Editorial&rdquo; pasa por revisión humana antes de publicarse.</li>
          <li>El contenido generado o asistido por IA en el Autopilot lleva una etiqueta clara en la interfaz.</li>
          <li>No usamos IA para fabricar reseñas, imágenes falsas ni citas atribuidas a personas reales.</li>
        </ul>
      </section>

      <section id="sponsored">
        <h2>7. Contenido patrocinado</h2>
        <p>
          Cuando un hotel, destino turístico o marca paga por promoción, lo
          marcamos visiblemente como <strong>&ldquo;Patrocinado&rdquo;</strong> y
          jamás se mezcla con las recomendaciones editoriales. Los patrocinadores:
        </p>
        <ul>
          <li>No tienen acceso previo al texto editorial.</li>
          <li>No pueden modificar calificaciones ni reseñas de usuarios.</li>
          <li>No influyen en el ranking de búsqueda ni en los filtros.</li>
        </ul>
      </section>

      <section id="afiliados">
        <h2>8. Afiliados y comisiones</h2>
        <p>
          Algunos enlaces hacia hospedajes, tours y servicios contienen
          identificadores de afiliado que generan una pequeña comisión para Rutas
          en MX cuando haces una reserva. Esto <strong>no añade costo</strong> para
          ti y <strong>no influye</strong> en la selección editorial. Los enlaces
          de afiliado se identifican con el ícono <code>↗</code>.
        </p>
      </section>

      <section id="diversidad">
        <h2>9. Diversidad y accesibilidad</h2>
        <ul>
          <li>Incluimos activamente destinos y voces de los 32 estados, con atención a comunidades indígenas y rurales.</li>
          <li>Marcamos la <strong>accesibilidad</strong> de cada sitio (rampa, audio-guía, tarifas reducidas) cuando la información está disponible.</li>
          <li>Evitamos estereotipos y usamos lenguaje respetuoso con las comunidades retratadas.</li>
          <li>Nuestra interfaz cumple con <strong>WCAG 2.1 AA</strong> en los puntos críticos del recorrido del usuario.</li>
        </ul>
      </section>

      <section id="fotografia">
        <h2>10. Fotografía y derechos</h2>
        <ul>
          <li>Usamos fotografías con autorización del autor o bajo licencia Creative Commons compatible.</li>
          <li>Cada imagen muestra crédito y licencia en la página donde aparece.</li>
          <li>No usamos imágenes generadas por IA para representar lugares reales.</li>
          <li>Si eres el titular y detectas un uso no autorizado, contáctanos en <a href="mailto:fotos@rutasenmx.com">fotos@rutasenmx.com</a>.</li>
        </ul>
      </section>

      <section id="verificacion">
        <h2>11. Verificación y fact-checking</h2>
        <p>Todo artículo pasa por una lista de verificación antes de publicarse:</p>
        <ul>
          <li>Coordenadas confirmadas contra INEGI.</li>
          <li>Horarios y costos confirmados contra la fuente oficial en las últimas 4 semanas.</li>
          <li>Nombres y ortografía de pueblos, lenguas indígenas y gastronomía revisados con fuentes especializadas.</li>
          <li>Enlaces externos probados y marcados con <code>rel=&quot;noopener&quot;</code>.</li>
        </ul>
      </section>

      <section id="errores">
        <h2>12. Errores y correcciones</h2>
        <p>
          Si detectas un error factual, escríbenos a{' '}
          <a href="mailto:correcciones@rutasenmx.com">correcciones@rutasenmx.com</a>{' '}
          o usa el botón &ldquo;Reportar error&rdquo; en cada guía. Nuestro
          compromiso:
        </p>
        <ul>
          <li>Acuse de recibo en 48 horas.</li>
          <li>Corrección publicada en un máximo de 7 días para errores menores, 14 para cambios mayores.</li>
          <li>Cada corrección se registra en la <Link href="/correcciones">bitácora pública</Link> con fecha y resumen.</li>
        </ul>
      </section>

      <section id="independencia">
        <h2>13. Independencia editorial</h2>
        <p>
          La redacción de Rutas en MX opera de forma independiente del equipo
          comercial. Las decisiones de contenido, ranking y tono pertenecen
          exclusivamente a la redacción. Cualquier intento de presión comercial
          que modifique contenido editorial se documenta y se comparte con el
          consejo editorial.
        </p>
      </section>

      <section id="contacto">
        <h2>14. Contacto editorial</h2>
        <ul>
          <li><strong>Correcciones:</strong> <a href="mailto:correcciones@rutasenmx.com">correcciones@rutasenmx.com</a></li>
          <li><strong>Editor en jefe:</strong> <a href="mailto:editorial@rutasenmx.com">editorial@rutasenmx.com</a></li>
          <li><strong>Pitch de historias:</strong> <a href="mailto:pitches@rutasenmx.com">pitches@rutasenmx.com</a></li>
        </ul>
      </section>
    </>
  );
}

function EditorialEn() {
  return (
    <>
      <section id="mision">
        <h2>1. Editorial mission</h2>
        <p>
          Rutas en MX exists to help travellers discover Mexico by road with
          information that is <strong>useful, accurate and respectful</strong> of
          the communities we cover. Our content combines official open data with
          human editorial curation.
        </p>
      </section>

      <section id="principios">
        <h2>2. Principles</h2>
        <ul>
          <li><strong>Usefulness</strong> — every recommendation should help you make a travel decision.</li>
          <li><strong>Accuracy</strong> — we cite source, date and method whenever we publish a quantitative fact.</li>
          <li><strong>Transparency</strong> — we flag sponsorships, affiliate links and AI-assisted content.</li>
          <li><strong>Respect</strong> — we promote responsible tourism and care for the image of the communities featured.</li>
          <li><strong>Independence</strong> — no editorial recommendation is paid for or gifted.</li>
        </ul>
      </section>

      <section id="quien">
        <h2>3. Who writes and reviews</h2>
        <p>
          The editorial team is made up of travel journalists and local editors
          with field experience in the territory they cover. Every new article
          goes through at least <strong>two reviews</strong>: one editorial and
          one for fact-checking. Each guide includes author, published date and
          last updated date.
        </p>
      </section>

      <section id="fuentes">
        <h2>4. Sources &amp; attribution</h2>
        <p>We use and attribute the following official sources:</p>
        <ul>
          <li><strong>SECTUR</strong> — the Pueblos Mágicos catalogue.</li>
          <li><strong>INAH</strong> — archaeological zones and historic sites.</li>
          <li><strong>SIC Cultura</strong> — museums and cultural heritage.</li>
          <li><strong>INEGI</strong> — demographic and geostatistical data.</li>
          <li><strong>CAPUFE</strong> — tolls and road-fee status.</li>
        </ul>
        <p>
          The full list and update cadence is on{' '}
          <Link href="/fuentes-de-datos">/data-sources</Link>.
        </p>
      </section>

      <section id="ranking">
        <h2>5. Ranking &amp; curation</h2>
        <p>
          The order of places and routes is driven by objective signals
          (distance, relevance, recency, media coverage, preservation status) plus
          editorial rating. Our <Link href="/metodologia">methodology page</Link>{' '}
          explains each criterion and its weight. Sponsorships do <strong>not</strong>{' '}
          alter that order; sponsored listings are shown in separate blocks
          labelled &ldquo;Sponsored&rdquo;.
        </p>
      </section>

      <section id="ia">
        <h2>6. Use of AI</h2>
        <ul>
          <li>We use AI for <strong>supporting tasks</strong>: draft translations, address normalisation, generating personalised itineraries with the Autopilot.</li>
          <li>Every article marked &ldquo;Editorial&rdquo; is reviewed by a human before publication.</li>
          <li>AI-assisted output in the Autopilot is clearly labelled in the UI.</li>
          <li>We do not use AI to fabricate reviews, fake images or quotes attributed to real people.</li>
        </ul>
      </section>

      <section id="sponsored">
        <h2>7. Sponsored content</h2>
        <p>
          When a hotel, destination or brand pays for promotion we clearly mark it{' '}
          <strong>&ldquo;Sponsored&rdquo;</strong> and never mix it with editorial
          recommendations. Sponsors:
        </p>
        <ul>
          <li>Do not get prior access to editorial copy.</li>
          <li>Cannot modify user ratings or reviews.</li>
          <li>Do not influence search ranking or filters.</li>
        </ul>
      </section>

      <section id="afiliados">
        <h2>8. Affiliates &amp; commissions</h2>
        <p>
          Some links to lodging, tours and services carry affiliate identifiers
          that earn Rutas en MX a small commission when you book. This adds{' '}
          <strong>no cost</strong> to you and has <strong>no influence</strong> on
          our editorial selection. Affiliate links are marked with the{' '}
          <code>↗</code> icon.
        </p>
      </section>

      <section id="diversidad">
        <h2>9. Diversity &amp; accessibility</h2>
        <ul>
          <li>We actively include destinations and voices from all 32 states, with attention to indigenous and rural communities.</li>
          <li>We flag <strong>accessibility</strong> features per site (ramp, audio guide, discounted rates) when the data is available.</li>
          <li>We avoid stereotypes and use respectful language about communities featured.</li>
          <li>Our interface meets <strong>WCAG 2.1 AA</strong> on the critical paths of the user journey.</li>
        </ul>
      </section>

      <section id="fotografia">
        <h2>10. Photography &amp; rights</h2>
        <ul>
          <li>We use photographs with the author&rsquo;s permission or under a compatible Creative Commons licence.</li>
          <li>Every image shows credit and licence on the page where it appears.</li>
          <li>We do not use AI-generated images to depict real places.</li>
          <li>Rights holder who notices unauthorised use: contact <a href="mailto:fotos@rutasenmx.com">fotos@rutasenmx.com</a>.</li>
        </ul>
      </section>

      <section id="verificacion">
        <h2>11. Verification &amp; fact-checking</h2>
        <p>Every article goes through a pre-publication checklist:</p>
        <ul>
          <li>Coordinates confirmed against INEGI.</li>
          <li>Hours and prices confirmed against the official source within the last 4 weeks.</li>
          <li>Names and spelling of towns, indigenous languages and food items reviewed with specialised sources.</li>
          <li>External links tested and tagged with <code>rel=&quot;noopener&quot;</code>.</li>
        </ul>
      </section>

      <section id="errores">
        <h2>12. Errors &amp; corrections</h2>
        <p>
          Spot a factual error? Write to{' '}
          <a href="mailto:correcciones@rutasenmx.com">correcciones@rutasenmx.com</a>{' '}
          or use the &ldquo;Report error&rdquo; button on each guide. Our
          commitment:
        </p>
        <ul>
          <li>Acknowledgement within 48 hours.</li>
          <li>Correction published within 7 days for minor issues, 14 for major rewrites.</li>
          <li>Every correction is logged in the <Link href="/correcciones">public changelog</Link> with date and summary.</li>
        </ul>
      </section>

      <section id="independencia">
        <h2>13. Editorial independence</h2>
        <p>
          The Rutas en MX newsroom operates independently from the commercial
          team. Content, ranking and tone decisions belong exclusively to the
          newsroom. Any commercial pressure attempting to influence editorial
          content is documented and shared with the editorial board.
        </p>
      </section>

      <section id="contacto">
        <h2>14. Editorial contact</h2>
        <ul>
          <li><strong>Corrections:</strong> <a href="mailto:correcciones@rutasenmx.com">correcciones@rutasenmx.com</a></li>
          <li><strong>Editor-in-chief:</strong> <a href="mailto:editorial@rutasenmx.com">editorial@rutasenmx.com</a></li>
          <li><strong>Story pitches:</strong> <a href="mailto:pitches@rutasenmx.com">pitches@rutasenmx.com</a></li>
        </ul>
      </section>
    </>
  );
}
