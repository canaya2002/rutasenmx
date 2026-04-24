import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { getLocale } from '@/lib/i18n/server';
import { LegalShell, type LegalSection } from '@/components/legal/LegalShell';
import { LEGAL_ENTITY } from '@/lib/legal/entity';

const PAGE_PATH = '/terminos';
const PAGE_TITLE = 'Términos y Condiciones de Uso / Terms of service';
const PAGE_DESCRIPTION =
  'Términos y Condiciones de Uso de Rutas en MX conforme a la Ley Federal de Protección al Consumidor, el Código de Comercio y las directrices de App Store y Google Play. Suscripciones auto-renovables, contenido del usuario, propiedad intelectual y resolución de conflictos.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
  });
}

const SECTIONS_ES: LegalSection[] = [
  { id: 'aceptacion',        title: '1. Aceptación' },
  { id: 'definiciones',      title: '2. Definiciones' },
  { id: 'servicio',          title: '3. Descripción del servicio' },
  { id: 'elegibilidad',      title: '4. Elegibilidad y registro' },
  { id: 'cuentas',           title: '5. Cuentas y seguridad' },
  { id: 'planes',            title: '6. Planes de suscripción y precios' },
  { id: 'auto-renovacion',   title: '7. Auto-renovación y cancelación' },
  { id: 'reembolsos',        title: '8. Reembolsos y garantías' },
  { id: 'iap',               title: '9. Compras dentro de la app móvil (IAP)' },
  { id: 'anti-doble-cobro',  title: '10. Protección anti-doble-cobro' },
  { id: 'uso-aceptable',     title: '11. Uso aceptable' },
  { id: 'ugc',               title: '12. Contenido del usuario y moderación' },
  { id: 'propiedad',         title: '13. Propiedad intelectual' },
  { id: 'ia',                title: '14. Función Autopilot (IA)' },
  { id: 'terceros',          title: '15. Servicios de terceros' },
  { id: 'disponibilidad',    title: '16. Disponibilidad y exactitud' },
  { id: 'responsabilidad',   title: '17. Limitación de responsabilidad' },
  { id: 'indemnizacion',     title: '18. Indemnización' },
  { id: 'terminacion',       title: '19. Suspensión y terminación' },
  { id: 'cambios',           title: '20. Cambios a los Términos' },
  { id: 'profeco',           title: '21. Protección al consumidor' },
  { id: 'ley',               title: '22. Ley aplicable y jurisdicción' },
  { id: 'contacto',          title: '23. Contacto' },
];

const SECTIONS_EN: LegalSection[] = [
  { id: 'aceptacion',        title: '1. Acceptance' },
  { id: 'definiciones',      title: '2. Definitions' },
  { id: 'servicio',          title: '3. Service description' },
  { id: 'elegibilidad',      title: '4. Eligibility & registration' },
  { id: 'cuentas',           title: '5. Accounts & security' },
  { id: 'planes',            title: '6. Plans & pricing' },
  { id: 'auto-renovacion',   title: '7. Auto-renewal & cancellation' },
  { id: 'reembolsos',        title: '8. Refunds & warranties' },
  { id: 'iap',               title: '9. In-app purchases (mobile)' },
  { id: 'anti-doble-cobro',  title: '10. Anti-double-billing' },
  { id: 'uso-aceptable',     title: '11. Acceptable use' },
  { id: 'ugc',               title: '12. User content & moderation' },
  { id: 'propiedad',         title: '13. Intellectual property' },
  { id: 'ia',                title: '14. Autopilot AI feature' },
  { id: 'terceros',          title: '15. Third-party services' },
  { id: 'disponibilidad',    title: '16. Availability & accuracy' },
  { id: 'responsabilidad',   title: '17. Limitation of liability' },
  { id: 'indemnizacion',     title: '18. Indemnification' },
  { id: 'terminacion',       title: '19. Suspension & termination' },
  { id: 'cambios',           title: '20. Changes' },
  { id: 'profeco',           title: '21. Consumer protection' },
  { id: 'ley',               title: '22. Governing law & jurisdiction' },
  { id: 'contacto',          title: '23. Contact' },
];

export default async function TerminosPage() {
  const locale = await getLocale();
  const isEn = locale === 'en';
  const breadcrumbs = buildBreadcrumbs([
    { label: isEn ? 'Terms of service' : 'Términos y Condiciones', href: PAGE_PATH },
  ]);
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  const title = isEn ? 'Terms of service' : 'Términos y Condiciones de Uso';
  const kicker = isEn ? 'Legal · Terms' : 'Legal · Términos';
  const summary = isEn
    ? `Terms governing your use of ${LEGAL_ENTITY.tradeName}: accounts, subscriptions, user content, IP and dispute resolution.`
    : `Contrato de adhesión que rige tu uso de ${LEGAL_ENTITY.tradeName}: cuentas, planes de pago, contenido del usuario, propiedad intelectual y resolución de conflictos.`;

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <LegalShell
        title={title}
        kicker={kicker}
        summary={summary}
        lastUpdated={LEGAL_ENTITY.lastUpdated}
        effectiveDate={LEGAL_ENTITY.lastUpdated}
        version={LEGAL_ENTITY.version}
        readingMinutes={16}
        isEn={isEn}
        current="terminos"
        sections={isEn ? SECTIONS_EN : SECTIONS_ES}
      >
        {isEn ? <TermsEn /> : <TermsEs />}
      </LegalShell>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Español — Términos y Condiciones (LFPC + Código Comercio + Apple/Google) */
/* ─────────────────────────────────────────────────────────────────── */
function TermsEs() {
  return (
    <>
      <section id="aceptacion">
        <h2>1. Aceptación de los términos</h2>
        <p>
          Los presentes Términos y Condiciones de Uso (&ldquo;Términos&rdquo;)
          constituyen un contrato de adhesión entre{' '}
          <strong>{LEGAL_ENTITY.legalName}</strong>, con domicilio en{' '}
          {LEGAL_ENTITY.address} y RFC {LEGAL_ENTITY.rfc}
          (&ldquo;{LEGAL_ENTITY.tradeName}&rdquo;, &ldquo;nosotros&rdquo;), y
          tú, persona física usuaria de la plataforma (&ldquo;Usuario&rdquo;,
          &ldquo;tú&rdquo;).
        </p>
        <p>
          Al crear una cuenta, completar una compra o utilizar cualquier parte
          del sitio <strong>{LEGAL_ENTITY.domain}</strong> o la aplicación
          móvil <strong>Rutas en MX</strong>, manifiestas haber leído,
          entendido y aceptado estos Términos y el{' '}
          <Link href="/privacidad">Aviso de Privacidad</Link>. Si no estás de
          acuerdo, no utilices la plataforma.
        </p>
      </section>

      <section id="definiciones">
        <h2>2. Definiciones</h2>
        <ul>
          <li><strong>Plataforma:</strong> el sitio web {LEGAL_ENTITY.domain}, la aplicación móvil para iOS y Android, así como las APIs y servicios relacionados.</li>
          <li><strong>Usuario Free:</strong> quien accede a las funcionalidades gratuitas sin suscripción de pago.</li>
          <li><strong>Usuario Pro / Premium:</strong> quien cuenta con una suscripción activa que le otorga acceso a funcionalidades adicionales.</li>
          <li><strong>Contenido de Usuario:</strong> cualquier información que tú publicas o subes: viajes, notas, fotos, comentarios, mensajes.</li>
          <li><strong>Contenido Editorial:</strong> guías, rutas curadas, datos de lugares y otro material producido o licenciado por nosotros.</li>
          <li><strong>IAP:</strong> compras dentro de la aplicación móvil procesadas por Apple App Store o Google Play.</li>
          <li><strong>LFPC:</strong> Ley Federal de Protección al Consumidor.</li>
        </ul>
      </section>

      <section id="servicio">
        <h2>3. Descripción del servicio</h2>
        <p>
          Rutas en MX es una plataforma editorial e interactiva para
          descubrir, planear y compartir viajes por carretera en México.
          Incluye, enunciativa y no limitativamente:
        </p>
        <ul>
          <li>Catálogos de Pueblos Mágicos, museos, zonas arqueológicas, playas, cenotes, haciendas y centros históricos.</li>
          <li>Rutas curadas editorialmente y guías de viaje.</li>
          <li>Planificador con inteligencia artificial (&ldquo;Autopilot&rdquo;).</li>
          <li>Mapas interactivos y exportación de itinerarios en PDF.</li>
          <li>Sección social opcional (&ldquo;Conectar&rdquo;) con perfiles, matches y mensajes privados entre viajeros.</li>
          <li>Comunidades (foros temáticos) con publicaciones y comentarios.</li>
          <li>Notificaciones push cuando instalas la aplicación móvil.</li>
        </ul>
        <p>
          La plataforma es un servicio <strong>informativo y de
          planeación</strong>. No somos agencia de viajes, no operamos
          transportes, no vendemos boletos y no celebramos contratos de
          hospedaje en nombre de terceros.
        </p>
      </section>

      <section id="elegibilidad">
        <h2>4. Elegibilidad y registro</h2>
        <ul>
          <li>Debes tener al menos <strong>13 años</strong> para crear una cuenta con funciones básicas. Entre 13 y 17 años requieres el consentimiento de quien ejerza la patria potestad o tutela.</li>
          <li>La sección social &ldquo;Conectar&rdquo; está disponible únicamente a partir de los <strong>18 años</strong>.</li>
          <li>Al registrarte declaras que la información que nos proporcionas es verdadera, actual y completa.</li>
          <li>No puedes crear una cuenta si las autoridades mexicanas te han prohibido recibir servicios de comercio electrónico.</li>
        </ul>
      </section>

      <section id="cuentas">
        <h2>5. Cuentas y seguridad</h2>
        <ul>
          <li>Cada Usuario puede mantener <strong>una sola cuenta personal</strong>, intransferible.</li>
          <li>Eres responsable de mantener la confidencialidad de tu contraseña y del uso que se haga de tu cuenta.</li>
          <li>Debes notificarnos inmediatamente en {LEGAL_ENTITY.supportEmail} si detectas un acceso no autorizado.</li>
          <li>Podemos exigirte autenticación en dos factores cuando detectemos actividad sospechosa.</li>
          <li>Puedes cerrar tu cuenta en cualquier momento desde <Link href="/perfil">/perfil → Zona peligrosa</Link> o desde la app móvil en Perfil → Eliminar cuenta.</li>
        </ul>
      </section>

      <section id="planes">
        <h2>6. Planes de suscripción y precios</h2>

        <h3>6.1. Planes disponibles</h3>
        <p>
          Ofrecemos un plan <strong>Free</strong> (gratuito) y planes de pago{' '}
          <strong>Pro</strong> y <strong>Premium</strong>. Las funcionalidades
          de cada plan y los precios vigentes se publican en{' '}
          <Link href="/precios">rutasenmx.com/precios</Link> y en la pantalla
          de &ldquo;Suscripción&rdquo; de la aplicación móvil. Al momento de
          contratar, el precio final — incluyendo los impuestos aplicables
          conforme a la Ley del Impuesto al Valor Agregado — se muestra de
          manera clara antes del cargo, cumpliendo el artículo 77 de la LFPC y
          las Disposiciones Generales para comercio electrónico.
        </p>

        <h3>6.2. Duración del ciclo</h3>
        <ul>
          <li><strong>Mensual:</strong> 30 días naturales contados a partir del cargo.</li>
          <li><strong>Anual:</strong> 365 días naturales.</li>
        </ul>

        <h3>6.3. Moneda y medios de pago</h3>
        <ul>
          <li>Los precios se expresan en Pesos Mexicanos (MXN) para usuarios en México y en Dólares Estadounidenses (USD) para el resto del mundo, según configures tu país.</li>
          <li>Aceptamos pagos en la web a través de Stripe: tarjetas de crédito/débito Visa, Mastercard, American Express, así como OXXO y SPEI (transferencia).</li>
          <li>En la app móvil los pagos se procesan exclusivamente a través de Apple App Store (iOS) o Google Play (Android) mediante IAP.</li>
        </ul>
      </section>

      <section id="auto-renovacion">
        <h2>7. Auto-renovación y cancelación</h2>

        <h3>7.1. Aviso expreso (Apple 3.1.2 / Google Play policy)</h3>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
          <strong>
            Las suscripciones de Rutas en MX se renuevan automáticamente al
            final de cada ciclo a menos que las canceles al menos 24 horas
            antes del siguiente periodo.
          </strong>{' '}
          El monto de la renovación se cobrará al mismo medio de pago usado
          originalmente. Puedes consultar el precio de renovación, la fecha
          de próximo cobro y cancelar en cualquier momento desde:
        </p>
        <ul>
          <li><strong>Web:</strong> <Link href="/suscripcion">rutasenmx.com/suscripcion</Link> → &ldquo;Gestionar en Stripe&rdquo; (Customer Portal).</li>
          <li><strong>iOS:</strong> Ajustes → tu Apple ID → Suscripciones → Rutas en MX.</li>
          <li><strong>Android:</strong> Google Play → Menú → Pagos y suscripciones → Suscripciones → Rutas en MX.</li>
        </ul>

        <h3>7.2. Efectos de la cancelación</h3>
        <ul>
          <li>Conservas el acceso a las funciones de pago hasta el final del ciclo ya pagado.</li>
          <li>No se realizan cargos posteriores.</li>
          <li>Después de la fecha de expiración regresas automáticamente al plan Free.</li>
          <li>Tus datos, viajes guardados y contenido se conservan según la <Link href="/privacidad">Política de privacidad</Link>.</li>
        </ul>

        <h3>7.3. Cambios de precio</h3>
        <p>
          Podemos modificar los precios. Te notificaremos con al menos{' '}
          <strong>30 días</strong> de anticipación al correo registrado; el
          nuevo precio aplicará a partir del siguiente ciclo de renovación. Si
          no aceptas el nuevo precio, cancela antes de la fecha efectiva — no
          se te renovará al precio nuevo.
        </p>
      </section>

      <section id="reembolsos">
        <h2>8. Reembolsos y garantías</h2>

        <h3>8.1. Reembolsos (compras vía web — Stripe)</h3>
        <ul>
          <li>Ofrecemos <strong>reembolso completo</strong> de un cargo nuevo de suscripción dentro de los <strong>14 días naturales</strong> siguientes al cobro, siempre que el Usuario no haya (i) exportado más de 3 itinerarios en PDF sin marca de agua ni (ii) ejecutado más de 5 corridas del modelo de IA en el periodo.</li>
          <li>No ofrecemos reembolso prorrateado por ciclos ya transcurridos.</li>
          <li>Para solicitar un reembolso: <a href={`mailto:${LEGAL_ENTITY.supportEmail}`}>{LEGAL_ENTITY.supportEmail}</a> asunto &ldquo;Reembolso&rdquo; con el número de recibo.</li>
          <li>El reembolso se procesa en el mismo método de pago en un plazo de 5 a 10 días hábiles dependiendo de tu emisor.</li>
        </ul>

        <h3>8.2. Reembolsos (compras vía app móvil — Apple / Google)</h3>
        <p>
          Los reembolsos de compras In-App son gestionados por la tienda
          correspondiente, no por nosotros:
        </p>
        <ul>
          <li><strong>iOS:</strong> <a href="https://reportaproblem.apple.com" target="_blank" rel="noopener noreferrer">reportaproblem.apple.com</a> — Apple decide el reembolso.</li>
          <li><strong>Android:</strong> <a href="https://play.google.com/store/account/orderhistory" target="_blank" rel="noopener noreferrer">Historial de pedidos de Google Play</a>.</li>
        </ul>
        <p>
          Haremos lo posible por acompañarte en el proceso si nos escribes,
          pero la decisión final corresponde a Apple o Google.
        </p>

        <h3>8.3. Garantía implícita</h3>
        <p>
          Sin perjuicio de lo anterior, mantenemos las obligaciones de
          saneamiento y garantías implícitas conforme al Código Civil Federal
          y la LFPC cuando éstas resulten aplicables.
        </p>
      </section>

      <section id="iap">
        <h2>9. Compras dentro de la aplicación móvil (IAP)</h2>
        <p>
          Cuando te suscribes desde la aplicación móvil, la transacción se
          celebra directamente entre tú y Apple Inc. (iOS) o Google LLC
          (Android). Nosotros recibimos el neto después de las comisiones de
          la tienda (típicamente 15-30%).
        </p>
        <ul>
          <li>Los términos de la transacción de IAP son los de la tienda correspondiente. Estos Términos regulan el uso de la plataforma pero no sustituyen el contrato que celebras con Apple o Google.</li>
          <li>Al contratar mediante IAP autorizas a la tienda a cobrar la cantidad correspondiente en tu método de pago registrado.</li>
          <li>Tu cuenta de Apple o Google debe estar activa y en buen estado. Los cargos pueden presentarse con el nombre de Apple Inc. o Google LLC en tu estado de cuenta.</li>
        </ul>
      </section>

      <section id="anti-doble-cobro">
        <h2>10. Protección anti-doble-cobro</h2>
        <p>
          Para evitar que un mismo usuario pague dos veces por la misma
          suscripción, la plataforma aplica las siguientes reglas
          automáticamente:
        </p>
        <ul>
          <li>Si tienes una suscripción activa en la web (Stripe), el botón de compra IAP en la app móvil se deshabilita y mostramos un aviso indicándote que gestiones tu plan desde rutasenmx.com.</li>
          <li>Si tienes una suscripción activa en IAP (Apple o Google), el flujo de checkout web devuelve un error 409 con mensaje claro indicándote que ya cuentas con una suscripción activa en mobile.</li>
          <li>Si detectamos un doble cobro involuntario (p. ej. por un desfase entre webhooks), reembolsamos el cargo más reciente sin necesidad de solicitarlo — bastará con que nos avises.</li>
        </ul>
      </section>

      <section id="uso-aceptable">
        <h2>11. Uso aceptable</h2>
        <p>Al usar la plataforma te obligas a NO:</p>
        <ul>
          <li>Realizar scraping automatizado, crawling masivo o ingeniería inversa del software.</li>
          <li>Redistribuir, sublicenciar o comercializar el contenido editorial sin autorización escrita.</li>
          <li>Publicar contenido ilegal, difamatorio, discriminatorio, violento, sexualmente explícito, que promueva la venta de sustancias controladas o que incite al odio.</li>
          <li>Hacerte pasar por otra persona, empresa, funcionario público, autoridad o representante de Rutas en MX.</li>
          <li>Intentar vulnerar la seguridad de la plataforma, acceder a datos de otros usuarios sin autorización, introducir código malicioso o explotar vulnerabilidades.</li>
          <li>Usar el servicio para spam, phishing, esquemas de pirámide o cualquier actividad fraudulenta.</li>
          <li>Recopilar información de otros usuarios con fines comerciales sin su consentimiento expreso (p. ej. venta de leads).</li>
          <li>Infringir derechos de propiedad intelectual de terceros al subir fotografías, textos u otro contenido.</li>
          <li>Utilizar la sección &ldquo;Conectar&rdquo; para propósitos comerciales, coerción, acoso o explotación sexual.</li>
        </ul>
        <p>
          El incumplimiento puede derivar en suspensión inmediata de tu cuenta
          y, cuando aplique, en denuncia a las autoridades competentes.
        </p>
      </section>

      <section id="ugc">
        <h2>12. Contenido del usuario y moderación</h2>

        <h3>12.1. Propiedad y licencia</h3>
        <p>
          Tú conservas los derechos de propiedad intelectual sobre el contenido
          que publicas. Al publicarlo nos otorgas una licencia{' '}
          <strong>mundial, no exclusiva, libre de regalías, transferible
          únicamente a nuestros encargados autorizados</strong>, por el tiempo
          que mantengas el contenido activo en la plataforma, para mostrarlo,
          reproducirlo, distribuirlo y adaptarlo dentro de los límites
          estrictamente necesarios para operar el servicio (p. ej. redimensionar
          una foto para miniatura, encodearla en distintos formatos).
        </p>
        <p>
          La licencia termina cuando eliminas el contenido, salvo copias en
          respaldos cifrados que se rotan cada 30 días.
        </p>

        <h3>12.2. Moderación</h3>
        <ul>
          <li>Todo el contenido de la sección social y comunidades se somete a un proceso de validación automática (verificación de firmas de archivos, listas de palabras prohibidas y, cuando se active, análisis con Sightengine u otro proveedor de moderación).</li>
          <li>Cualquier usuario puede reportar contenido que considere violatorio desde los botones &ldquo;Reportar&rdquo; de la plataforma.</li>
          <li>Nos comprometemos a revisar los reportes dentro de las <strong>24 horas hábiles</strong> siguientes a su recepción. Cumplimos la obligación de tener canales de respuesta efectivos exigida por la App Store Review Guideline 1.2 y la Google Play Developer Policy §10.3.</li>
          <li>Podemos remover contenido sin previo aviso cuando sea manifiestamente ilegal o suponga un riesgo para la seguridad.</li>
        </ul>

        <h3>12.3. DMCA / derechos de autor</h3>
        <p>
          Si consideras que algún contenido de la plataforma infringe tus
          derechos de autor, envíanos una notificación conforme al DMCA
          (Estados Unidos) o a la Ley Federal del Derecho de Autor (México) a{' '}
          <a href={`mailto:${LEGAL_ENTITY.legalEmail}`}>
            {LEGAL_ENTITY.legalEmail}
          </a>{' '}
          con asunto <em>&ldquo;Notificación DMCA&rdquo;</em> incluyendo: (i)
          identificación de la obra protegida, (ii) identificación del material
          infractor y su URL, (iii) tus datos de contacto, (iv) declaración
          bajo protesta de decir verdad de que tienes la autoría o
          autorización, y (v) tu firma.
        </p>
      </section>

      <section id="propiedad">
        <h2>13. Propiedad intelectual</h2>
        <ul>
          <li>La marca, el logo, el diseño, la interfaz y el código son propiedad de {LEGAL_ENTITY.legalName} y/o están licenciados a nosotros.</li>
          <li>Las guías editoriales y rutas curadas están licenciadas bajo <strong>Creative Commons Atribución – No Comercial 4.0</strong> (CC BY-NC 4.0): puedes copiar y adaptar el contenido con atribución para fines no comerciales.</li>
          <li>Los datos oficiales de SECTUR, INAH, SIC Cultura, INEGI y otras fuentes se usan bajo sus licencias abiertas; ver <Link href="/fuentes-de-datos">/fuentes-de-datos</Link>.</li>
          <li>Las fotografías con crédito a su autor conservan los derechos del autor; cualquier uso externo debe solicitarse directamente.</li>
          <li>Nada en estos Términos transfiere a ti la titularidad de marcas, software o contenido editorial.</li>
        </ul>
      </section>

      <section id="ia">
        <h2>14. Función Autopilot (IA)</h2>
        <ul>
          <li>La función &ldquo;Autopilot&rdquo; utiliza un modelo de lenguaje de Anthropic PBC (Claude) para generar sugerencias de itinerario a partir del prompt que tú capturas.</li>
          <li>Las sugerencias son <strong>orientativas</strong>. Pueden contener errores, lugares cerrados, precios desactualizados o inconsistencias. No sustituyen la verificación con la fuente oficial.</li>
          <li>La plataforma distingue visualmente las corridas generadas con IA (badge verde &ldquo;IA&rdquo;) de las generadas con el algoritmo heurístico cuando la API de IA no está disponible (badge ámbar &ldquo;Heurística&rdquo;).</li>
          <li>No somos responsables por decisiones de viaje que tomes basadas exclusivamente en las sugerencias del modelo.</li>
          <li>El número de corridas de IA está sujeto al límite de tu plan vigente.</li>
        </ul>
      </section>

      <section id="terceros">
        <h2>15. Servicios de terceros</h2>
        <p>
          La plataforma integra servicios de Stripe, Mapbox, Anthropic PBC,
          Neon Inc., Vercel Inc., Cloudflare Inc., Resend Inc., Expo (650
          Industries), RevenueCat Inc., Apple Inc. y Google LLC, entre otros
          identificados en el{' '}
          <Link href="/privacidad#transferencias">Aviso de Privacidad §5</Link>.
          Estos servicios se rigen por sus propios términos; no somos
          responsables por actos u omisiones de estos terceros más allá de la
          diligencia debida en su selección.
        </p>
      </section>

      <section id="disponibilidad">
        <h2>16. Disponibilidad y exactitud</h2>
        <p>
          El servicio se provee <strong>&ldquo;tal cual&rdquo; y &ldquo;según
          disponibilidad&rdquo;</strong>. Hacemos esfuerzos razonables por
          mantener la plataforma operativa 24/7 y la información actualizada,
          pero no garantizamos:
        </p>
        <ul>
          <li>Disponibilidad ininterrumpida (pueden ocurrir ventanas de mantenimiento con aviso previo cuando sea posible).</li>
          <li>Que los lugares estén abiertos a una hora específica — siempre verifica con la fuente oficial.</li>
          <li>Que los precios mostrados (casetas, gasolina, entradas, hospedaje) sean exactos al momento de tu visita.</li>
          <li>Que las rutas estén libres de obstáculos, cierres, condiciones climáticas adversas o riesgos de seguridad pública. Consulta condiciones oficiales de Capufe, Protección Civil y la Guardia Nacional antes de iniciar un viaje largo.</li>
          <li>Que la exactitud del geocoding sea suficiente para navegación crítica. Úsalo como referencia, no como único medio de orientación.</li>
        </ul>
      </section>

      <section id="responsabilidad">
        <h2>17. Limitación de responsabilidad</h2>
        <p>
          En la medida máxima permitida por la legislación aplicable:
        </p>
        <ul>
          <li>{LEGAL_ENTITY.legalName} no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo — pero no limitándose a — pérdida de datos, pérdida de utilidades, pérdida de oportunidades de negocio o daño moral, aun cuando hubiéramos sido advertidos de la posibilidad de tales daños.</li>
          <li>Nuestra responsabilidad total agregada por cualquier reclamación relacionada con el servicio no excederá la <strong>mayor de</strong>: (i) el monto que hayas pagado a {LEGAL_ENTITY.tradeName} en los <strong>12 meses</strong> anteriores al evento que dio origen al reclamo, o (ii) mil pesos mexicanos (MXN $1,000.00).</li>
          <li>No somos responsables por daños o perjuicios ocasionados por eventos de caso fortuito o fuerza mayor, incluyendo — sin limitarse a — desastres naturales, cortes de energía, ataques informáticos a nuestros proveedores, actos de autoridad o interrupciones en proveedores de Internet.</li>
        </ul>
        <p>
          Nada en esta sección pretende limitar responsabilidades que por ley
          no puedan ser limitadas (p. ej. dolo, culpa grave, muerte o lesiones
          personales imputables a nosotros).
        </p>
      </section>

      <section id="indemnizacion">
        <h2>18. Indemnización</h2>
        <p>
          Te obligas a sacar en paz y a salvo a {LEGAL_ENTITY.legalName}, sus
          accionistas, directivos, empleados, apoderados y proveedores, frente
          a cualquier reclamación, demanda, multa o pérdida —incluyendo
          honorarios razonables de abogados— que surja de (i) tu uso indebido
          del servicio, (ii) el contenido que publicas, (iii) tu incumplimiento
          a estos Términos o (iv) la violación de derechos de terceros por
          actos que tú realizaste en la plataforma.
        </p>
      </section>

      <section id="terminacion">
        <h2>19. Suspensión y terminación</h2>
        <p>Podemos suspender o terminar tu cuenta, con aviso razonable cuando sea posible, si:</p>
        <ul>
          <li>Incumples estos Términos o la política de uso aceptable.</li>
          <li>Detectamos actividad fraudulenta, abusiva, ilegal o que ponga en riesgo a otros usuarios.</li>
          <li>Así lo requiere una autoridad competente.</li>
          <li>Dejamos de operar el servicio (avisaremos con 90 días de anticipación y te permitiremos exportar tus datos).</li>
        </ul>
        <p>
          Puedes cerrar tu cuenta en cualquier momento desde{' '}
          <Link href="/perfil">/perfil</Link> → Zona peligrosa, o desde la app
          móvil en Perfil → Eliminar cuenta. Los plazos de retención y
          eliminación están descritos en el{' '}
          <Link href="/privacidad#conservacion">Aviso de Privacidad §7</Link>.
        </p>
      </section>

      <section id="cambios">
        <h2>20. Cambios a los Términos</h2>
        <p>
          Podemos actualizar estos Términos. Los cambios materiales se
          notifican por correo electrónico al correo registrado con al menos{' '}
          <strong>30 días</strong> de anticipación a su entrada en vigor. El
          historial completo de versiones se publica en{' '}
          <Link href="/correcciones">/correcciones</Link>. La versión vigente
          es{' '}
          <strong>{LEGAL_ENTITY.version}</strong>, vigente desde{' '}
          {LEGAL_ENTITY.lastUpdated}. Tu uso continuado tras la fecha efectiva
          de la nueva versión constituye aceptación.
        </p>
      </section>

      <section id="profeco">
        <h2>21. Protección al consumidor (LFPC)</h2>
        <p>
          Conforme al Capítulo VIII Bis de la{' '}
          <strong>Ley Federal de Protección al Consumidor</strong> (artículos
          76 Bis y 76 Bis 1), te informamos:
        </p>
        <ul>
          <li>
            <strong>Proveedor:</strong> {LEGAL_ENTITY.legalName},{' '}
            {LEGAL_ENTITY.address}, RFC {LEGAL_ENTITY.rfc}, teléfono{' '}
            {LEGAL_ENTITY.phone}, correo{' '}
            <a href={`mailto:${LEGAL_ENTITY.supportEmail}`}>
              {LEGAL_ENTITY.supportEmail}
            </a>.
          </li>
          <li>
            <strong>Características esenciales:</strong> plataforma digital de
            planeación de viajes por suscripción. Funcionalidades y precios
            actuales publicados en <Link href="/precios">/precios</Link>.
          </li>
          <li>
            <strong>Derechos del consumidor:</strong> derecho a la información
            (Art. 1 fracción III LFPC), a la protección de datos (Aviso de
            Privacidad), a la reclamación efectiva, y a no sufrir prácticas
            comerciales abusivas.
          </li>
          <li>
            <strong>Procedimiento de reclamación:</strong> primero escribe a{' '}
            <a href={`mailto:${LEGAL_ENTITY.supportEmail}`}>
              {LEGAL_ENTITY.supportEmail}
            </a>{' '}
            (respondemos en ≤ 5 días hábiles). Si no se resuelve, puedes
            acudir a Profeco en <a href="https://concilianet.profeco.gob.mx" target="_blank" rel="noopener noreferrer">concilianet.profeco.gob.mx</a> o al 55 5568 8722.
          </li>
        </ul>
      </section>

      <section id="ley">
        <h2>22. Ley aplicable y jurisdicción</h2>
        <p>
          Estos Términos se rigen por las leyes de los{' '}
          <strong>Estados Unidos Mexicanos</strong>. Para la interpretación y
          cumplimiento de los presentes Términos, las partes se someten
          expresamente a la jurisdicción de los tribunales competentes de la{' '}
          <strong>{LEGAL_ENTITY.jurisdiction}</strong>, renunciando a cualquier
          otra jurisdicción que pudiere corresponderles por razón de sus
          domicilios presentes o futuros.
        </p>
        <p>
          Lo anterior sin perjuicio de los derechos irrenunciables que en
          materia de consumidor te confiere la legislación mexicana.
        </p>
      </section>

      <section id="contacto">
        <h2>23. Contacto</h2>
        <ul>
          <li><strong>Soporte:</strong> <a href={`mailto:${LEGAL_ENTITY.supportEmail}`}>{LEGAL_ENTITY.supportEmail}</a></li>
          <li><strong>Asuntos legales:</strong> <a href={`mailto:${LEGAL_ENTITY.legalEmail}`}>{LEGAL_ENTITY.legalEmail}</a></li>
          <li><strong>Privacidad:</strong> <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>{LEGAL_ENTITY.privacyEmail}</a></li>
          <li><strong>Teléfono:</strong> {LEGAL_ENTITY.phone}</li>
          <li><strong>Domicilio legal:</strong> {LEGAL_ENTITY.address}</li>
        </ul>
      </section>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  English                                                             */
/* ─────────────────────────────────────────────────────────────────── */
function TermsEn() {
  return (
    <>
      <section id="aceptacion">
        <h2>1. Acceptance of terms</h2>
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) form a binding agreement
          between <strong>{LEGAL_ENTITY.legalName}</strong>, with registered
          address at {LEGAL_ENTITY.address} and Mexican tax ID{' '}
          {LEGAL_ENTITY.rfc} (&ldquo;{LEGAL_ENTITY.tradeName}&rdquo;,
          &ldquo;we&rdquo;), and you, the User.
        </p>
        <p>
          By creating an account, completing a purchase or using any part of{' '}
          <strong>{LEGAL_ENTITY.domain}</strong> or the mobile application
          <strong> Rutas en MX</strong>, you acknowledge you have read,
          understood and accepted these Terms and the{' '}
          <Link href="/privacidad">Privacy Notice</Link>. If you disagree, do
          not use the service.
        </p>
      </section>

      <section id="definiciones">
        <h2>2. Definitions</h2>
        <ul>
          <li><strong>Service / Platform:</strong> the website {LEGAL_ENTITY.domain}, the iOS and Android apps, and related APIs.</li>
          <li><strong>Free / Pro / Premium user:</strong> accounts with or without an active paid subscription.</li>
          <li><strong>User Content:</strong> any information you post: trips, notes, photos, comments, messages.</li>
          <li><strong>Editorial Content:</strong> guides, curated routes and place data produced or licensed by us.</li>
          <li><strong>IAP:</strong> In-App Purchases processed through Apple App Store or Google Play.</li>
          <li><strong>LFPC:</strong> Mexico&rsquo;s Federal Consumer Protection Law.</li>
        </ul>
      </section>

      <section id="servicio">
        <h2>3. Service description</h2>
        <p>Rutas en MX is an editorial and interactive platform to discover, plan and share road trips across Mexico, including:</p>
        <ul>
          <li>Catalogues of Pueblos Mágicos, museums, archaeological sites, beaches, cenotes, haciendas and historic centres.</li>
          <li>Editorially-curated routes and travel guides.</li>
          <li>AI trip planner (&ldquo;Autopilot&rdquo;).</li>
          <li>Interactive maps and PDF itinerary export.</li>
          <li>Optional social surface (&ldquo;Conectar&rdquo;) with profiles, matches and private messages.</li>
          <li>Communities (topic-based forums) with posts and comments.</li>
          <li>Push notifications when you install the mobile app.</li>
        </ul>
        <p>
          The platform is an <strong>information and planning</strong> service.
          We are not a travel agency, we do not operate transport, we do not
          sell tickets and we do not sign lodging contracts on behalf of third
          parties.
        </p>
      </section>

      <section id="elegibilidad">
        <h2>4. Eligibility &amp; registration</h2>
        <ul>
          <li>You must be at least <strong>13</strong>. Between 13-17, a parent/guardian consent is required.</li>
          <li>&ldquo;Conectar&rdquo; (social) requires age <strong>18+</strong>.</li>
          <li>You represent the information you provide is truthful, current and complete.</li>
        </ul>
      </section>

      <section id="cuentas">
        <h2>5. Accounts &amp; security</h2>
        <ul>
          <li>One personal account only, non-transferable.</li>
          <li>You are responsible for password confidentiality and for the use made of your account.</li>
          <li>Notify us immediately at {LEGAL_ENTITY.supportEmail} if you detect unauthorised access.</li>
          <li>We may require two-factor authentication on suspicious activity.</li>
          <li>You can close your account at any time from <Link href="/perfil">/profile → Danger zone</Link> or in-app.</li>
        </ul>
      </section>

      <section id="planes">
        <h2>6. Plans &amp; pricing</h2>
        <ul>
          <li>We offer a Free plan and paid <strong>Pro</strong> and <strong>Premium</strong> plans. Current features and prices are published at <Link href="/precios">rutasenmx.com/pricing</Link>.</li>
          <li>Prices are shown in Mexican Pesos (MXN) for Mexico, US Dollars (USD) elsewhere.</li>
          <li>Web payments through Stripe (Visa, Mastercard, Amex, OXXO, SPEI). Mobile payments via Apple/Google IAP.</li>
          <li>Applicable taxes are shown at checkout before the charge.</li>
        </ul>
      </section>

      <section id="auto-renovacion">
        <h2>7. Auto-renewal &amp; cancellation</h2>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
          <strong>
            Rutas en MX subscriptions auto-renew at the end of each billing
            cycle unless you cancel at least 24 hours before the next period.
          </strong>{' '}
          The renewal amount is charged to the original payment method.
        </p>
        <p>Cancel anytime from:</p>
        <ul>
          <li><strong>Web:</strong> <Link href="/suscripcion">/subscription</Link> → &ldquo;Manage on Stripe&rdquo;.</li>
          <li><strong>iOS:</strong> Settings → your Apple ID → Subscriptions → Rutas en MX.</li>
          <li><strong>Android:</strong> Google Play → menu → Payments &amp; subscriptions → Subscriptions → Rutas en MX.</li>
        </ul>
        <p>
          Cancellation effects: you keep paid features until the end of the
          paid cycle, no further charges are taken, and your account reverts
          to Free.
        </p>
        <p>
          Price changes require at least 30 days&rsquo; email notice. The new
          price applies from the next renewal; if you don&rsquo;t accept,
          cancel before the effective date.
        </p>
      </section>

      <section id="reembolsos">
        <h2>8. Refunds &amp; warranties</h2>
        <ul>
          <li>Full refund of a new web subscription charge within <strong>14 days</strong>, if you have not exported more than 3 non-watermarked PDFs nor run the AI more than 5 times.</li>
          <li>No pro-rated refunds for elapsed cycles.</li>
          <li>Request at <a href={`mailto:${LEGAL_ENTITY.supportEmail}`}>{LEGAL_ENTITY.supportEmail}</a>.</li>
          <li>Processing takes 5-10 business days to the original method.</li>
          <li>
            <strong>Mobile (IAP) refunds</strong> are handled by Apple or
            Google:{' '}
            <a href="https://reportaproblem.apple.com" target="_blank" rel="noopener noreferrer">reportaproblem.apple.com</a>{' '}
            or Google Play order history.
          </li>
        </ul>
      </section>

      <section id="iap">
        <h2>9. In-app purchases</h2>
        <p>
          Mobile subscriptions are transacted between you and Apple Inc. (iOS)
          or Google LLC (Android). We receive the net after store commissions
          (typically 15-30%). The store&rsquo;s terms govern the IAP
          transaction; these Terms govern your use of the platform.
        </p>
      </section>

      <section id="anti-doble-cobro">
        <h2>10. Anti-double-billing</h2>
        <ul>
          <li>Active web subscription → mobile IAP purchase buttons disabled with banner directing to rutasenmx.com.</li>
          <li>Active mobile IAP → web checkout returns HTTP 409 with clear message.</li>
          <li>Involuntary double charges are refunded on notice.</li>
        </ul>
      </section>

      <section id="uso-aceptable">
        <h2>11. Acceptable use</h2>
        <p>You will not:</p>
        <ul>
          <li>Scrape, crawl or reverse-engineer the platform.</li>
          <li>Redistribute or resell editorial content without written permission.</li>
          <li>Post illegal, defamatory, discriminatory, violent or sexually explicit content.</li>
          <li>Impersonate others.</li>
          <li>Attempt to breach security or access other users&rsquo; data.</li>
          <li>Use the service for spam, phishing or fraud.</li>
          <li>Harvest user data for commercial purposes without consent.</li>
          <li>Infringe intellectual property rights of others.</li>
          <li>Use &ldquo;Conectar&rdquo; for commercial, coercive, harassing or sexually-exploitative purposes.</li>
        </ul>
      </section>

      <section id="ugc">
        <h2>12. User content &amp; moderation</h2>
        <p>
          You retain ownership of your content. You grant us a worldwide,
          non-exclusive, royalty-free licence to display, reproduce, distribute
          and adapt it solely to operate the service. The licence ends when
          you delete the content (except encrypted backups rotated every 30
          days).
        </p>
        <p>
          We review reports within <strong>24 business hours</strong>{' '}
          (complying with App Store Guideline 1.2 and Google Play Policy
          §10.3). DMCA / Mexican copyright notices go to{' '}
          <a href={`mailto:${LEGAL_ENTITY.legalEmail}`}>{LEGAL_ENTITY.legalEmail}</a>.
        </p>
      </section>

      <section id="propiedad">
        <h2>13. Intellectual property</h2>
        <ul>
          <li>Brand, logo, design, UI and code are owned by {LEGAL_ENTITY.legalName}.</li>
          <li>Editorial guides and curated routes are licensed under <strong>CC BY-NC 4.0</strong>.</li>
          <li>Official SECTUR, INAH, SIC Cultura, INEGI data used under their open licences; see <Link href="/fuentes-de-datos">data sources</Link>.</li>
          <li>Photographs credited to authors retain author rights.</li>
        </ul>
      </section>

      <section id="ia">
        <h2>14. Autopilot AI feature</h2>
        <ul>
          <li>Uses Anthropic PBC&rsquo;s Claude model to generate suggestions from your prompt.</li>
          <li>Suggestions are <strong>indicative only</strong>. Errors are possible. Always verify with official sources.</li>
          <li>UI distinguishes AI runs (green badge) from heuristic fallback (amber badge).</li>
          <li>Runs per period are subject to your plan limit.</li>
        </ul>
      </section>

      <section id="terceros">
        <h2>15. Third-party services</h2>
        <p>
          Platform integrates Stripe, Mapbox, Anthropic PBC, Neon, Vercel,
          Cloudflare, Resend, Expo, RevenueCat, Apple and Google — full list in
          the <Link href="/privacidad#transferencias">Privacy Notice §5</Link>.
          Their own terms apply to those services.
        </p>
      </section>

      <section id="disponibilidad">
        <h2>16. Availability &amp; accuracy</h2>
        <p>
          Service is provided <strong>&ldquo;as is&rdquo; and &ldquo;as
          available&rdquo;</strong>. We make reasonable efforts but do not
          warrant uninterrupted availability, accuracy of opening hours,
          prices or route conditions. Always verify with official sources
          before departing.
        </p>
      </section>

      <section id="responsabilidad">
        <h2>17. Limitation of liability</h2>
        <p>To the fullest extent permitted by applicable law:</p>
        <ul>
          <li>{LEGAL_ENTITY.legalName} is not liable for indirect, incidental, special, consequential or punitive damages.</li>
          <li>Our total aggregate liability will not exceed the greater of: (i) the amount you have paid us in the <strong>12 months</strong> before the claim, or (ii) MXN $1,000.00.</li>
          <li>No liability for force majeure events.</li>
        </ul>
        <p>
          Nothing limits liability that cannot be limited by law (wilful
          misconduct, gross negligence, death or personal injury attributable
          to us).
        </p>
      </section>

      <section id="indemnizacion">
        <h2>18. Indemnification</h2>
        <p>
          You agree to indemnify and hold {LEGAL_ENTITY.legalName}, its
          shareholders, officers, employees, agents and vendors harmless from
          any claim, demand, fine or loss — including reasonable attorney fees
          — arising from (i) your misuse of the service, (ii) content you
          upload, (iii) your breach of these Terms, or (iv) your violation of
          third-party rights.
        </p>
      </section>

      <section id="terminacion">
        <h2>19. Suspension &amp; termination</h2>
        <p>We may suspend or terminate your account with reasonable notice when possible if:</p>
        <ul>
          <li>You breach these Terms or the acceptable-use policy.</li>
          <li>We detect fraudulent, abusive, illegal activity or risk to other users.</li>
          <li>A competent authority requires it.</li>
          <li>We cease operating the service (90-day notice with export window).</li>
        </ul>
      </section>

      <section id="cambios">
        <h2>20. Changes to the Terms</h2>
        <p>
          Material changes notified by email at least <strong>30 days</strong>{' '}
          in advance. Version history at{' '}
          <Link href="/correcciones">/corrections</Link>. Current version:{' '}
          <strong>{LEGAL_ENTITY.version}</strong>, effective from{' '}
          {LEGAL_ENTITY.lastUpdated}.
        </p>
      </section>

      <section id="profeco">
        <h2>21. Consumer protection (Mexico &mdash; LFPC)</h2>
        <ul>
          <li><strong>Provider:</strong> {LEGAL_ENTITY.legalName}, {LEGAL_ENTITY.address}, RFC {LEGAL_ENTITY.rfc}.</li>
          <li><strong>Complaints:</strong> first to <a href={`mailto:${LEGAL_ENTITY.supportEmail}`}>{LEGAL_ENTITY.supportEmail}</a> (reply ≤ 5 business days). If unresolved, to PROFECO at <a href="https://concilianet.profeco.gob.mx" target="_blank" rel="noopener noreferrer">concilianet.profeco.gob.mx</a>.</li>
        </ul>
      </section>

      <section id="ley">
        <h2>22. Governing law &amp; jurisdiction</h2>
        <p>
          These Terms are governed by the laws of the{' '}
          <strong>United Mexican States</strong>. Any dispute is submitted to
          the competent courts of{' '}
          <strong>{LEGAL_ENTITY.jurisdiction}</strong>, expressly waiving any
          other jurisdiction — without prejudice to the consumer rights
          granted by Mexican law that cannot be waived.
        </p>
      </section>

      <section id="contacto">
        <h2>23. Contact</h2>
        <ul>
          <li><strong>Support:</strong> <a href={`mailto:${LEGAL_ENTITY.supportEmail}`}>{LEGAL_ENTITY.supportEmail}</a></li>
          <li><strong>Legal:</strong> <a href={`mailto:${LEGAL_ENTITY.legalEmail}`}>{LEGAL_ENTITY.legalEmail}</a></li>
          <li><strong>Privacy:</strong> <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>{LEGAL_ENTITY.privacyEmail}</a></li>
          <li><strong>Phone:</strong> {LEGAL_ENTITY.phone}</li>
          <li><strong>Registered address:</strong> {LEGAL_ENTITY.address}</li>
        </ul>
      </section>
    </>
  );
}
