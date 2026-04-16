export const APP_NAME = 'Rutas en MX';
export const APP_DOMAIN = 'rutasenmx.com';
export const APP_URL = 'https://rutasenmx.com';
export const APP_DESCRIPTION = 'Planea rutas por México, descubre Pueblos Mágicos, museos, zonas arqueológicas y escapadas por carretera con mapas, ideas de viaje e itinerarios.';
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
  free: { maxSavedTrips: 1, maxStopsPerTrip: 7 },
  basic: { maxSavedTrips: 3, maxStopsPerTrip: 20 },
  pro: { maxSavedTrips: 5, maxStopsPerTrip: 50 },
  premium: { maxSavedTrips: Infinity, maxStopsPerTrip: 150 },
} as const;

export const DISCOVERY_RADII = [5, 10, 25, 50] as const;

export const ESTADOS_MEXICO = [
  { name: 'Aguascalientes', slug: 'aguascalientes', abbr: 'AGS' },
  { name: 'Baja California', slug: 'baja-california', abbr: 'BC' },
  { name: 'Baja California Sur', slug: 'baja-california-sur', abbr: 'BCS' },
  { name: 'Campeche', slug: 'campeche', abbr: 'CAM' },
  { name: 'Chiapas', slug: 'chiapas', abbr: 'CHIS' },
  { name: 'Chihuahua', slug: 'chihuahua', abbr: 'CHIH' },
  { name: 'Ciudad de México', slug: 'ciudad-de-mexico', abbr: 'CDMX' },
  { name: 'Coahuila', slug: 'coahuila', abbr: 'COAH' },
  { name: 'Colima', slug: 'colima', abbr: 'COL' },
  { name: 'Durango', slug: 'durango', abbr: 'DGO' },
  { name: 'Estado de México', slug: 'estado-de-mexico', abbr: 'MEX' },
  { name: 'Guanajuato', slug: 'guanajuato', abbr: 'GTO' },
  { name: 'Guerrero', slug: 'guerrero', abbr: 'GRO' },
  { name: 'Hidalgo', slug: 'hidalgo', abbr: 'HGO' },
  { name: 'Jalisco', slug: 'jalisco', abbr: 'JAL' },
  { name: 'Michoacán', slug: 'michoacan', abbr: 'MICH' },
  { name: 'Morelos', slug: 'morelos', abbr: 'MOR' },
  { name: 'Nayarit', slug: 'nayarit', abbr: 'NAY' },
  { name: 'Nuevo León', slug: 'nuevo-leon', abbr: 'NL' },
  { name: 'Oaxaca', slug: 'oaxaca', abbr: 'OAX' },
  { name: 'Puebla', slug: 'puebla', abbr: 'PUE' },
  { name: 'Querétaro', slug: 'queretaro', abbr: 'QRO' },
  { name: 'Quintana Roo', slug: 'quintana-roo', abbr: 'QROO' },
  { name: 'San Luis Potosí', slug: 'san-luis-potosi', abbr: 'SLP' },
  { name: 'Sinaloa', slug: 'sinaloa', abbr: 'SIN' },
  { name: 'Sonora', slug: 'sonora', abbr: 'SON' },
  { name: 'Tabasco', slug: 'tabasco', abbr: 'TAB' },
  { name: 'Tamaulipas', slug: 'tamaulipas', abbr: 'TAMPS' },
  { name: 'Tlaxcala', slug: 'tlaxcala', abbr: 'TLAX' },
  { name: 'Veracruz', slug: 'veracruz', abbr: 'VER' },
  { name: 'Yucatán', slug: 'yucatan', abbr: 'YUC' },
  { name: 'Zacatecas', slug: 'zacatecas', abbr: 'ZAC' },
] as const;

export const PLACE_CATEGORIES = [
  { slug: 'pueblos-magicos', name: 'Pueblos Mágicos', icon: 'sparkles', color: '#C4532B' },
  { slug: 'museos', name: 'Museos', icon: 'landmark', color: '#8B5CF6' },
  { slug: 'zonas-arqueologicas', name: 'Zonas arqueológicas', icon: 'pyramid', color: '#D97706' },
  { slug: 'sitios-inah', name: 'Sitios INAH', icon: 'building', color: '#B45309' },
  { slug: 'centros-historicos', name: 'Centros históricos', icon: 'church', color: '#9F1239' },
  { slug: 'haciendas', name: 'Haciendas', icon: 'home', color: '#A16207' },
  { slug: 'playas', name: 'Playas', icon: 'waves', color: '#0891B2' },
  { slug: 'cenotes', name: 'Cenotes', icon: 'droplets', color: '#0E7490' },
  { slug: 'cascadas', name: 'Cascadas', icon: 'mountain-snow', color: '#059669' },
  { slug: 'bosques-sierras', name: 'Bosques y sierras', icon: 'trees', color: '#16A34A' },
  { slug: 'areas-protegidas', name: 'Áreas naturales protegidas', icon: 'leaf', color: '#15803D' },
  { slug: 'vinedos', name: 'Viñedos', icon: 'grape', color: '#7C3AED' },
  { slug: 'turismo-comunitario', name: 'Turismo comunitario', icon: 'users', color: '#E11D48' },
  { slug: 'mercados', name: 'Mercados', icon: 'store', color: '#EA580C' },
  { slug: 'restaurantes', name: 'Restaurantes', icon: 'utensils', color: '#DC2626' },
  { slug: 'cafeterias', name: 'Cafeterías', icon: 'coffee', color: '#92400E' },
  { slug: 'comida-regional', name: 'Comida regional', icon: 'chef-hat', color: '#B91C1C' },
  { slug: 'hoteles', name: 'Hoteles', icon: 'bed', color: '#4F46E5' },
  { slug: 'cabanas', name: 'Cabañas', icon: 'tent', color: '#7C3AED' },
  { slug: 'glamping', name: 'Glamping', icon: 'tent', color: '#6D28D9' },
  { slug: 'campings', name: 'Campings', icon: 'flame', color: '#C2410C' },
  { slug: 'balnearios', name: 'Balnearios', icon: 'waves', color: '#06B6D4' },
  { slug: 'grutas', name: 'Grutas', icon: 'mountain', color: '#78716C' },
  { slug: 'parques-tematicos', name: 'Parques temáticos', icon: 'ferris-wheel', color: '#F59E0B' },
  { slug: 'eventos-festivales', name: 'Eventos y festivales', icon: 'party-popper', color: '#E11D48' },
  { slug: 'gasolineras', name: 'Gasolineras', icon: 'fuel', color: '#64748B' },
  { slug: 'casetas', name: 'Casetas', icon: 'toll', color: '#475569' },
  { slug: 'paradas-utiles', name: 'Paradas útiles', icon: 'circle-parking', color: '#6B7280' },
  { slug: 'talleres-auxilio', name: 'Talleres y auxilio vial', icon: 'wrench', color: '#374151' },
  { slug: 'tours-guias', name: 'Tours y guías', icon: 'map', color: '#2563EB' },
  { slug: 'rutas-curadas', name: 'Rutas curadas', icon: 'route', color: '#7C3AED' },
  { slug: 'miradores', name: 'Miradores', icon: 'eye', color: '#059669' },
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
