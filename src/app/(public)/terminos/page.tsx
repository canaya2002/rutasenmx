import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { getLocale } from '@/lib/i18n/server';
import { LegalShell, type LegalSection } from '@/components/legal/LegalShell';

const PAGE_PATH = '/terminos';
const PAGE_TITLE = 'Términos de servicio / Terms of service';
const PAGE_DESCRIPTION =
  'Condiciones que rigen el uso de la plataforma Rutas en MX: cuentas, planes, contenido del usuario, propiedad intelectual, responsabilidades y resolución de conflictos.';
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
  { id: 'aceptacion',    title: 'Aceptación de los términos' },
  { id: 'descripcion',   title: 'Descripción del servicio' },
  { id: 'cuentas',       title: 'Cuentas y registro' },
  { id: 'planes',        title: 'Planes y facturación' },
  { id: 'cancelacion',   title: 'Cancelación y reembolsos' },
  { id: 'uso-aceptable', title: 'Uso aceptable' },
  { id: 'contenido',     title: 'Contenido del usuario' },
  { id: 'propiedad',     title: 'Propiedad intelectual' },
  { id: 'terceros',      title: 'Servicios de terceros' },
  { id: 'garantias',     title: 'Descargo de garantías' },
  { id: 'responsabilidad', title: 'Limitación de responsabilidad' },
  { id: 'indemnizacion', title: 'Indemnización' },
  { id: 'terminacion',   title: 'Suspensión y terminación' },
  { id: 'cambios',       title: 'Cambios a los términos' },
  { id: 'ley-aplicable', title: 'Ley aplicable y jurisdicción' },
  { id: 'contacto',      title: 'Contacto' },
];

const SECTIONS_EN: LegalSection[] = [
  { id: 'aceptacion',    title: 'Acceptance of terms' },
  { id: 'descripcion',   title: 'Service description' },
  { id: 'cuentas',       title: 'Accounts & registration' },
  { id: 'planes',        title: 'Plans & billing' },
  { id: 'cancelacion',   title: 'Cancellation & refunds' },
  { id: 'uso-aceptable', title: 'Acceptable use' },
  { id: 'contenido',     title: 'User content' },
  { id: 'propiedad',     title: 'Intellectual property' },
  { id: 'terceros',      title: 'Third-party services' },
  { id: 'garantias',     title: 'Disclaimer of warranties' },
  { id: 'responsabilidad', title: 'Limitation of liability' },
  { id: 'indemnizacion', title: 'Indemnification' },
  { id: 'terminacion',   title: 'Suspension & termination' },
  { id: 'cambios',       title: 'Changes to the terms' },
  { id: 'ley-aplicable', title: 'Governing law & jurisdiction' },
  { id: 'contacto',      title: 'Contact' },
];

export default async function TerminosPage() {
  const locale = await getLocale();
  const isEn = locale === 'en';
  const breadcrumbs = buildBreadcrumbs([
    { label: isEn ? 'Terms of service' : 'Términos de servicio', href: PAGE_PATH },
  ]);
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  const title = isEn ? 'Terms of service' : 'Términos de servicio';
  const kicker = isEn ? 'Legal · Terms' : 'Legal · Términos';
  const summary = isEn
    ? 'The rules that govern your use of Rutas en MX: accounts, paid plans, user content, intellectual property and how we resolve disputes.'
    : 'Las reglas que rigen tu uso de Rutas en MX: cuentas, planes de pago, contenido del usuario, propiedad intelectual y resolución de conflictos.';

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
        readingMinutes={11}
        isEn={isEn}
        current="terminos"
        sections={isEn ? SECTIONS_EN : SECTIONS_ES}
      >
        {isEn ? <TermsEn /> : <TermsEs />}
      </LegalShell>
    </>
  );
}

function TermsEs() {
  return (
    <>
      <section id="aceptacion">
        <h2>1. Aceptación de los términos</h2>
        <p>
          Al crear una cuenta o utilizar cualquier parte del sitio{' '}
          <strong>rutasenmx.com</strong> aceptas estos Términos de Servicio
          (&ldquo;Términos&rdquo;) y nuestra{' '}
          <Link href="/privacidad">Política de privacidad</Link>. Si no estás de
          acuerdo, no utilices la plataforma.
        </p>
      </section>

      <section id="descripcion">
        <h2>2. Descripción del servicio</h2>
        <p>
          Rutas en MX es una plataforma editorial e interactiva para descubrir y
          planear viajes por carretera en México. Ofrece:
        </p>
        <ul>
          <li>Catálogos de Pueblos Mágicos, museos, zonas arqueológicas y otros puntos de interés.</li>
          <li>Rutas curadas, guías editoriales y un planificador con IA.</li>
          <li>Mapas interactivos, exportación de itinerarios y colaboración entre viajeros.</li>
        </ul>
      </section>

      <section id="cuentas">
        <h2>3. Cuentas y registro</h2>
        <ul>
          <li>Debes tener al menos <strong>16 años</strong> para crear una cuenta.</li>
          <li>Eres responsable de mantener la confidencialidad de tu contraseña.</li>
          <li>Sólo puedes crear una cuenta personal; cada cuenta es intransferible.</li>
          <li>Debes proporcionar información verídica y mantenerla actualizada.</li>
        </ul>
      </section>

      <section id="planes">
        <h2>4. Planes y facturación</h2>
        <h3>4.1. Planes disponibles</h3>
        <p>
          Ofrecemos un plan gratuito y planes de pago (Basic, Pro, Premium) cuyos
          precios y beneficios se detallan en{' '}
          <Link href="/precios">/precios</Link>. Los precios están expresados en
          pesos mexicanos (MXN) o dólares estadounidenses (USD), según tu país.
        </p>
        <h3>4.2. Facturación</h3>
        <ul>
          <li>Los pagos se procesan mediante <strong>Stripe</strong>.</li>
          <li>La suscripción se renueva automáticamente al final de cada ciclo salvo que la canceles.</li>
          <li>Podemos modificar los precios con al menos 30 días de aviso por correo.</li>
          <li>Los impuestos aplicables (IVA, etc.) se añaden al momento del cobro.</li>
        </ul>
      </section>

      <section id="cancelacion">
        <h2>5. Cancelación y reembolsos</h2>
        <ul>
          <li>Puedes cancelar tu suscripción en cualquier momento desde <Link href="/suscripcion">/suscripcion</Link>; conservarás las funciones pagadas hasta el final del ciclo vigente.</li>
          <li>Ofrecemos reembolso completo dentro de los primeros <strong>14 días</strong> de un nuevo cargo, siempre que no hayas exportado itinerarios o descargado archivos premium.</li>
          <li>No hay reembolsos prorrateados por ciclos ya transcurridos.</li>
        </ul>
      </section>

      <section id="uso-aceptable">
        <h2>6. Uso aceptable</h2>
        <p>No puedes usar la plataforma para:</p>
        <ul>
          <li>Realizar scraping automatizado, ingeniería inversa o redistribuir el contenido sin licencia.</li>
          <li>Subir contenido ilegal, difamatorio, discriminatorio, violento o sexualmente explícito.</li>
          <li>Hacerte pasar por otra persona, empresa o funcionario.</li>
          <li>Intentar vulnerar la seguridad de la plataforma o acceder a datos ajenos.</li>
          <li>Usar el servicio para spam, phishing o cualquier actividad fraudulenta.</li>
        </ul>
      </section>

      <section id="contenido">
        <h2>7. Contenido del usuario</h2>
        <p>
          Tú conservas la propiedad sobre el contenido que subes (viajes, reseñas,
          fotos). Al publicarlo, nos otorgas una licencia mundial, no exclusiva,
          libre de regalías para mostrarlo, reproducirlo y adaptarlo dentro de la
          plataforma. Esta licencia termina cuando eliminas el contenido, salvo
          copias en respaldos por hasta 30 días.
        </p>
        <p>
          Nos reservamos el derecho de revisar y eliminar contenido que viole estos
          Términos, nuestra <Link href="/politica-editorial">Política editorial</Link>{' '}
          o cualquier ley aplicable.
        </p>
      </section>

      <section id="propiedad">
        <h2>8. Propiedad intelectual</h2>
        <ul>
          <li>La marca, el logo, el diseño y el código son propiedad de Rutas en MX.</li>
          <li>Las guías editoriales están licenciadas bajo <strong>CC BY-NC 4.0</strong> (atribución, no comercial).</li>
          <li>Los datos oficiales de SECTUR, INAH y SIC Cultura se usan bajo sus licencias abiertas respectivas; ver <Link href="/fuentes-de-datos">fuentes de datos</Link>.</li>
          <li>Las fotografías con créditos de autor conservan los derechos de sus autores.</li>
        </ul>
      </section>

      <section id="terceros">
        <h2>9. Servicios de terceros</h2>
        <p>
          La plataforma integra servicios de Stripe, Mapbox, Amazon Web Services,
          Google Maps (enlaces profundos) y otros. Al utilizarlos aceptas también
          sus términos. No somos responsables del contenido ni del desempeño de
          dichos servicios externos.
        </p>
      </section>

      <section id="garantias">
        <h2>10. Descargo de garantías</h2>
        <p>
          El servicio se provee <strong>&ldquo;tal cual&rdquo; y &ldquo;según
          disponibilidad&rdquo;</strong>. Hacemos esfuerzos razonables por
          mantener la información precisa y actualizada, pero no garantizamos:
        </p>
        <ul>
          <li>Que los lugares estén abiertos a una hora específica.</li>
          <li>Que los precios mostrados (casetas, gasolina, entradas) sean exactos.</li>
          <li>Que las rutas estén libres de obstáculos, cierres o condiciones climáticas adversas.</li>
        </ul>
        <p>Siempre verifica con la fuente oficial antes de iniciar un viaje.</p>
      </section>

      <section id="responsabilidad">
        <h2>11. Limitación de responsabilidad</h2>
        <p>
          En la medida máxima permitida por la ley, Rutas en MX no será responsable
          por daños indirectos, incidentales, consecuentes o punitivos, incluidos
          pero no limitados a pérdida de datos, ingresos, utilidades o
          oportunidades.
        </p>
        <p>
          Nuestra responsabilidad total agregada no excederá el monto que hayas
          pagado en los <strong>12 meses</strong> anteriores al evento que dio
          lugar al reclamo.
        </p>
      </section>

      <section id="indemnizacion">
        <h2>12. Indemnización</h2>
        <p>
          Aceptas indemnizar y mantener libre de reclamos a Rutas en MX, sus
          directivos, empleados y afiliados, por cualquier acción derivada de (i)
          tu uso indebido del servicio, (ii) el contenido que subes o (iii) tu
          incumplimiento de estos Términos.
        </p>
      </section>

      <section id="terminacion">
        <h2>13. Suspensión y terminación</h2>
        <p>Podemos suspender o terminar tu cuenta, previa notificación razonable cuando sea posible, si:</p>
        <ul>
          <li>Incumples estos Términos o la política de uso aceptable.</li>
          <li>Detectamos actividad fraudulenta, abusiva o ilegal.</li>
          <li>Lo requiere una autoridad competente.</li>
        </ul>
        <p>
          Puedes cerrar tu cuenta en cualquier momento desde la configuración del
          perfil. Al cerrarla se aplican los plazos de retención descritos en la
          Política de privacidad.
        </p>
      </section>

      <section id="cambios">
        <h2>14. Cambios a los términos</h2>
        <p>
          Podemos actualizar estos Términos. Los cambios materiales se notifican por
          correo con al menos <strong>30 días</strong> de anticipación y el
          historial completo se publica en{' '}
          <Link href="/correcciones">/correcciones</Link>. El uso continuado tras la
          fecha de vigencia implica aceptación.
        </p>
      </section>

      <section id="ley-aplicable">
        <h2>15. Ley aplicable y jurisdicción</h2>
        <p>
          Estos Términos se rigen por las leyes de los <strong>Estados Unidos
          Mexicanos</strong>. Cualquier controversia se someterá a los tribunales
          competentes de la <strong>Ciudad de México</strong>, renunciando
          expresamente a cualquier otra jurisdicción que pudiera corresponder.
        </p>
      </section>

      <section id="contacto">
        <h2>16. Contacto</h2>
        <ul>
          <li><strong>Correo:</strong> <a href="mailto:legal@rutasenmx.com">legal@rutasenmx.com</a></li>
          <li><strong>Formulario:</strong> <Link href="/contacto">/contacto</Link></li>
        </ul>
      </section>
    </>
  );
}

function TermsEn() {
  return (
    <>
      <section id="aceptacion">
        <h2>1. Acceptance of terms</h2>
        <p>
          By creating an account or using any part of <strong>rutasenmx.com</strong>{' '}
          you agree to these Terms of Service and our{' '}
          <Link href="/privacidad">Privacy Policy</Link>. If you do not agree, do
          not use the platform.
        </p>
      </section>

      <section id="descripcion">
        <h2>2. Service description</h2>
        <p>Rutas en MX is an editorial and interactive platform to discover and plan road trips across Mexico. It offers:</p>
        <ul>
          <li>Catalogues of Pueblos Mágicos, museums, archaeological zones and other points of interest.</li>
          <li>Curated routes, editorial guides and an AI planner.</li>
          <li>Interactive maps, itinerary exports and collaboration between travellers.</li>
        </ul>
      </section>

      <section id="cuentas">
        <h2>3. Accounts &amp; registration</h2>
        <ul>
          <li>You must be at least <strong>16 years old</strong> to open an account.</li>
          <li>You are responsible for keeping your password confidential.</li>
          <li>One personal account only; accounts are non-transferable.</li>
          <li>You must provide truthful information and keep it up to date.</li>
        </ul>
      </section>

      <section id="planes">
        <h2>4. Plans &amp; billing</h2>
        <h3>4.1. Available plans</h3>
        <p>
          We offer a free plan and paid plans (Basic, Pro, Premium). Prices and
          benefits are listed at <Link href="/precios">/pricing</Link>. Prices are
          shown in Mexican pesos (MXN) or US dollars (USD) based on your country.
        </p>
        <h3>4.2. Billing</h3>
        <ul>
          <li>Payments are processed through <strong>Stripe</strong>.</li>
          <li>Subscriptions renew automatically at the end of each cycle unless you cancel.</li>
          <li>We may change prices with at least 30 days&rsquo; email notice.</li>
          <li>Applicable taxes (VAT, etc.) are added at checkout.</li>
        </ul>
      </section>

      <section id="cancelacion">
        <h2>5. Cancellation &amp; refunds</h2>
        <ul>
          <li>Cancel anytime from <Link href="/suscripcion">/subscription</Link>; you keep paid features until the end of the current cycle.</li>
          <li>Full refund available within the first <strong>14 days</strong> of a new charge, provided you have not exported itineraries or downloaded premium files.</li>
          <li>No pro-rated refunds for elapsed cycles.</li>
        </ul>
      </section>

      <section id="uso-aceptable">
        <h2>6. Acceptable use</h2>
        <p>You may not use the platform to:</p>
        <ul>
          <li>Perform automated scraping, reverse engineering or redistribute content without a licence.</li>
          <li>Upload illegal, defamatory, discriminatory, violent or sexually explicit content.</li>
          <li>Impersonate any person, company or official.</li>
          <li>Attempt to breach platform security or access other users&rsquo; data.</li>
          <li>Use the service for spam, phishing or any fraudulent activity.</li>
        </ul>
      </section>

      <section id="contenido">
        <h2>7. User content</h2>
        <p>
          You retain ownership of the content you upload (trips, reviews, photos).
          By posting, you grant us a worldwide, non-exclusive, royalty-free licence
          to display, reproduce and adapt it on the platform. This licence ends
          when you delete the content, except for backup copies kept for up to 30
          days.
        </p>
        <p>
          We reserve the right to review and remove content that violates these
          Terms, our <Link href="/politica-editorial">Editorial Policy</Link> or any
          applicable law.
        </p>
      </section>

      <section id="propiedad">
        <h2>8. Intellectual property</h2>
        <ul>
          <li>Brand, logo, design and code are owned by Rutas en MX.</li>
          <li>Editorial guides are licensed under <strong>CC BY-NC 4.0</strong> (attribution, non-commercial).</li>
          <li>Official SECTUR, INAH and SIC Cultura data is used under their respective open licences; see <Link href="/fuentes-de-datos">data sources</Link>.</li>
          <li>Photographs credited to their authors retain those authors&rsquo; rights.</li>
        </ul>
      </section>

      <section id="terceros">
        <h2>9. Third-party services</h2>
        <p>
          The platform integrates services from Stripe, Mapbox, Amazon Web Services,
          Google Maps (deep links) and others. Using them implies accepting their
          own terms. We are not responsible for the content or performance of such
          third-party services.
        </p>
      </section>

      <section id="garantias">
        <h2>10. Disclaimer of warranties</h2>
        <p>
          The service is provided <strong>&ldquo;as is&rdquo; and &ldquo;as available&rdquo;</strong>.
          We make reasonable efforts to keep the information accurate and
          up-to-date, but we do not warrant that:
        </p>
        <ul>
          <li>Places are open at a given time.</li>
          <li>Displayed prices (tolls, fuel, entrance fees) are exact.</li>
          <li>Routes are free of obstacles, closures or adverse weather.</li>
        </ul>
        <p>Always check with the official source before departing.</p>
      </section>

      <section id="responsabilidad">
        <h2>11. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, Rutas en MX is not liable for
          indirect, incidental, consequential or punitive damages, including loss
          of data, revenue, profit or opportunity.
        </p>
        <p>
          Our total aggregate liability will not exceed the amount you have paid in
          the <strong>12 months</strong> prior to the event giving rise to the
          claim.
        </p>
      </section>

      <section id="indemnizacion">
        <h2>12. Indemnification</h2>
        <p>
          You agree to indemnify and hold Rutas en MX, its officers, employees and
          affiliates harmless from any claim arising out of (i) misuse of the
          service, (ii) content you upload, or (iii) your breach of these Terms.
        </p>
      </section>

      <section id="terminacion">
        <h2>13. Suspension &amp; termination</h2>
        <p>We may suspend or terminate your account, with reasonable notice when possible, if:</p>
        <ul>
          <li>You breach these Terms or the acceptable-use policy.</li>
          <li>We detect fraudulent, abusive or illegal activity.</li>
          <li>A competent authority requires it.</li>
        </ul>
        <p>
          You can close your account any time from profile settings. Retention
          windows described in the Privacy Policy apply afterwards.
        </p>
      </section>

      <section id="cambios">
        <h2>14. Changes to the terms</h2>
        <p>
          We may update these Terms. Material changes are notified by email at
          least <strong>30 days</strong> in advance and the full history is
          published at <Link href="/correcciones">/corrections</Link>. Continued
          use after the effective date constitutes acceptance.
        </p>
      </section>

      <section id="ley-aplicable">
        <h2>15. Governing law &amp; jurisdiction</h2>
        <p>
          These Terms are governed by the laws of the <strong>United Mexican
          States</strong>. Any dispute will be submitted to the competent courts
          of <strong>Mexico City</strong>, expressly waiving any other
          jurisdiction that may apply.
        </p>
      </section>

      <section id="contacto">
        <h2>16. Contact</h2>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:legal@rutasenmx.com">legal@rutasenmx.com</a></li>
          <li><strong>Form:</strong> <Link href="/contacto">/contact</Link></li>
        </ul>
      </section>
    </>
  );
}
