import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { getLocale } from '@/lib/i18n/server';
import { LegalShell, type LegalSection } from '@/components/legal/LegalShell';

const PAGE_PATH = '/privacidad';
const PAGE_TITLE = 'Política de privacidad / Privacy policy';
const PAGE_DESCRIPTION =
  'Cómo Rutas en MX recopila, procesa, almacena y protege tu información personal. Cookies, analítica, derechos ARCO y contacto con el equipo de privacidad.';
const LAST_UPDATED = '2026-04-18';
const EFFECTIVE = '2026-04-18';
const VERSION = 'v2.1';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
  });
}

const SECTIONS_ES: LegalSection[] = [
  { id: 'resumen',             title: 'Resumen ejecutivo' },
  { id: 'responsable',         title: 'Responsable del tratamiento' },
  { id: 'que-recopilamos',     title: 'Qué datos recopilamos' },
  { id: 'finalidades',         title: 'Para qué los usamos' },
  { id: 'bases-legales',       title: 'Bases legales' },
  { id: 'compartimos',         title: 'Con quién los compartimos' },
  { id: 'transferencias',      title: 'Transferencias internacionales' },
  { id: 'cookies',             title: 'Cookies y tecnologías similares' },
  { id: 'conservacion',        title: 'Plazos de conservación' },
  { id: 'seguridad',           title: 'Medidas de seguridad' },
  { id: 'derechos-arco',       title: 'Tus derechos (ARCO y más)' },
  { id: 'menores',             title: 'Menores de edad' },
  { id: 'cambios',             title: 'Cambios a esta política' },
  { id: 'contacto-privacidad', title: 'Contacto de privacidad' },
];

const SECTIONS_EN: LegalSection[] = [
  { id: 'resumen',             title: 'Executive summary' },
  { id: 'responsable',         title: 'Data controller' },
  { id: 'que-recopilamos',     title: 'What data we collect' },
  { id: 'finalidades',         title: 'How we use it' },
  { id: 'bases-legales',       title: 'Legal bases' },
  { id: 'compartimos',         title: 'Who we share it with' },
  { id: 'transferencias',      title: 'International transfers' },
  { id: 'cookies',             title: 'Cookies & similar tech' },
  { id: 'conservacion',        title: 'Retention periods' },
  { id: 'seguridad',           title: 'Security measures' },
  { id: 'derechos-arco',       title: 'Your rights (ARCO & more)' },
  { id: 'menores',             title: 'Children' },
  { id: 'cambios',             title: 'Changes to this policy' },
  { id: 'contacto-privacidad', title: 'Privacy contact' },
];

export default async function PrivacidadPage() {
  const locale = await getLocale();
  const isEn = locale === 'en';
  const breadcrumbs = buildBreadcrumbs([
    { label: isEn ? 'Privacy' : 'Privacidad', href: PAGE_PATH },
  ]);
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  const title = isEn ? 'Privacy policy' : 'Política de privacidad';
  const kicker = isEn ? 'Legal · Privacy' : 'Legal · Privacidad';
  const summary = isEn
    ? 'How we collect, process, store and protect your personal data. This document follows the Mexican LFPDPPP and, when applicable, the EU GDPR.'
    : 'Cómo recopilamos, procesamos, almacenamos y protegemos tu información personal. Este documento se rige por la LFPDPPP mexicana y, cuando aplica, por el GDPR europeo.';

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
        readingMinutes={9}
        isEn={isEn}
        current="privacidad"
        sections={isEn ? SECTIONS_EN : SECTIONS_ES}
      >
        {isEn ? <PrivacyEn /> : <PrivacyEs />}
      </LegalShell>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Spanish                                                            */
/* ------------------------------------------------------------------ */
function PrivacyEs() {
  return (
    <>
      <section id="resumen">
        <h2>1. Resumen ejecutivo</h2>
        <p>
          En <strong>Rutas en MX</strong> tratamos tus datos con el menor alcance posible.
          Puedes usar la plataforma sin registrarte; si creas una cuenta, solamente
          recopilamos lo indispensable para ofrecerte el servicio. Nunca vendemos tu
          información personal.
        </p>
        <ul>
          <li><strong>Qué guardamos:</strong> correo, nombre, viajes guardados y preferencias.</li>
          <li><strong>Qué no hacemos:</strong> venta de datos, perfilado publicitario invasivo.</li>
          <li><strong>Tus derechos:</strong> acceder, rectificar, cancelar, oponerte y portar tus datos en cualquier momento.</li>
          <li><strong>Contacto:</strong> <a href="mailto:legal@rutasenmx.com">legal@rutasenmx.com</a>.</li>
        </ul>
      </section>

      <section id="responsable">
        <h2>2. Responsable del tratamiento</h2>
        <p>
          El responsable de tus datos personales es <strong>Rutas en MX</strong>, con
          domicilio en la Ciudad de México. Puedes contactar al equipo de privacidad
          por correo a <a href="mailto:legal@rutasenmx.com">legal@rutasenmx.com</a> o
          a través de nuestro <Link href="/contacto">formulario de contacto</Link>.
        </p>
      </section>

      <section id="que-recopilamos">
        <h2>3. Qué datos recopilamos</h2>
        <h3>3.1. Datos que tú proporcionas</h3>
        <ul>
          <li><strong>Cuenta:</strong> nombre, correo electrónico, contraseña cifrada.</li>
          <li><strong>Perfil (opcional):</strong> foto, ciudad de origen, preferencias de viaje.</li>
          <li><strong>Contenido creado:</strong> viajes guardados, favoritos, notas y comentarios.</li>
          <li><strong>Pagos:</strong> procesados por Stripe; nosotros sólo conservamos el identificador de la suscripción y los últimos 4 dígitos de la tarjeta.</li>
        </ul>
        <h3>3.2. Datos recopilados automáticamente</h3>
        <ul>
          <li>Dirección IP, tipo de navegador y dispositivo.</li>
          <li>Páginas visitadas, tiempo en sitio y origen de referencia.</li>
          <li>Ubicación aproximada (a nivel ciudad) derivada de la IP.</li>
        </ul>
        <h3>3.3. Datos que no recopilamos</h3>
        <p>
          No recabamos datos sensibles (origen étnico, afiliación política, datos de
          salud). Si deseas activar funciones con ubicación precisa (GPS), te pediremos
          permiso explícito desde el navegador o la app.
        </p>
      </section>

      <section id="finalidades">
        <h2>4. Para qué los usamos</h2>
        <ul>
          <li><strong>Operar el servicio:</strong> autenticación, guardar viajes, personalizar sugerencias.</li>
          <li><strong>Mejorar la plataforma:</strong> analítica agregada de uso y desempeño.</li>
          <li><strong>Comunicación:</strong> correos transaccionales (restablecer contraseña, cobros) y, si lo aceptas, boletín editorial.</li>
          <li><strong>Seguridad:</strong> prevenir fraude, abuso y scraping automatizado.</li>
          <li><strong>Cumplimiento:</strong> atender requerimientos legales vigentes.</li>
        </ul>
      </section>

      <section id="bases-legales">
        <h2>5. Bases legales</h2>
        <p>
          Según la LFPDPPP (México) y el GDPR (UE), tratamos tus datos amparados en:
        </p>
        <ul>
          <li><strong>Ejecución de contrato:</strong> para entregarte el servicio que contratas.</li>
          <li><strong>Interés legítimo:</strong> para operar la plataforma y prevenir fraude.</li>
          <li><strong>Consentimiento:</strong> para cookies no esenciales y boletines opcionales.</li>
          <li><strong>Obligación legal:</strong> cuando una autoridad competente lo requiere.</li>
        </ul>
      </section>

      <section id="compartimos">
        <h2>6. Con quién compartimos tu información</h2>
        <p>Sólo compartimos datos con proveedores que nos ayudan a operar el servicio, bajo contrato y con cláusulas de confidencialidad:</p>
        <ul>
          <li><strong>Stripe</strong> — procesamiento de pagos.</li>
          <li><strong>Amazon Web Services</strong> — hosting e infraestructura.</li>
          <li><strong>Mapbox</strong> — tiles cartográficos.</li>
          <li><strong>Resend / SendGrid</strong> — envío de correos transaccionales.</li>
          <li><strong>Plausible / PostHog</strong> — analítica anónima y agregada.</li>
        </ul>
        <p>No cedemos, vendemos ni alquilamos tu información a terceros con fines comerciales.</p>
      </section>

      <section id="transferencias">
        <h2>7. Transferencias internacionales</h2>
        <p>
          Algunos de nuestros proveedores operan servidores en Estados Unidos y la
          Unión Europea. Estas transferencias se realizan con las salvaguardas
          contractuales estándar (Standard Contractual Clauses o equivalentes) y con
          cifrado en tránsito y en reposo.
        </p>
      </section>

      <section id="cookies">
        <h2>8. Cookies y tecnologías similares</h2>
        <h3>8.1. Tipos</h3>
        <ul>
          <li><strong>Esenciales:</strong> sesión, CSRF, preferencia de idioma. No puedes desactivarlas si quieres usar la plataforma.</li>
          <li><strong>Analíticas:</strong> medición agregada del uso. Puedes desactivarlas en la configuración de cookies.</li>
          <li><strong>Publicitarias:</strong> <strong>no usamos</strong> cookies publicitarias de terceros.</li>
        </ul>
        <h3>8.2. Tu elección</h3>
        <p>
          Puedes administrar tu preferencia desde el banner de cookies al entrar al
          sitio o desde la página de configuración de tu cuenta. Tu elección se
          respeta por 12 meses.
        </p>
      </section>

      <section id="conservacion">
        <h2>9. Plazos de conservación</h2>
        <ul>
          <li><strong>Cuenta activa:</strong> mientras mantengas la cuenta abierta.</li>
          <li><strong>Cuenta cerrada:</strong> eliminamos tus datos personales a los 30 días; las facturas se conservan 5 años por obligación fiscal.</li>
          <li><strong>Logs de seguridad:</strong> 90 días.</li>
          <li><strong>Analítica:</strong> hasta 26 meses en forma agregada.</li>
        </ul>
      </section>

      <section id="seguridad">
        <h2>10. Medidas de seguridad</h2>
        <ul>
          <li>Cifrado TLS 1.3 en todas las comunicaciones.</li>
          <li>Contraseñas almacenadas con bcrypt (cost factor 12).</li>
          <li>Segregación de entornos (producción / staging / desarrollo).</li>
          <li>Auditorías internas trimestrales y control de acceso con principio de mínimo privilegio.</li>
          <li>Respaldos cifrados con retención de 30 días.</li>
        </ul>
        <p>
          En caso de una violación de seguridad que afecte tus datos personales, te
          notificaremos por correo dentro de las 72 horas siguientes a que la
          detectemos, junto con la autoridad competente.
        </p>
      </section>

      <section id="derechos-arco">
        <h2>11. Tus derechos (ARCO y más)</h2>
        <p>Puedes ejercer en cualquier momento los siguientes derechos:</p>
        <ul>
          <li><strong>Acceso:</strong> obtener una copia de tus datos.</li>
          <li><strong>Rectificación:</strong> corregir información inexacta.</li>
          <li><strong>Cancelación:</strong> solicitar la eliminación de tu cuenta.</li>
          <li><strong>Oposición:</strong> oponerte al tratamiento con fines específicos.</li>
          <li><strong>Portabilidad:</strong> recibir tus datos en un formato legible por máquina (JSON).</li>
          <li><strong>Revocación del consentimiento:</strong> retirar tu consentimiento cuando éste sea la base.</li>
        </ul>
        <p>
          Escribe a <a href="mailto:legal@rutasenmx.com">legal@rutasenmx.com</a> con
          el asunto <em>&ldquo;Solicitud ARCO&rdquo;</em>. Respondemos en 20 días
          hábiles como máximo. También puedes presentar queja ante el INAI
          (<a href="https://www.inai.org.mx" target="_blank" rel="noopener noreferrer">inai.org.mx</a>).
        </p>
      </section>

      <section id="menores">
        <h2>12. Menores de edad</h2>
        <p>
          Rutas en MX no está dirigido a menores de 16 años. No recopilamos
          intencionalmente datos de menores. Si eres padre, madre o tutor y
          descubres que tu hijo ha creado una cuenta, contáctanos y la
          eliminaremos.
        </p>
      </section>

      <section id="cambios">
        <h2>13. Cambios a esta política</h2>
        <p>
          Cuando realicemos cambios importantes notificaremos por correo a las
          cuentas activas con al menos 15 días de anticipación. El historial
          completo de versiones se publica en{' '}
          <Link href="/correcciones">/correcciones</Link>.
        </p>
      </section>

      <section id="contacto-privacidad">
        <h2>14. Contacto de privacidad</h2>
        <ul>
          <li><strong>Correo:</strong> <a href="mailto:legal@rutasenmx.com">legal@rutasenmx.com</a></li>
          <li><strong>Formulario:</strong> <Link href="/contacto">/contacto</Link></li>
          <li><strong>Plazo de respuesta:</strong> 10 días hábiles para solicitudes ordinarias, 20 para solicitudes ARCO.</li>
        </ul>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* English                                                            */
/* ------------------------------------------------------------------ */
function PrivacyEn() {
  return (
    <>
      <section id="resumen">
        <h2>1. Executive summary</h2>
        <p>
          At <strong>Rutas en MX</strong> we process your data with the smallest
          footprint possible. You can browse the platform without signing up; if you
          create an account, we only collect what is strictly necessary. We never
          sell your personal information.
        </p>
        <ul>
          <li><strong>What we store:</strong> email, name, saved trips and preferences.</li>
          <li><strong>What we never do:</strong> sell data, run invasive ad profiling.</li>
          <li><strong>Your rights:</strong> access, rectify, cancel, object, and port your data at any time.</li>
          <li><strong>Contact:</strong> <a href="mailto:legal@rutasenmx.com">legal@rutasenmx.com</a>.</li>
        </ul>
      </section>

      <section id="responsable">
        <h2>2. Data controller</h2>
        <p>
          The data controller is <strong>Rutas en MX</strong>, based in Mexico City.
          You can reach the privacy team at{' '}
          <a href="mailto:legal@rutasenmx.com">legal@rutasenmx.com</a> or through our{' '}
          <Link href="/contacto">contact form</Link>.
        </p>
      </section>

      <section id="que-recopilamos">
        <h2>3. What data we collect</h2>
        <h3>3.1. Data you provide</h3>
        <ul>
          <li><strong>Account:</strong> name, email, hashed password.</li>
          <li><strong>Profile (optional):</strong> photo, home city, travel preferences.</li>
          <li><strong>User-generated content:</strong> saved trips, favourites, notes and comments.</li>
          <li><strong>Payments:</strong> handled by Stripe; we only retain the subscription id and the last 4 digits of the card.</li>
        </ul>
        <h3>3.2. Data collected automatically</h3>
        <ul>
          <li>IP address, browser and device type.</li>
          <li>Pages visited, session duration, referrer.</li>
          <li>City-level location derived from IP.</li>
        </ul>
        <h3>3.3. Data we do not collect</h3>
        <p>
          We do not collect sensitive data (ethnic origin, political affiliation,
          health data). If you enable precise location (GPS) features we will ask
          explicit permission through the browser or app.
        </p>
      </section>

      <section id="finalidades">
        <h2>4. How we use it</h2>
        <ul>
          <li><strong>Running the service:</strong> auth, saving trips, personalising suggestions.</li>
          <li><strong>Improving the platform:</strong> aggregate usage and performance analytics.</li>
          <li><strong>Communication:</strong> transactional emails (password reset, receipts) and, if you opt in, the editorial newsletter.</li>
          <li><strong>Security:</strong> preventing fraud, abuse and automated scraping.</li>
          <li><strong>Compliance:</strong> meeting legal obligations when required.</li>
        </ul>
      </section>

      <section id="bases-legales">
        <h2>5. Legal bases</h2>
        <p>Under Mexico&rsquo;s LFPDPPP and the EU&rsquo;s GDPR, we rely on:</p>
        <ul>
          <li><strong>Contract performance</strong> — to deliver the service you contracted.</li>
          <li><strong>Legitimate interest</strong> — to operate the platform and prevent fraud.</li>
          <li><strong>Consent</strong> — for non-essential cookies and optional newsletters.</li>
          <li><strong>Legal obligation</strong> — when required by competent authorities.</li>
        </ul>
      </section>

      <section id="compartimos">
        <h2>6. Who we share your information with</h2>
        <p>We only share data with vendors that help us run the service, under contract and with confidentiality clauses:</p>
        <ul>
          <li><strong>Stripe</strong> — payment processing.</li>
          <li><strong>Amazon Web Services</strong> — hosting and infrastructure.</li>
          <li><strong>Mapbox</strong> — map tiles.</li>
          <li><strong>Resend / SendGrid</strong> — transactional email delivery.</li>
          <li><strong>Plausible / PostHog</strong> — anonymous aggregate analytics.</li>
        </ul>
        <p>We never sell, rent or transfer your information to third parties for commercial purposes.</p>
      </section>

      <section id="transferencias">
        <h2>7. International transfers</h2>
        <p>
          Some vendors operate servers in the United States and the European Union.
          These transfers use Standard Contractual Clauses (or equivalent safeguards)
          along with encryption in transit and at rest.
        </p>
      </section>

      <section id="cookies">
        <h2>8. Cookies &amp; similar technologies</h2>
        <h3>8.1. Types</h3>
        <ul>
          <li><strong>Essential:</strong> session, CSRF, language preference. Required for the service to work.</li>
          <li><strong>Analytics:</strong> aggregate usage metrics. You can disable these in cookie settings.</li>
          <li><strong>Advertising:</strong> we <strong>do not</strong> run third-party advertising cookies.</li>
        </ul>
        <h3>8.2. Your choice</h3>
        <p>
          Manage preferences from the cookie banner on entry or from your account
          settings page. Your choice is honoured for 12 months.
        </p>
      </section>

      <section id="conservacion">
        <h2>9. Retention periods</h2>
        <ul>
          <li><strong>Active account:</strong> kept while the account is open.</li>
          <li><strong>Closed account:</strong> personal data removed within 30 days; invoices are kept 5 years per tax law.</li>
          <li><strong>Security logs:</strong> 90 days.</li>
          <li><strong>Analytics:</strong> up to 26 months, aggregate only.</li>
        </ul>
      </section>

      <section id="seguridad">
        <h2>10. Security measures</h2>
        <ul>
          <li>TLS 1.3 encryption for all traffic.</li>
          <li>Passwords stored with bcrypt (cost factor 12).</li>
          <li>Environment segregation (prod / staging / dev).</li>
          <li>Quarterly internal audits and least-privilege access control.</li>
          <li>Encrypted backups with 30-day retention.</li>
        </ul>
        <p>
          If a breach affects your personal data, we will notify you by email within
          72 hours of detection, alongside the competent authority.
        </p>
      </section>

      <section id="derechos-arco">
        <h2>11. Your rights (ARCO &amp; more)</h2>
        <ul>
          <li><strong>Access</strong> — obtain a copy of your data.</li>
          <li><strong>Rectification</strong> — correct inaccurate information.</li>
          <li><strong>Cancellation</strong> — request account deletion.</li>
          <li><strong>Objection</strong> — object to specific processing.</li>
          <li><strong>Portability</strong> — receive your data in machine-readable form (JSON).</li>
          <li><strong>Consent withdrawal</strong> — revoke consent where it is the legal basis.</li>
        </ul>
        <p>
          Write to <a href="mailto:legal@rutasenmx.com">legal@rutasenmx.com</a> with
          subject <em>&ldquo;ARCO request&rdquo;</em>. We reply within 20 business
          days. You can also file a complaint with INAI
          (<a href="https://www.inai.org.mx" target="_blank" rel="noopener noreferrer">inai.org.mx</a>).
        </p>
      </section>

      <section id="menores">
        <h2>12. Children</h2>
        <p>
          Rutas en MX is not directed to children under 16. We do not knowingly
          collect data from minors. If you are a parent or guardian and discover your
          child has signed up, contact us and we will remove the account.
        </p>
      </section>

      <section id="cambios">
        <h2>13. Changes to this policy</h2>
        <p>
          For material changes we notify active accounts by email at least 15 days in
          advance. The full version history is published at{' '}
          <Link href="/correcciones">/corrections</Link>.
        </p>
      </section>

      <section id="contacto-privacidad">
        <h2>14. Privacy contact</h2>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:legal@rutasenmx.com">legal@rutasenmx.com</a></li>
          <li><strong>Form:</strong> <Link href="/contacto">/contact</Link></li>
          <li><strong>Response window:</strong> 10 business days for general queries, 20 for ARCO requests.</li>
        </ul>
      </section>
    </>
  );
}
