/**
 * Identidad legal del responsable del tratamiento de datos personales.
 *
 * ============================================================================
 * 🔴 ACCIÓN REQUERIDA — rellenar antes del deploy productivo.
 *
 * LFPDPPP Art. 16, fracción I, y Reglamento Art. 26 fracción I exigen que el
 * Aviso de Privacidad identifique CLARAMENTE al responsable. Si lanzas sin
 * llenar estos valores el aviso es legalmente insuficiente y el INAI te
 * puede multar (hasta 320,000 UMAs ≈ $35 MDP) — ver Art. 64 LFPDPPP.
 *
 * Apple App Review Guideline 5.1.1 y Google Play Developer Policy también
 * exigen poder identificar al developer; si el aviso dice "[RAZÓN SOCIAL]"
 * literal, el review se rechaza.
 * ============================================================================
 *
 * Cómo llenar:
 *  - Si operas como Persona Física con Actividad Empresarial: usa tu nombre
 *    completo como `legalName`, tu RFC con homoclave, y el domicilio fiscal.
 *  - Si es Persona Moral (S.A. de C.V., S. de R.L., S.A.P.I., etc.): razón
 *    social completa incluyendo el tipo societario, RFC moral y domicilio
 *    social.
 *  - El email de privacidad puede ser privacidad@rutasenmx.com o
 *    legal@rutasenmx.com — lo importante es que exista un buzón activo
 *    atendido por una persona responsable (obligación de art. 30 LFPDPPP).
 *  - El domicilio debe ser el que tengas en la constancia de situación
 *    fiscal ante el SAT. NO uses un apartado postal (LFPDPPP exige
 *    domicilio físico donde se pueda hacer notificación legal).
 */

export const LEGAL_ENTITY = {
  /** Razón social completa. Ej.: "Rutas en MX, S. de R.L. de C.V." o tu nombre si eres persona física. */
  legalName: '[RAZÓN SOCIAL COMPLETA]',

  /** Nombre comercial de cara al público. */
  tradeName: 'Rutas en MX',

  /** Dominio principal. */
  domain: 'rutasenmx.com',

  /** RFC con homoclave. */
  rfc: '[RFC]',

  /** Domicilio fiscal completo (calle, número, colonia, alcaldía/municipio, CP, estado). */
  address: '[CALLE Y NÚMERO], [COLONIA], [ALCALDÍA/MUNICIPIO], CP [CP], Ciudad de México, México',

  /** Teléfono de contacto (opcional pero recomendado por INAI). */
  phone: '[TELÉFONO CON LADA]',

  /** Email para solicitudes ARCO y asuntos de privacidad. */
  privacyEmail: 'privacidad@rutasenmx.com',

  /** Email para asuntos legales generales. */
  legalEmail: 'legal@rutasenmx.com',

  /** Email para soporte. */
  supportEmail: 'soporte@rutasenmx.com',

  /** Jurisdicción para controversias (Art. 1093 Código Comercio). */
  jurisdiction: 'Ciudad de México, México',

  /** Fecha de última actualización del aviso — usada en la UI para mostrar "vigente desde…". */
  lastUpdated: '2026-04-24',

  /** Versión del documento (incrementa cuando publiques cambios materiales). */
  version: 'v3.0',
} as const;

/** Convenience — dirección HTML-ready para los avisos. */
export function fullAddressHtml(): string {
  return LEGAL_ENTITY.address;
}

/**
 * Lista CERRADA de encargados (processors) que tratan datos personales por
 * cuenta del responsable. LFPDPPP Art. 3 fracción IX + Reglamento Art. 49-52
 * exige identificar las transferencias + los tipos de datos que ven.
 *
 * Si añades un nuevo proveedor que procese datos personales, debes:
 *   1. Añadirlo aquí.
 *   2. Actualizar `version` + `lastUpdated` arriba.
 *   3. Notificar a usuarios activos por email con 15 días de anticipación
 *      (Reglamento Art. 25 último párrafo).
 */
export interface Processor {
  name: string;
  purpose: string;
  dataSeen: string[];
  country: string;
  /** URL a su DPA (Data Processing Agreement) público o a sus términos. */
  agreement: string;
}

export const PROCESSORS: Processor[] = [
  {
    name: 'Stripe Payments Mexico, S. de R.L. de C.V.',
    purpose: 'Procesamiento de pagos con tarjeta y suscripciones.',
    dataSeen: [
      'Nombre',
      'Correo electrónico',
      'País',
      'Últimos 4 dígitos y red de la tarjeta',
      'Dirección IP',
    ],
    country: 'México (entidad local) / Estados Unidos (infraestructura)',
    agreement: 'https://stripe.com/legal/dpa',
  },
  {
    name: 'RevenueCat Inc.',
    purpose:
      'Conciliación de compras In-App en iOS / Android y sincronización de permisos (entitlements) con nuestro backend.',
    dataSeen: [
      'ID de usuario de la aplicación (interno, no el correo)',
      'Identificadores del dispositivo (IDFA de Apple / ADID de Google) cuando el usuario no los deshabilita',
      'Historial de compras in-app',
    ],
    country: 'Estados Unidos',
    agreement: 'https://www.revenuecat.com/dpa/',
  },
  {
    name: 'Apple Inc.',
    purpose:
      'Distribución de la app móvil en App Store y procesamiento de compras In-App en dispositivos iOS.',
    dataSeen: [
      'Identificador de la cuenta Apple ID (al comprar IAP)',
      'Historial de transacciones IAP',
    ],
    country: 'Estados Unidos / Irlanda',
    agreement: 'https://www.apple.com/legal/privacy/data/en/apple-developer/',
  },
  {
    name: 'Google LLC',
    purpose:
      'Distribución de la app móvil en Google Play y procesamiento de compras In-App en dispositivos Android.',
    dataSeen: [
      'Identificador de la cuenta Google Play',
      'Historial de transacciones IAP',
    ],
    country: 'Estados Unidos',
    agreement: 'https://policies.google.com/privacy',
  },
  {
    name: 'Anthropic PBC',
    purpose:
      'Generación de itinerarios por inteligencia artificial (función "Autopilot"). Los prompts se envían a la API de Claude.',
    dataSeen: [
      'Texto del prompt (origen, destino, preferencias de viaje — NO tu correo ni identificador)',
      'Respuesta generada',
    ],
    country: 'Estados Unidos',
    agreement: 'https://www.anthropic.com/legal/commercial-terms',
  },
  {
    name: 'Neon Inc.',
    purpose: 'Base de datos Postgres administrada (persistencia de toda la información de cuenta y contenido).',
    dataSeen: [
      'Todo lo que la plataforma guarda (nombre, correo, contraseña cifrada, viajes, mensajes, fotos, favoritos, etc.)',
    ],
    country: 'Estados Unidos',
    agreement: 'https://neon.tech/dpa',
  },
  {
    name: 'Vercel Inc.',
    purpose:
      'Hosting del sitio web, ejecución del backend (serverless functions), CDN y logs operativos.',
    dataSeen: [
      'Dirección IP',
      'User-Agent',
      'Cabeceras HTTP',
      'Respuestas y errores del servidor',
    ],
    country: 'Estados Unidos / global (CDN)',
    agreement: 'https://vercel.com/legal/dpa',
  },
  {
    name: 'Cloudflare, Inc.',
    purpose:
      'Almacenamiento de objetos S3-compatible (R2) para imágenes de perfil social y adjuntos de publicaciones.',
    dataSeen: ['Archivos que subes explícitamente (fotos, PDFs)'],
    country: 'Estados Unidos / global',
    agreement: 'https://www.cloudflare.com/cloudflare-customer-dpa/',
  },
  {
    name: 'Resend, Inc.',
    purpose:
      'Envío de correos transaccionales (bienvenida, restablecer contraseña, recibos, notificaciones).',
    dataSeen: ['Correo electrónico', 'Nombre', 'Contenido del correo enviado'],
    country: 'Estados Unidos',
    agreement: 'https://resend.com/legal/dpa',
  },
  {
    name: 'Mapbox, Inc.',
    purpose:
      'Servicio de mapas interactivos (tiles), geocoding de ciudades y rutas.',
    dataSeen: [
      'Dirección IP',
      'Tokens de sesión del mapa',
      'Consultas de geocoding (texto que escribes al buscar un lugar)',
    ],
    country: 'Estados Unidos',
    agreement: 'https://www.mapbox.com/legal/tos',
  },
  {
    name: 'Expo (650 Industries, Inc.)',
    purpose:
      'Envío de notificaciones push al dispositivo móvil a través de la Expo Push API.',
    dataSeen: [
      'Token de push del dispositivo',
      'Contenido del mensaje de notificación (título y preview)',
    ],
    country: 'Estados Unidos',
    agreement: 'https://expo.dev/privacy',
  },
];
