import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { getLocale } from '@/lib/i18n/server';
import { LegalShell, type LegalSection } from '@/components/legal/LegalShell';
import { LEGAL_ENTITY, PROCESSORS } from '@/lib/legal/entity';

const PAGE_PATH = '/privacidad';
const PAGE_TITLE = 'Aviso de Privacidad Integral / Privacy policy';
const PAGE_DESCRIPTION =
  'Aviso de Privacidad Integral de Rutas en MX conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento. Incluye equivalencias con GDPR para residentes en la UE.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
  });
}

const SECTIONS_ES: LegalSection[] = [
  { id: 'resumen',              title: 'Resumen ejecutivo' },
  { id: 'responsable',          title: '1. Responsable del tratamiento' },
  { id: 'datos',                title: '2. Datos personales que tratamos' },
  { id: 'finalidades',          title: '3. Finalidades del tratamiento' },
  { id: 'fundamento',           title: '4. Fundamento legal' },
  { id: 'transferencias',       title: '5. Transferencias y encargados' },
  { id: 'cookies',              title: '6. Cookies y tecnologías similares' },
  { id: 'conservacion',         title: '7. Plazos de conservación' },
  { id: 'seguridad',            title: '8. Medidas de seguridad' },
  { id: 'arco',                 title: '9. Derechos ARCO y revocación' },
  { id: 'limitacion',           title: '10. Limitación del uso o divulgación' },
  { id: 'menores',              title: '11. Menores de edad' },
  { id: 'automatizadas',        title: '12. Decisiones automatizadas e IA' },
  { id: 'gdpr',                 title: '13. Derechos adicionales UE (GDPR)' },
  { id: 'ccpa',                 title: '14. Residentes de California (CCPA)' },
  { id: 'cambios',              title: '15. Cambios al aviso' },
  { id: 'contacto',             title: '16. Contacto' },
];

const SECTIONS_EN: LegalSection[] = [
  { id: 'resumen',              title: 'Executive summary' },
  { id: 'responsable',          title: '1. Data controller' },
  { id: 'datos',                title: '2. Personal data we process' },
  { id: 'finalidades',          title: '3. Purposes of processing' },
  { id: 'fundamento',           title: '4. Legal bases' },
  { id: 'transferencias',       title: '5. Transfers and processors' },
  { id: 'cookies',              title: '6. Cookies & similar tech' },
  { id: 'conservacion',         title: '7. Retention' },
  { id: 'seguridad',            title: '8. Security measures' },
  { id: 'arco',                 title: '9. Access, rectification, erasure' },
  { id: 'limitacion',           title: '10. Limiting use or disclosure' },
  { id: 'menores',              title: '11. Minors' },
  { id: 'automatizadas',        title: '12. Automated decisions & AI' },
  { id: 'gdpr',                 title: '13. EU residents (GDPR)' },
  { id: 'ccpa',                 title: '14. California residents (CCPA)' },
  { id: 'cambios',              title: '15. Changes to this notice' },
  { id: 'contacto',             title: '16. Contact' },
];

export default async function PrivacidadPage() {
  const locale = await getLocale();
  const isEn = locale === 'en';
  const breadcrumbs = buildBreadcrumbs([
    { label: isEn ? 'Privacy' : 'Privacidad', href: PAGE_PATH },
  ]);
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  const title = isEn ? 'Privacy policy' : 'Aviso de Privacidad Integral';
  const kicker = isEn ? 'Legal · Privacy' : 'Legal · Privacidad';
  const summary = isEn
    ? `Privacy notice for ${LEGAL_ENTITY.tradeName} under Mexico's LFPDPPP (Federal Personal Data Protection Law) and its Regulations. Extended rights apply for EU and California residents.`
    : `Aviso de Privacidad Integral de ${LEGAL_ENTITY.tradeName} conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento. Incluye derechos ampliados para residentes en la UE y California.`;

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
        readingMinutes={14}
        isEn={isEn}
        current="privacidad"
        sections={isEn ? SECTIONS_EN : SECTIONS_ES}
      >
        {isEn ? <PrivacyEn /> : <PrivacyEs />}
      </LegalShell>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Español — Aviso de Privacidad Integral (LFPDPPP Art. 16 + Reglamento 26-28) */
/* ─────────────────────────────────────────────────────────────────── */
function PrivacyEs() {
  return (
    <>
      <section id="resumen">
        <h2>Resumen ejecutivo</h2>
        <p>
          <strong>{LEGAL_ENTITY.legalName}</strong> (&ldquo;
          {LEGAL_ENTITY.tradeName}&rdquo;, &ldquo;nosotros&rdquo;) es el
          responsable del tratamiento de tus datos personales. Este Aviso
          cumple los artículos 15 y 16 de la{' '}
          <strong>Ley Federal de Protección de Datos Personales en Posesión
          de los Particulares</strong> (LFPDPPP) y los artículos 26 a 28 de
          su Reglamento.
        </p>
        <ul>
          <li><strong>Qué recopilamos:</strong> correo, nombre, contraseña cifrada, contenido que creas (viajes, favoritos, mensajes) y metadatos técnicos.</li>
          <li><strong>Para qué:</strong> operar el servicio que contratas, prevenir fraude, cumplir la ley y —con tu consentimiento— enviarte comunicaciones editoriales.</li>
          <li><strong>Qué NO hacemos:</strong> vender datos, publicidad dirigida de terceros, perfilado con datos sensibles.</li>
          <li><strong>Tus derechos (ARCO):</strong> acceso, rectificación, cancelación, oposición, revocación y portabilidad. Escribe a <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>{LEGAL_ENTITY.privacyEmail}</a>.</li>
          <li><strong>Autoridad:</strong> INAI — inai.org.mx.</li>
        </ul>
      </section>

      <section id="responsable">
        <h2>1. Responsable del tratamiento</h2>
        <p>
          Conforme al artículo 16 fracción I LFPDPPP y 26 fracción I del
          Reglamento, el responsable de tus datos personales es:
        </p>
        <ul>
          <li><strong>Denominación / razón social:</strong> {LEGAL_ENTITY.legalName}</li>
          <li><strong>Nombre comercial:</strong> {LEGAL_ENTITY.tradeName}</li>
          <li><strong>RFC:</strong> {LEGAL_ENTITY.rfc}</li>
          <li><strong>Domicilio:</strong> {LEGAL_ENTITY.address}</li>
          <li><strong>Correo de privacidad:</strong> <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>{LEGAL_ENTITY.privacyEmail}</a></li>
          <li><strong>Teléfono:</strong> {LEGAL_ENTITY.phone}</li>
        </ul>
        <p>
          Hemos designado un responsable interno de atención a derechos ARCO;
          sus datos de contacto son los indicados arriba.
        </p>
      </section>

      <section id="datos">
        <h2>2. Datos personales que tratamos</h2>

        <h3>2.1. Datos de identificación y contacto</h3>
        <ul>
          <li>Nombre o alias.</li>
          <li>Correo electrónico.</li>
          <li>Contraseña (almacenada con hash bcrypt, cost factor 12 — nunca vemos la original).</li>
          <li>Fotografía de perfil (sólo si tú la subes).</li>
        </ul>

        <h3>2.2. Datos de uso y contenido generado</h3>
        <ul>
          <li>Viajes, itinerarios, favoritos, notas y preferencias que guardas.</li>
          <li>Publicaciones, comentarios y mensajes privados cuando participas en la sección social.</li>
          <li>Ubicación a nivel ciudad derivada de tu dirección IP. Si activas permisos de ubicación precisa (GPS), la usamos solo en memoria del dispositivo y nunca la enviamos a nuestros servidores salvo que uses una función que lo requiera explícitamente.</li>
        </ul>

        <h3>2.3. Datos financieros</h3>
        <p>
          <strong>No almacenamos datos completos de tarjetas.</strong> Los
          pagos se procesan a través de Stripe y/o Apple/Google in-app. De esa
          relación conservamos únicamente:
        </p>
        <ul>
          <li>Identificador de la suscripción (token opaco).</li>
          <li>Últimos 4 dígitos y marca de la tarjeta (para mostrarlos en <Link href="/suscripcion">/suscripcion</Link>).</li>
          <li>Historial de facturación y monto.</li>
        </ul>

        <h3>2.4. Metadatos técnicos</h3>
        <ul>
          <li>Dirección IP, tipo de dispositivo, sistema operativo, navegador.</li>
          <li>Logs de acceso con fecha, hora y endpoint consultado (retención 90 días para seguridad — Art. 19 LFPDPPP).</li>
          <li>Token de push del dispositivo (cuando instalas la app móvil y aceptas notificaciones).</li>
        </ul>

        <h3>2.5. Datos que NO tratamos</h3>
        <p>
          No solicitamos ni tratamos <strong>datos personales sensibles</strong>{' '}
          en el sentido del artículo 3 fracción VI LFPDPPP: origen racial o
          étnico, estado de salud, información genética, creencias religiosas,
          filosóficas o morales, afiliación sindical, opiniones políticas, ni
          datos de preferencia sexual. La biometría de Face ID / huella digital
          nunca sale del dispositivo — iOS/Android la procesan localmente.
        </p>
      </section>

      <section id="finalidades">
        <h2>3. Finalidades del tratamiento</h2>
        <p>
          Conforme al artículo 28 del Reglamento, diferenciamos las finalidades
          en <em>primarias</em> (las que dan origen a la relación y no
          requieren consentimiento expreso) y <em>secundarias</em> (a las que
          puedes negarte sin que afecte el servicio).
        </p>

        <h3>3.1. Finalidades primarias</h3>
        <ul>
          <li>Crear tu cuenta y autenticarte en cada sesión.</li>
          <li>Guardar, editar y sincronizar tus viajes, favoritos y notas.</li>
          <li>Cobrarte los planes de suscripción que contrates, emitir recibo, procesar reembolsos y cancelar la suscripción cuando lo solicites.</li>
          <li>Permitir la sección social (perfil público, matches, mensajes, comunidades) cuando decidas activarla.</li>
          <li>Enviar correos transaccionales indispensables: confirmación de cuenta, recuperación de contraseña, recibos, alertas de seguridad, notificaciones de cambios legales.</li>
          <li>Generar itinerarios con IA cuando usas la función &ldquo;Autopilot&rdquo;.</li>
          <li>Prevenir y detectar fraude, abuso, scraping automatizado y violaciones a los Términos.</li>
          <li>Cumplir con obligaciones fiscales y requerimientos de autoridades competentes.</li>
        </ul>

        <h3>3.2. Finalidades secundarias</h3>
        <ul>
          <li>Analítica agregada y anónima para mejorar el producto.</li>
          <li>Envío del boletín editorial (máximo 2 correos al mes) si te suscribes voluntariamente.</li>
          <li>Encuestas opcionales de satisfacción.</li>
        </ul>
        <p>
          Puedes manifestar tu negativa a las finalidades secundarias en
          cualquier momento enviando un correo a{' '}
          <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>
            {LEGAL_ENTITY.privacyEmail}
          </a>{' '}
          con el asunto <em>&ldquo;Negativa de finalidades secundarias&rdquo;</em>.
          Tu manifestación no afectará el servicio contratado.
        </p>
      </section>

      <section id="fundamento">
        <h2>4. Fundamento legal</h2>
        <ul>
          <li><strong>México:</strong> Artículo 6º apartado A fracción II y 16º párrafo segundo de la Constitución; Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), arts. 1º, 3º, 8º, 15º, 16º, 22º, 25º, 28º y 36º; Reglamento de la LFPDPPP, arts. 9, 26-28, 40-59, 89-104; Lineamientos del Aviso de Privacidad publicados en el DOF el 17 de enero de 2013.</li>
          <li><strong>Unión Europea (cuando aplica):</strong> Reglamento (UE) 2016/679 — RGPD, arts. 6, 13, 15-22.</li>
          <li><strong>California, EUA (cuando aplica):</strong> California Consumer Privacy Act (CCPA) y California Privacy Rights Act (CPRA).</li>
        </ul>
      </section>

      <section id="transferencias">
        <h2>5. Transferencias y encargados</h2>
        <p>
          Conforme al artículo 36 LFPDPPP y 68 del Reglamento, no requerimos
          tu consentimiento expreso para las transferencias siguientes porque
          todas corresponden a <em>encargados</em> (processors) que tratan los
          datos únicamente por nuestra cuenta, bajo contrato con cláusulas de
          confidencialidad y sub-encargados limitados.
        </p>

        <h3>5.1. Encargados autorizados</h3>
        <div className="not-prose overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 pr-4">Encargado</th>
                <th className="py-2 pr-4">Finalidad</th>
                <th className="py-2 pr-4">Datos</th>
                <th className="py-2 pr-4">País</th>
              </tr>
            </thead>
            <tbody>
              {PROCESSORS.map((p) => (
                <tr key={p.name} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-4 font-semibold">{p.name}</td>
                  <td className="py-2 pr-4">{p.purpose}</td>
                  <td className="py-2 pr-4">{p.dataSeen.join(', ')}</td>
                  <td className="py-2 pr-4">{p.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Todas las transferencias internacionales se realizan con salvaguardas
          contractuales estándar (Standard Contractual Clauses de la UE y/o
          cláusulas equivalentes conforme al Criterio 1/2015 del INAI),
          cifrado TLS 1.3 en tránsito y cifrado en reposo.
        </p>

        <h3>5.2. Transferencias que SÍ requieren tu consentimiento</h3>
        <p>
          No realizamos ninguna transferencia fuera de los encargados listados.
          Si en el futuro necesitamos transferir tus datos a un tercero con
          finalidad propia (por ejemplo, un socio comercial), te solicitaremos
          consentimiento expreso por canal electrónico antes de hacerlo.
        </p>

        <h3>5.3. Autoridades</h3>
        <p>
          Entregamos datos a autoridades mexicanas competentes únicamente
          cuando medie requerimiento fundado y motivado conforme al artículo 16
          constitucional. Registramos cada solicitud en un log interno (Art. 19
          LFPDPPP).
        </p>
      </section>

      <section id="cookies">
        <h2>6. Cookies y tecnologías similares</h2>

        <h3>6.1. Categorías</h3>
        <ul>
          <li>
            <strong>Estrictamente necesarias:</strong>
            {' '}<code>rutasmx_session</code> (JWT firmado, autenticación);
            {' '}<code>rutasmx_locale</code> (idioma). Sin ellas no podrías
            iniciar sesión; se tratan con base al artículo 10 fracción IV
            LFPDPPP (necesarias para el cumplimiento del contrato).
          </li>
          <li>
            <strong>Analíticas:</strong> sólo cuando las aceptas en el banner
            inicial. Agregadas y anónimas.
          </li>
          <li>
            <strong>Publicitarias de terceros:</strong>{' '}
            <strong>no usamos</strong>.
          </li>
        </ul>

        <h3>6.2. Tu elección</h3>
        <p>
          Puedes administrar tu preferencia desde el banner inicial o desde{' '}
          <Link href="/perfil">/perfil</Link> → Preferencias → Cookies. Tu
          elección se respeta por 12 meses o hasta que la revoques.
        </p>

        <h3>6.3. Identificadores de dispositivo móvil</h3>
        <p>
          En la app móvil, Apple y Google nos exponen identificadores
          (IDFA / ADID) únicamente cuando tú los autorizas desde los ajustes
          del sistema operativo. No los usamos para publicidad; sirven para
          conciliar compras IAP a través de RevenueCat.
        </p>
      </section>

      <section id="conservacion">
        <h2>7. Plazos de conservación</h2>
        <p>
          Conforme al artículo 11 LFPDPPP, sólo conservamos los datos por el
          tiempo necesario para las finalidades que los justifican.
        </p>
        <ul>
          <li><strong>Cuenta activa:</strong> mientras la mantengas abierta.</li>
          <li><strong>Cuenta eliminada (soft-delete):</strong> tu información personal se anonimiza inmediatamente. Los datos físicos (viajes, mensajes, fotos) se borran completamente a los <strong>30 días</strong> mediante un proceso automatizado diario.</li>
          <li><strong>Facturación:</strong> 5 años por obligación fiscal (Art. 67 Código Fiscal de la Federación).</li>
          <li><strong>Logs de seguridad:</strong> 90 días.</li>
          <li><strong>Logs de acceso a datos personales:</strong> 5 años (Art. 62 LFPDPPP).</li>
          <li><strong>Datos analíticos agregados:</strong> hasta 26 meses, sin identificadores personales.</li>
          <li><strong>Copias de respaldo cifradas:</strong> rotación de 30 días.</li>
        </ul>
      </section>

      <section id="seguridad">
        <h2>8. Medidas de seguridad</h2>
        <p>
          Conforme al artículo 19 LFPDPPP y 57-61 del Reglamento, mantenemos
          medidas administrativas, físicas y técnicas para proteger tus datos.
          Entre ellas:
        </p>
        <ul>
          <li>Cifrado TLS 1.3 en todas las comunicaciones hacia el servidor.</li>
          <li>Cifrado AES-256 en reposo para la base de datos y backups.</li>
          <li>Contraseñas almacenadas únicamente como hash bcrypt (cost factor 12, sal aleatoria por usuario).</li>
          <li>Control de acceso con principio de mínimo privilegio para el equipo interno.</li>
          <li>Segregación de entornos (producción / staging / desarrollo).</li>
          <li>Auditorías internas trimestrales y pruebas de penetración anuales.</li>
          <li>Registro (log) firmado de accesos administrativos a datos personales (Art. 62 LFPDPPP).</li>
          <li>Programa de respuesta a incidentes conforme al Art. 20 LFPDPPP.</li>
        </ul>
        <p>
          <strong>Protocolo de notificación de vulneraciones.</strong> En caso
          de una vulneración de seguridad que afecte de forma significativa
          derechos patrimoniales o morales de los titulares, notificaremos al
          titular y al INAI dentro de las <strong>72 horas</strong> siguientes
          a su detección, conforme al artículo 20 LFPDPPP y 64 del Reglamento.
          La notificación incluirá naturaleza del incidente, datos
          comprometidos, recomendaciones y medidas correctivas.
        </p>
      </section>

      <section id="arco">
        <h2>9. Derechos ARCO, revocación y portabilidad</h2>
        <p>
          Conforme a los artículos 22 a 26 LFPDPPP y 89 a 104 de su
          Reglamento, tienes derecho a:
        </p>
        <ul>
          <li><strong>Acceso:</strong> obtener copia de tus datos personales y conocer cómo los tratamos.</li>
          <li><strong>Rectificación:</strong> corregir información inexacta o incompleta.</li>
          <li><strong>Cancelación:</strong> solicitar que tu información sea eliminada cuando ya no sea necesaria para las finalidades que la justificaron.</li>
          <li><strong>Oposición:</strong> oponerte por causa legítima al tratamiento para una finalidad específica.</li>
          <li><strong>Revocación del consentimiento:</strong> cuando éste sea la base del tratamiento.</li>
          <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado legible por máquina (JSON).</li>
        </ul>

        <h3>9.1. Procedimiento</h3>
        <p>
          Envía correo a{' '}
          <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>
            {LEGAL_ENTITY.privacyEmail}
          </a>{' '}
          con el asunto <em>&ldquo;Solicitud ARCO — [tu derecho]&rdquo;</em>{' '}
          e incluye:
        </p>
        <ul>
          <li>Nombre completo y correo registrado.</li>
          <li>Copia simple de identificación oficial (INE, pasaporte) o, en su caso, poder notarial del representante.</li>
          <li>Descripción clara y precisa de los datos y del derecho que ejerces.</li>
          <li>Cualquier elemento que facilite la localización de tus datos.</li>
        </ul>

        <h3>9.2. Plazos</h3>
        <ul>
          <li>Acuse de recibo: <strong>20 días hábiles</strong>.</li>
          <li>Respuesta efectiva: <strong>15 días hábiles adicionales</strong> a partir del acuse.</li>
          <li>Total: máximo 35 días hábiles conforme al artículo 32 LFPDPPP.</li>
          <li>Cuando la solicitud proceda, ejecutamos el derecho en 15 días hábiles adicionales.</li>
        </ul>

        <h3>9.3. Gratuidad</h3>
        <p>
          El ejercicio de los derechos ARCO es <strong>gratuito</strong>. Sólo
          podríamos cobrar los costos justificados de envío, reproducción o
          certificación de documentos, conforme al artículo 35 LFPDPPP.
        </p>

        <h3>9.4. Autoridad</h3>
        <p>
          Si consideras que tu derecho no ha sido atendido correctamente puedes
          iniciar Procedimiento de Protección de Derechos ante el{' '}
          <strong>Instituto Nacional de Transparencia, Acceso a la Información
          y Protección de Datos Personales (INAI)</strong> dentro de los 15
          días hábiles siguientes a la respuesta o a la expiración del plazo
          legal. Portal:{' '}
          <a
            href="https://www.inai.org.mx"
            target="_blank"
            rel="noopener noreferrer"
          >
            inai.org.mx
          </a>.
        </p>

        <h3>9.5. Eliminación directa desde la app</h3>
        <p>
          Puedes también eliminar tu cuenta sin cruzar correo:
        </p>
        <ul>
          <li><strong>Web:</strong> <Link href="/perfil">/perfil</Link> → Zona peligrosa → Eliminar mi cuenta.</li>
          <li><strong>Mobile:</strong> Perfil → Eliminar cuenta (abre la web).</li>
        </ul>
        <p>
          La eliminación desde la app tiene el mismo efecto legal que una
          solicitud ARCO de cancelación: anonimización inmediata + hard-delete
          físico a 30 días.
        </p>
      </section>

      <section id="limitacion">
        <h2>10. Limitación del uso o divulgación</h2>
        <p>
          Conforme al artículo 16 fracción VI LFPDPPP, puedes limitar el uso o
          divulgación de tus datos por cualquiera de estas vías:
        </p>
        <ul>
          <li>
            Solicitar tu inscripción en el <strong>Registro Público para
            Evitar Publicidad</strong> (REPEP) de la Procuraduría Federal
            del Consumidor en{' '}
            <a
              href="https://repep.profeco.gob.mx"
              target="_blank"
              rel="noopener noreferrer"
            >
              repep.profeco.gob.mx
            </a>.
          </li>
          <li>
            Solicitar tu inscripción en nuestro listado interno de exclusión
            de comunicaciones enviando correo a{' '}
            <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>
              {LEGAL_ENTITY.privacyEmail}
            </a>.
          </li>
          <li>
            Darte de baja desde el enlace que aparece al pie de cada boletín.
          </li>
        </ul>
      </section>

      <section id="menores">
        <h2>11. Menores de edad</h2>
        <p>
          Rutas en MX no está dirigido a menores de <strong>13 años</strong>.
          Para la sección social (&ldquo;Conectar&rdquo;) requerimos edad
          mínima de 18 años. Para el resto del servicio, entre 13 y 17 años es
          necesario el consentimiento de quien ejerza la patria potestad o
          tutela (Art. 4 LFPDPPP).
        </p>
        <p>
          Si eres padre, madre o tutor y descubres que un menor bajo tu
          cuidado creó una cuenta sin tu consentimiento, escríbenos a{' '}
          <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>
            {LEGAL_ENTITY.privacyEmail}
          </a>{' '}
          y procederemos a su eliminación de manera inmediata.
        </p>
      </section>

      <section id="automatizadas">
        <h2>12. Decisiones automatizadas e inteligencia artificial</h2>
        <p>
          La función <strong>&ldquo;Autopilot&rdquo;</strong> utiliza un modelo
          de IA (Claude de Anthropic PBC) para generar sugerencias de
          itinerario a partir del prompt que tú escribes. El modelo no toma
          decisiones legales ni económicas automatizadas sobre ti (no
          calificamos crédito, no determinamos precios personalizados, no
          decidimos elegibilidad para servicios). Las sugerencias son
          orientativas — tú conservas el control total sobre tu viaje.
        </p>
        <p>
          Los prompts enviados a Anthropic contienen el texto que tú escribes
          (origen, destino, preferencias) pero <strong>no</strong> tu correo,
          nombre ni cualquier dato que te identifique directamente. Anthropic
          aplica sus propias políticas de privacidad y su DPA; ver{' '}
          <a
            href="https://www.anthropic.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            anthropic.com/privacy
          </a>.
        </p>
      </section>

      <section id="gdpr">
        <h2>13. Derechos adicionales para residentes de la UE (GDPR)</h2>
        <p>
          Si te encuentras en la Unión Europea, el Espacio Económico Europeo o
          el Reino Unido, el Reglamento (UE) 2016/679 te otorga, además de los
          derechos ARCO, los siguientes:
        </p>
        <ul>
          <li><strong>Limitación del tratamiento</strong> (Art. 18 RGPD).</li>
          <li><strong>Portabilidad</strong> en un formato estructurado (Art. 20 RGPD).</li>
          <li><strong>Oposición a decisiones automatizadas con efecto jurídico</strong> (Art. 22 RGPD).</li>
          <li><strong>Presentar reclamación ante una autoridad de control</strong> — en España la AEPD (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">aepd.es</a>), en tu país equivalente el DPA local.</li>
        </ul>
        <p>
          Base jurídica aplicable por categoría de tratamiento:
        </p>
        <ul>
          <li>Finalidades primarias: Art. 6.1(b) RGPD — ejecución de contrato.</li>
          <li>Prevención de fraude y seguridad: Art. 6.1(f) — interés legítimo.</li>
          <li>Cookies analíticas y boletines: Art. 6.1(a) — consentimiento.</li>
          <li>Cumplimiento de requerimientos legales: Art. 6.1(c).</li>
        </ul>
      </section>

      <section id="ccpa">
        <h2>14. Residentes de California (CCPA / CPRA)</h2>
        <p>Si eres residente de California, tienes además:</p>
        <ul>
          <li><strong>Right to know</strong> — qué categorías de información personal hemos recolectado en los últimos 12 meses.</li>
          <li><strong>Right to delete</strong> — solicitar la eliminación.</li>
          <li><strong>Right to correct</strong> — corregir información inexacta.</li>
          <li><strong>Right to opt-out of sale/sharing</strong> — <em>no aplica porque no vendemos ni compartimos información personal</em>.</li>
          <li><strong>Right to non-discrimination</strong> — no te trataremos distinto por ejercer tus derechos.</li>
        </ul>
        <p>
          Para ejercerlos escríbenos a{' '}
          <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>
            {LEGAL_ENTITY.privacyEmail}
          </a>{' '}
          con el asunto <em>&ldquo;CCPA request&rdquo;</em>.
        </p>
      </section>

      <section id="cambios">
        <h2>15. Cambios al aviso</h2>
        <p>
          Conforme al artículo 16 fracción VII LFPDPPP, te notificaremos
          cualquier cambio material a este Aviso por correo electrónico a tu
          dirección registrada con al menos <strong>15 días</strong> de
          anticipación a su entrada en vigor. Los cambios se reflejarán en el
          número de versión al inicio de este documento. El historial completo
          de versiones se publica en{' '}
          <Link href="/correcciones">/correcciones</Link>. Versión vigente:{' '}
          <strong>{LEGAL_ENTITY.version}</strong>, vigente desde{' '}
          {LEGAL_ENTITY.lastUpdated}.
        </p>
      </section>

      <section id="contacto">
        <h2>16. Contacto</h2>
        <ul>
          <li><strong>Responsable de privacidad:</strong> <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>{LEGAL_ENTITY.privacyEmail}</a></li>
          <li><strong>Asuntos legales:</strong> <a href={`mailto:${LEGAL_ENTITY.legalEmail}`}>{LEGAL_ENTITY.legalEmail}</a></li>
          <li><strong>Soporte general:</strong> <a href={`mailto:${LEGAL_ENTITY.supportEmail}`}>{LEGAL_ENTITY.supportEmail}</a></li>
          <li><strong>Teléfono:</strong> {LEGAL_ENTITY.phone}</li>
          <li><strong>Formulario:</strong> <Link href="/contacto">/contacto</Link></li>
        </ul>
      </section>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  English                                                             */
/* ─────────────────────────────────────────────────────────────────── */
function PrivacyEn() {
  return (
    <>
      <section id="resumen">
        <h2>Executive summary</h2>
        <p>
          <strong>{LEGAL_ENTITY.legalName}</strong> (&ldquo;
          {LEGAL_ENTITY.tradeName}&rdquo;, &ldquo;we&rdquo;) is the controller
          of your personal data. This notice complies with Mexico&rsquo;s{' '}
          <strong>LFPDPPP</strong> (Federal Personal Data Protection Law),
          articles 15 and 16, and its Regulations (arts. 26-28). Extended
          rights apply for EU and California residents.
        </p>
        <ul>
          <li><strong>What we collect:</strong> email, name, hashed password, user-generated content (trips, favourites, messages) and technical metadata.</li>
          <li><strong>What for:</strong> running the service you contracted, preventing fraud, legal compliance, and — with your consent — editorial newsletters.</li>
          <li><strong>What we never do:</strong> sell data, run third-party ad profiling, process sensitive categories.</li>
          <li><strong>Your rights:</strong> access, rectification, erasure, objection, consent withdrawal and portability. Email <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>{LEGAL_ENTITY.privacyEmail}</a>.</li>
          <li><strong>Supervisory authority:</strong> INAI — inai.org.mx.</li>
        </ul>
      </section>

      <section id="responsable">
        <h2>1. Data controller</h2>
        <ul>
          <li><strong>Legal name:</strong> {LEGAL_ENTITY.legalName}</li>
          <li><strong>Trade name:</strong> {LEGAL_ENTITY.tradeName}</li>
          <li><strong>Tax ID (RFC):</strong> {LEGAL_ENTITY.rfc}</li>
          <li><strong>Address:</strong> {LEGAL_ENTITY.address}</li>
          <li><strong>Privacy email:</strong> <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>{LEGAL_ENTITY.privacyEmail}</a></li>
          <li><strong>Phone:</strong> {LEGAL_ENTITY.phone}</li>
        </ul>
      </section>

      <section id="datos">
        <h2>2. Personal data we process</h2>
        <h3>2.1. Identity and contact</h3>
        <ul>
          <li>Name or alias.</li>
          <li>Email address.</li>
          <li>Password (bcrypt cost factor 12 — we never see the plaintext).</li>
          <li>Profile photo (only if you upload one).</li>
        </ul>
        <h3>2.2. Usage and user-generated content</h3>
        <ul>
          <li>Trips, itineraries, favourites, notes and preferences.</li>
          <li>Posts, comments and private messages when you use the social surface.</li>
          <li>City-level location derived from IP. Precise GPS, if enabled, stays on-device.</li>
        </ul>
        <h3>2.3. Financial data</h3>
        <p>
          We <strong>never store full card data</strong>. Payments flow through
          Stripe and/or Apple/Google IAP. We keep only an opaque subscription
          token, the last 4 digits and network of the card, and the billing
          history.
        </p>
        <h3>2.4. Technical metadata</h3>
        <ul>
          <li>IP address, device type, OS, browser.</li>
          <li>Access logs (90 days retention — security).</li>
          <li>Push token (when you install the mobile app and accept notifications).</li>
        </ul>
        <h3>2.5. What we do NOT collect</h3>
        <p>
          No sensitive categories in the sense of LFPDPPP art. 3(VI): racial
          or ethnic origin, health, genetic info, religious/philosophical
          beliefs, union membership, political opinions, sexual preference.
          Face ID / fingerprint biometry stays local.
        </p>
      </section>

      <section id="finalidades">
        <h2>3. Purposes of processing</h2>
        <h3>3.1. Primary purposes</h3>
        <ul>
          <li>Create and authenticate your account.</li>
          <li>Save and sync trips, favourites, notes.</li>
          <li>Charge subscriptions, issue receipts, handle refunds and cancellations.</li>
          <li>Enable the social surface when you opt in.</li>
          <li>Send transactional emails (confirmation, password reset, receipts, security alerts, legal changes).</li>
          <li>Generate itineraries with AI when you use &ldquo;Autopilot&rdquo;.</li>
          <li>Prevent fraud, abuse and automated scraping.</li>
          <li>Comply with tax and legal obligations.</li>
        </ul>
        <h3>3.2. Secondary purposes</h3>
        <ul>
          <li>Aggregate and anonymous product analytics.</li>
          <li>Editorial newsletter (opt-in, max 2 emails/month).</li>
          <li>Optional satisfaction surveys.</li>
        </ul>
        <p>
          You can opt out of secondary purposes anytime by emailing{' '}
          <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>
            {LEGAL_ENTITY.privacyEmail}
          </a>. Opting out has no impact on the contracted service.
        </p>
      </section>

      <section id="fundamento">
        <h2>4. Legal bases</h2>
        <ul>
          <li><strong>Mexico:</strong> Constitution art. 6 Apartado A fraction II and art. 16; LFPDPPP arts. 1, 3, 8, 15, 16, 22, 25, 28, 36; Regulations arts. 9, 26-28, 40-59, 89-104; INAI Privacy Notice Guidelines (DOF 17 Jan 2013).</li>
          <li><strong>EU (when applicable):</strong> GDPR (EU 2016/679) arts. 6, 13, 15-22.</li>
          <li><strong>California (when applicable):</strong> CCPA / CPRA.</li>
        </ul>
      </section>

      <section id="transferencias">
        <h2>5. Transfers and processors</h2>
        <p>
          Under LFPDPPP art. 36 and Regulations art. 68, these transfers do
          not require explicit consent because they are all processors acting
          only on our behalf under contract with confidentiality clauses and
          limited sub-processors.
        </p>
        <div className="not-prose overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 pr-4">Processor</th>
                <th className="py-2 pr-4">Purpose</th>
                <th className="py-2 pr-4">Data</th>
                <th className="py-2 pr-4">Country</th>
              </tr>
            </thead>
            <tbody>
              {PROCESSORS.map((p) => (
                <tr key={p.name} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-4 font-semibold">{p.name}</td>
                  <td className="py-2 pr-4">{p.purpose}</td>
                  <td className="py-2 pr-4">{p.dataSeen.join(', ')}</td>
                  <td className="py-2 pr-4">{p.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          International transfers rely on Standard Contractual Clauses and
          equivalent safeguards under INAI Criterion 1/2015. All data is
          encrypted in transit (TLS 1.3) and at rest (AES-256).
        </p>
      </section>

      <section id="cookies">
        <h2>6. Cookies &amp; similar technologies</h2>
        <ul>
          <li>
            <strong>Strictly necessary:</strong> <code>rutasmx_session</code>{' '}
            (signed JWT), <code>rutasmx_locale</code> (language). Required for
            the service to work.
          </li>
          <li>
            <strong>Analytics:</strong> only with consent; aggregate and
            anonymous.
          </li>
          <li>
            <strong>Third-party advertising:</strong>{' '}
            <strong>we do not use any</strong>.
          </li>
        </ul>
        <p>
          Manage preferences from the cookie banner or from{' '}
          <Link href="/perfil">/profile</Link> → Preferences → Cookies.
          Your choice is honoured for 12 months.
        </p>
      </section>

      <section id="conservacion">
        <h2>7. Retention</h2>
        <ul>
          <li><strong>Active account:</strong> while open.</li>
          <li><strong>Deleted account:</strong> personal data anonymised immediately; physical data hard-deleted after <strong>30 days</strong>.</li>
          <li><strong>Billing:</strong> 5 years (tax law).</li>
          <li><strong>Security logs:</strong> 90 days.</li>
          <li><strong>Access logs:</strong> 5 years (LFPDPPP art. 62).</li>
          <li><strong>Aggregate analytics:</strong> up to 26 months, no identifiers.</li>
          <li><strong>Encrypted backups:</strong> 30-day rotation.</li>
        </ul>
      </section>

      <section id="seguridad">
        <h2>8. Security measures</h2>
        <ul>
          <li>TLS 1.3 in transit.</li>
          <li>AES-256 at rest.</li>
          <li>bcrypt cost factor 12 for passwords.</li>
          <li>Least-privilege access control.</li>
          <li>Environment segregation.</li>
          <li>Quarterly audits, annual pen-test.</li>
          <li>Signed access logs.</li>
          <li>Incident response plan under LFPDPPP art. 20.</li>
        </ul>
        <p>
          <strong>Breach notification.</strong> If a security breach affecting
          rights of data subjects occurs, we notify users and INAI within{' '}
          <strong>72 hours</strong> of detection (LFPDPPP art. 20;
          Regulations art. 64).
        </p>
      </section>

      <section id="arco">
        <h2>9. Access, rectification, erasure, objection (ARCO)</h2>
        <p>
          Email <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>{LEGAL_ENTITY.privacyEmail}</a>{' '}
          with subject <em>&ldquo;ARCO request — [right]&rdquo;</em>, attaching:
        </p>
        <ul>
          <li>Full name and registered email.</li>
          <li>Copy of government-issued ID (or notarised power of attorney).</li>
          <li>Clear description of the right being exercised and the data.</li>
        </ul>
        <p>
          Timeline: acknowledgement within <strong>20 business days</strong>,
          effective response within an additional <strong>15 business days</strong>{' '}
          — 35 business days max per LFPDPPP art. 32. Exercising ARCO is{' '}
          <strong>free</strong>.
        </p>
        <p>
          You can also delete your account in-app: web at{' '}
          <Link href="/perfil">/profile</Link> → Danger zone; mobile at Profile
          → Delete account.
        </p>
      </section>

      <section id="limitacion">
        <h2>10. Limiting use or disclosure</h2>
        <p>
          Per LFPDPPP art. 16(VI) you can limit use or disclosure by
          registering with PROFECO&rsquo;s{' '}
          <a
            href="https://repep.profeco.gob.mx"
            target="_blank"
            rel="noopener noreferrer"
          >
            REPEP
          </a>, emailing us, or unsubscribing from any newsletter footer.
        </p>
      </section>

      <section id="menores">
        <h2>11. Minors</h2>
        <p>
          Not directed at children under <strong>13</strong>. Social surface
          requires 18+. Between 13 and 17, parental/guardian consent is
          required (LFPDPPP art. 4). Parents/guardians who discover an
          unauthorised minor account can email{' '}
          <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>{LEGAL_ENTITY.privacyEmail}</a>{' '}
          for immediate removal.
        </p>
      </section>

      <section id="automatizadas">
        <h2>12. Automated decisions and AI</h2>
        <p>
          &ldquo;Autopilot&rdquo; uses Claude (Anthropic PBC) to generate
          itinerary suggestions from your prompt. No automated legal or
          economic decisions are taken about you. Prompts don&rsquo;t include
          your email/name/identifiers. Anthropic&rsquo;s own privacy
          practices: <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer">anthropic.com/privacy</a>.
        </p>
      </section>

      <section id="gdpr">
        <h2>13. EU residents (GDPR)</h2>
        <p>If you are in the EU, EEA, or UK, in addition to ARCO you have:</p>
        <ul>
          <li>Restriction (Art. 18).</li>
          <li>Portability (Art. 20).</li>
          <li>Objection to solely-automated decisions with legal effects (Art. 22).</li>
          <li>Lodge a complaint with a supervisory authority (your national DPA).</li>
        </ul>
      </section>

      <section id="ccpa">
        <h2>14. California residents (CCPA / CPRA)</h2>
        <ul>
          <li>Right to know what categories of personal info we collected in the past 12 months.</li>
          <li>Right to delete.</li>
          <li>Right to correct inaccurate information.</li>
          <li>Right to opt-out of sale/sharing — <em>not applicable, we do not sell or share</em>.</li>
          <li>Right to non-discrimination.</li>
        </ul>
      </section>

      <section id="cambios">
        <h2>15. Changes to this notice</h2>
        <p>
          Material changes are notified by email at least <strong>15 days</strong>{' '}
          in advance. Version history at{' '}
          <Link href="/correcciones">/corrections</Link>. Current version:{' '}
          <strong>{LEGAL_ENTITY.version}</strong>, effective from{' '}
          {LEGAL_ENTITY.lastUpdated}.
        </p>
      </section>

      <section id="contacto">
        <h2>16. Contact</h2>
        <ul>
          <li><strong>Privacy officer:</strong> <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>{LEGAL_ENTITY.privacyEmail}</a></li>
          <li><strong>Legal matters:</strong> <a href={`mailto:${LEGAL_ENTITY.legalEmail}`}>{LEGAL_ENTITY.legalEmail}</a></li>
          <li><strong>General support:</strong> <a href={`mailto:${LEGAL_ENTITY.supportEmail}`}>{LEGAL_ENTITY.supportEmail}</a></li>
          <li><strong>Phone:</strong> {LEGAL_ENTITY.phone}</li>
          <li><strong>Form:</strong> <Link href="/contacto">/contact</Link></li>
        </ul>
      </section>
    </>
  );
}
