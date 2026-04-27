export const APP_NAME = 'Rutas en MX';
export const APP_DOMAIN = 'rutasenmx.com';
export const APP_URL = 'https://rutasenmx.com';
export const APP_DESCRIPTION = 'Planea rutas por M\u00e9xico, descubre Pueblos M\u00e1gicos, museos, zonas arqueol\u00f3gicas y escapadas por carretera con mapas, ideas de viaje e itinerarios.';
export const APP_LOCALE = 'es_MX';
export const APP_LANGUAGE = 'es';
export const APP_CURRENCY = 'MXN';
export const APP_COUNTRY = 'MX';

export const MEXICO_CENTER = { lat: 23.6345, lng: -102.5528 };
export const MEXICO_BOUNDS = {
  north: 32.72,
  south: 14.53,
  east: -86.71,
  west: -118.40,
};
export const MEXICO_ZOOM = 5;

export const PLAN_LIMITS = {
  free:    { maxSavedTrips: 1,        maxStopsPerTrip: 7,   aiAutopilotMonthly: 0  },
  pro:     { maxSavedTrips: 10,       maxStopsPerTrip: 50,  aiAutopilotMonthly: 3  },
  premium: { maxSavedTrips: Infinity, maxStopsPerTrip: 150, aiAutopilotMonthly: 15 },
} as const;

export const DISCOVERY_RADII = [5, 10, 25, 50] as const;

export const ESTADOS_MEXICO = [
  { name: 'Aguascalientes', slug: 'aguascalientes', abbr: 'AGS' },
  { name: 'Baja California', slug: 'baja-california', abbr: 'BC' },
  { name: 'Baja California Sur', slug: 'baja-california-sur', abbr: 'BCS' },
  { name: 'Campeche', slug: 'campeche', abbr: 'CAM' },
  { name: 'Chiapas', slug: 'chiapas', abbr: 'CHIS' },
  { name: 'Chihuahua', slug: 'chihuahua', abbr: 'CHIH' },
  { name: 'Ciudad de M\u00e9xico', slug: 'ciudad-de-mexico', abbr: 'CDMX' },
  { name: 'Coahuila', slug: 'coahuila', abbr: 'COAH' },
  { name: 'Colima', slug: 'colima', abbr: 'COL' },
  { name: 'Durango', slug: 'durango', abbr: 'DGO' },
  { name: 'Estado de M\u00e9xico', slug: 'estado-de-mexico', abbr: 'MEX' },
  { name: 'Guanajuato', slug: 'guanajuato', abbr: 'GTO' },
  { name: 'Guerrero', slug: 'guerrero', abbr: 'GRO' },
  { name: 'Hidalgo', slug: 'hidalgo', abbr: 'HGO' },
  { name: 'Jalisco', slug: 'jalisco', abbr: 'JAL' },
  { name: 'Michoac\u00e1n', slug: 'michoacan', abbr: 'MICH' },
  { name: 'Morelos', slug: 'morelos', abbr: 'MOR' },
  { name: 'Nayarit', slug: 'nayarit', abbr: 'NAY' },
  { name: 'Nuevo Le\u00f3n', slug: 'nuevo-leon', abbr: 'NL' },
  { name: 'Oaxaca', slug: 'oaxaca', abbr: 'OAX' },
  { name: 'Puebla', slug: 'puebla', abbr: 'PUE' },
  { name: 'Quer\u00e9taro', slug: 'queretaro', abbr: 'QRO' },
  { name: 'Quintana Roo', slug: 'quintana-roo', abbr: 'QROO' },
  { name: 'San Luis Potos\u00ed', slug: 'san-luis-potosi', abbr: 'SLP' },
  { name: 'Sinaloa', slug: 'sinaloa', abbr: 'SIN' },
  { name: 'Sonora', slug: 'sonora', abbr: 'SON' },
  { name: 'Tabasco', slug: 'tabasco', abbr: 'TAB' },
  { name: 'Tamaulipas', slug: 'tamaulipas', abbr: 'TAMPS' },
  { name: 'Tlaxcala', slug: 'tlaxcala', abbr: 'TLAX' },
  { name: 'Veracruz', slug: 'veracruz', abbr: 'VER' },
  { name: 'Yucat\u00e1n', slug: 'yucatan', abbr: 'YUC' },
  { name: 'Zacatecas', slug: 'zacatecas', abbr: 'ZAC' },
] as const;

export const PLACE_CATEGORIES = [
  { slug: 'pueblos-magicos', name: 'Pueblos M\u00e1gicos', icon: 'sparkles', color: '#06C167', emoji: '\u2728', iconSvg: '/icon/pueblomagicoicon.svg' },
  { slug: 'museos', name: 'Museos', icon: 'landmark', color: '#8B5CF6', emoji: '\uD83C\uDFDB\uFE0F', iconSvg: '/icon/museumicon.svg' },
  { slug: 'zonas-arqueologicas', name: 'Zonas arqueol\u00f3gicas', icon: 'pyramid', color: '#D97706', emoji: '\uD83C\uDFFA', iconSvg: '/icon/arqueologiaicon.svg' },
  { slug: 'centros-historicos', name: 'Centros hist\u00f3ricos', icon: 'church', color: '#DC2626', emoji: '\u26EA', iconSvg: '/icon/CentroHistoricoicon.svg' },
  { slug: 'haciendas', name: 'Haciendas', icon: 'home', color: '#E11D48', emoji: '\uD83C\uDFE1', iconSvg: '/icon/Haciendaicon.svg' },
  { slug: 'playas', name: 'Playas', icon: 'waves', color: '#0EA5E9', emoji: '\uD83C\uDFD6\uFE0F', iconSvg: '/icon/playaicon.svg' },
  { slug: 'cascadas', name: 'Cascadas', icon: 'mountain-snow', color: '#3B82F6', emoji: '\uD83C\uDF0A' },
  { slug: 'bosques-sierras', name: 'Bosques y sierras', icon: 'trees', color: '#16A34A', emoji: '\uD83C\uDF32' },
  { slug: 'areas-protegidas', name: '\u00c1reas naturales protegidas', icon: 'leaf', color: '#15803D', emoji: '\uD83C\uDF3F' },
  { slug: 'vinedos', name: 'Vi\u00f1edos', icon: 'grape', color: '#7C3AED', emoji: '\uD83C\uDF47' },
  { slug: 'turismo-comunitario', name: 'Turismo comunitario', icon: 'users', color: '#E11D48', emoji: '\uD83E\uDDD1\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1' },
  { slug: 'mercados', name: 'Mercados', icon: 'store', color: '#EA580C', emoji: '\uD83C\uDFEA' },
  { slug: 'restaurantes', name: 'Restaurantes', icon: 'utensils', color: '#DC2626', emoji: '\uD83C\uDF7D\uFE0F' },
  { slug: 'cafeterias', name: 'Cafeter\u00edas', icon: 'coffee', color: '#92400E', emoji: '\u2615' },
  { slug: 'comida-regional', name: 'Comida regional', icon: 'chef-hat', color: '#B91C1C', emoji: '\uD83C\uDF2E' },
  { slug: 'hoteles', name: 'Hoteles', icon: 'bed', color: '#4F46E5', emoji: '\uD83C\uDFE8' },
  { slug: 'cabanas', name: 'Caba\u00f1as', icon: 'tent', color: '#7C3AED', emoji: '\uD83C\uDFE0' },
  { slug: 'glamping', name: 'Glamping', icon: 'tent', color: '#6D28D9', emoji: '\u26FA' },
  { slug: 'campings', name: 'Campings', icon: 'flame', color: '#C2410C', emoji: '\uD83C\uDFD5\uFE0F' },
  { slug: 'balnearios', name: 'Balnearios', icon: 'waves', color: '#06B6D4', emoji: '\uD83C\uDFCA' },
  { slug: 'grutas', name: 'Grutas', icon: 'mountain', color: '#78716C', emoji: '\uD83E\uDEA8' },
  { slug: 'parques-tematicos', name: 'Parques tem\u00e1ticos', icon: 'ferris-wheel', color: '#F59E0B', emoji: '\uD83C\uDFA2' },
  { slug: 'eventos-festivales', name: 'Eventos y festivales', icon: 'party-popper', color: '#E11D48', emoji: '\uD83C\uDF89' },
  { slug: 'gasolineras', name: 'Gasolineras', icon: 'fuel', color: '#64748B', emoji: '\u26FD' },
  { slug: 'casetas', name: 'Casetas', icon: 'toll', color: '#475569', emoji: '\uD83D\uDEE3\uFE0F' },
  { slug: 'paradas-utiles', name: 'Paradas \u00fatiles', icon: 'circle-parking', color: '#6B7280', emoji: '\uD83C\uDD7F\uFE0F' },
  { slug: 'talleres-auxilio', name: 'Talleres y auxilio vial', icon: 'wrench', color: '#374151', emoji: '\uD83D\uDD27' },
  { slug: 'tours-guias', name: 'Tours y gu\u00edas', icon: 'map', color: '#2563EB', emoji: '\uD83D\uDDFA\uFE0F' },
  { slug: 'rutas-curadas', name: 'Rutas curadas', icon: 'route', color: '#7C3AED', emoji: '\uD83D\uDEA9' },
  { slug: 'miradores', name: 'Miradores', icon: 'eye', color: '#059669', emoji: '\uD83D\uDC41\uFE0F' },
] as const;

export const TRAVELER_TYPES = [
  'familia', 'pareja', 'solo', 'con-mascotas', 'accesible',
  'bajo-presupuesto', 'premium', 'foodie', 'cultural',
  'naturaleza', 'aventura',
] as const;

export const BUDGET_LEVELS = ['economico', 'moderado', 'premium', 'lujo'] as const;

export const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'fbclid', 'ref', 'mc_cid', 'mc_eid',
] as const;

export const UI_PARAMS = [
  'map', 'list', 'sort', 'view', 'panel', 'sheet', 'modal', 'tab',
] as const;
