/**
 * Fallback lat/lng for common Mexican cities & towns. Used to attach
 * coordinates to route stops whose `placeSlug` doesn't resolve to a place in
 * `mockPlaces`. This guarantees every route renders with at least start/end
 * pins and a trace line.
 *
 * Coordinates were verified against INEGI / Google Maps municipal centroids.
 */

export interface CityCoord {
  lat: number;
  lng: number;
}

/**
 * Map keyed by slug (lowercased, ASCII-folded, hyphenated) → coord.
 * Keep the list sorted alphabetically for easier maintenance.
 */
export const CITY_COORDS: Record<string, CityCoord> = {
  // ——————————— A ———————————
  'acapulco':           { lat: 16.8531, lng: -99.8237 },
  'acaponeta':          { lat: 22.4932, lng: -105.3644 },
  'aguascalientes':     { lat: 21.8853, lng: -102.2916 },
  'ajijic':             { lat: 20.2975, lng: -103.2554 },
  'alamos':             { lat: 27.0281, lng: -108.9367 },
  'amealco':            { lat: 20.1878, lng: -100.1433 },
  'amealco-de-bonfil':  { lat: 20.1878, lng: -100.1433 },
  'angangueo':          { lat: 19.6167, lng: -100.2889 },
  'atlixco':            { lat: 18.9081, lng: -98.4373 },
  // ——————————— B ———————————
  'bacalar':            { lat: 18.6784, lng: -88.3886 },
  'bahuichivo':         { lat: 27.3333, lng: -108.2 },
  'batopilas':          { lat: 27.0203, lng: -107.7478 },
  'bernal':             { lat: 20.7466, lng: -99.9499 },
  // ——————————— C ———————————
  'calvillo':           { lat: 21.8467, lng: -102.7167 },
  'campeche':           { lat: 19.8301, lng: -90.5349 },
  'campeche-city':      { lat: 19.8301, lng: -90.5349 },
  'cancun':             { lat: 21.1619, lng: -86.8515 },
  'capulalpam':         { lat: 17.3078, lng: -96.4461 },
  'casas-grandes':      { lat: 30.3700, lng: -107.9500 },
  'celaya':             { lat: 20.5235, lng: -100.8156 },
  'celestun':           { lat: 20.8667, lng: -90.4000 },
  'chetumal':           { lat: 18.5001, lng: -88.2960 },
  'chiapa-de-corzo':    { lat: 16.7094, lng: -93.0192 },
  'chichen-itza':       { lat: 20.6843, lng: -88.5678 },
  'chihuahua':          { lat: 28.6353, lng: -106.0889 },
  'chihuahua-city':     { lat: 28.6353, lng: -106.0889 },
  'cholula':            { lat: 19.0625, lng: -98.3000 },
  'coatepec':           { lat: 19.4500, lng: -96.9500 },
  'coba':               { lat: 20.4917, lng: -87.7322 },
  'colima':             { lat: 19.2452, lng: -103.7241 },
  'comala':             { lat: 19.3244, lng: -103.7606 },
  'comitan':            { lat: 16.2500, lng: -92.1333 },
  'copper-canyon':      { lat: 27.5000, lng: -108.0000 },
  'cosala':             { lat: 24.4122, lng: -106.6928 },
  'cuatro-cienegas':    { lat: 26.9858, lng: -102.0700 },
  'coyoacan':           { lat: 19.3467, lng: -99.1617 },
  'creel':              { lat: 27.7508, lng: -107.6358 },
  'cuernavaca':         { lat: 18.9242, lng: -99.2216 },
  'cuetzalan':          { lat: 20.0144, lng: -97.5272 },
  'culiacan':           { lat: 24.7993, lng: -107.3938 },
  // ——————————— D ———————————
  'divisadero':         { lat: 27.5342, lng: -107.8258 },
  'dolores-hidalgo':    { lat: 21.1564, lng: -100.9320 },
  'durango':            { lat: 24.0277, lng: -104.6532 },
  // ——————————— E ———————————
  'el-fuerte':          { lat: 26.4189, lng: -108.6200 },
  'el-oro':             { lat: 19.8042, lng: -100.1333 },
  'ensenada':           { lat: 31.8667, lng: -116.5964 },
  // ——————————— G ———————————
  'guadalajara':        { lat: 20.6597, lng: -103.3496 },
  'guanajuato':         { lat: 21.0190, lng: -101.2574 },
  'guanajuato-capital': { lat: 21.0190, lng: -101.2574 },
  'guaymas':            { lat: 27.9183, lng: -110.8989 },
  // ——————————— H ———————————
  'hermosillo':         { lat: 29.0729, lng: -110.9559 },
  'holbox':             { lat: 21.5242, lng: -87.3783 },
  'huasca':             { lat: 20.2008, lng: -98.5772 },
  'huasca-de-ocampo':   { lat: 20.2008, lng: -98.5772 },
  'huatulco':           { lat: 15.7741, lng: -96.1349 },
  // ——————————— I ———————————
  'isla-mujeres':       { lat: 21.2344, lng: -86.7300 },
  'ixtapa':             { lat: 17.6567, lng: -101.6511 },
  'ixtapan-de-la-sal':  { lat: 18.8333, lng: -99.6833 },
  'izamal':             { lat: 20.9296, lng: -89.0178 },
  // ——————————— J ———————————
  'jalpa-de-canovas':   { lat: 20.4833, lng: -101.8500 },
  'jerez':              { lat: 22.6500, lng: -103.0000 },
  // ——————————— L ———————————
  'la-paz':             { lat: 24.1426, lng: -110.3128 },
  'leon':               { lat: 21.1221, lng: -101.6821 },
  'loreto':             { lat: 26.0103, lng: -111.3428 },
  'los-cabos':          { lat: 22.8905, lng: -109.9167 },
  'los-mochis':         { lat: 25.7903, lng: -108.9981 },
  // ——————————— M ———————————
  'malinalco':          { lat: 18.9486, lng: -99.4928 },
  'manzanillo':         { lat: 19.1139, lng: -104.3383 },
  'mapimi':             { lat: 25.8333, lng: -103.8500 },
  'mascota':            { lat: 20.5244, lng: -104.7992 },
  'matehuala':          { lat: 23.6500, lng: -100.6333 },
  'mazamitla':          { lat: 19.9131, lng: -103.0297 },
  'mazatlan':           { lat: 23.2494, lng: -106.4111 },
  'mazunte':            { lat: 15.6667, lng: -96.5500 },
  'merida':             { lat: 20.9674, lng: -89.5926 },
  'mexico-city':        { lat: 19.4326, lng: -99.1332 },
  'cdmx':               { lat: 19.4326, lng: -99.1332 },
  'ciudad-de-mexico':   { lat: 19.4326, lng: -99.1332 },
  'mineral-del-chico':  { lat: 20.2197, lng: -98.7328 },
  'mineral-del-monte':  { lat: 20.1394, lng: -98.6722 },
  'mitla':              { lat: 16.9203, lng: -96.3597 },
  'monte-alban':        { lat: 17.0437, lng: -96.7676 },
  'monterrey':          { lat: 25.6866, lng: -100.3161 },
  'morelia':            { lat: 19.7060, lng: -101.1950 },
  // ——————————— N ———————————
  'nuevo-vallarta':     { lat: 20.7000, lng: -105.2833 },
  // ——————————— O ———————————
  'oaxaca':             { lat: 17.0732, lng: -96.7266 },
  'oaxaca-city':        { lat: 17.0732, lng: -96.7266 },
  'oaxaca-de-juarez':   { lat: 17.0732, lng: -96.7266 },
  'oaxtepec':           { lat: 18.9039, lng: -98.9722 },
  'orizaba':            { lat: 18.8517, lng: -97.1078 },
  // ——————————— P ———————————
  'pachuca':            { lat: 20.1011, lng: -98.7591 },
  'pahuatlan':          { lat: 20.2706, lng: -98.1431 },
  'palenque':           { lat: 17.5092, lng: -91.9847 },
  'papantla':           { lat: 20.4500, lng: -97.3222 },
  'paraguas':           { lat: 22.1000, lng: -100.9833 },
  'parras':             { lat: 25.4419, lng: -102.1789 },
  'prismas-basalticos': { lat: 20.2331, lng: -98.6444 },
  'patzcuaro':          { lat: 19.5153, lng: -101.6092 },
  'pena-de-bernal':     { lat: 20.7466, lng: -99.9499 },
  'playa-del-carmen':   { lat: 20.6296, lng: -87.0739 },
  'puebla':             { lat: 19.0414, lng: -98.2063 },
  'puerto-escondido':   { lat: 15.8720, lng: -97.0767 },
  'puerto-vallarta':    { lat: 20.6534, lng: -105.2253 },
  // ——————————— Q ———————————
  'queretaro':          { lat: 20.5888, lng: -100.3899 },
  // ——————————— R ———————————
  'real-de-catorce':    { lat: 23.6898, lng: -100.8866 },
  'real-del-monte':     { lat: 20.1394, lng: -98.6722 },
  // ——————————— S ———————————
  'saltillo':           { lat: 25.4260, lng: -101.0053 },
  'san-cristobal':      { lat: 16.7370, lng: -92.6376 },
  'san-cristobal-de-las-casas': { lat: 16.7370, lng: -92.6376 },
  'san-juan-chamula':   { lat: 16.7833, lng: -92.6889 },
  'san-juan-del-rio':   { lat: 20.3883, lng: -99.9961 },
  'san-luis-potosi':    { lat: 22.1565, lng: -100.9855 },
  'san-luis-potosi-capital': { lat: 22.1565, lng: -100.9855 },
  'san-miguel-de-allende': { lat: 20.9144, lng: -100.7452 },
  'santa-clara-del-cobre': { lat: 19.4069, lng: -101.6386 },
  'santa-maria-del-rio':{ lat: 21.7836, lng: -100.7353 },
  'sayulita':           { lat: 20.8700, lng: -105.4424 },
  'sisal':              { lat: 21.1647, lng: -90.0394 },
  // ——————————— T ———————————
  'tapalpa':            { lat: 19.9500, lng: -103.7667 },
  'taxco':              { lat: 18.5564, lng: -99.6050 },
  'tecate':             { lat: 32.5703, lng: -116.6258 },
  'tehuacan':           { lat: 18.4611, lng: -97.3928 },
  'teotihuacan':        { lat: 19.6925, lng: -98.8438 },
  'tepic':              { lat: 21.5039, lng: -104.8936 },
  'tepoztlan':          { lat: 18.9848, lng: -99.0945 },
  'tequila':            { lat: 20.8831, lng: -103.8364 },
  'tequisquiapan':      { lat: 20.5175, lng: -99.8933 },
  'tepotzotlan':        { lat: 19.7219, lng: -99.2236 },
  'tijuana':            { lat: 32.5149, lng: -117.0382 },
  'tlaquepaque':        { lat: 20.6400, lng: -103.3111 },
  'tlayacapan':         { lat: 18.9547, lng: -98.9833 },
  'todos-santos':       { lat: 23.4500, lng: -110.2333 },
  'toluca':             { lat: 19.2826, lng: -99.6557 },
  'tula':               { lat: 20.0533, lng: -99.3431 },
  'tulum':              { lat: 20.2114, lng: -87.4654 },
  'tuxtla':             { lat: 16.7528, lng: -93.1152 },
  'tuxtla-gutierrez':   { lat: 16.7528, lng: -93.1152 },
  'tzintzuntzan':       { lat: 19.6217, lng: -101.5800 },
  // ——————————— U ———————————
  'uruapan':            { lat: 19.4211, lng: -102.0628 },
  'uxmal':              { lat: 20.3583, lng: -89.7714 },
  // ——————————— V ———————————
  'valladolid':         { lat: 20.6894, lng: -88.2017 },
  'valle-de-bravo':     { lat: 19.1950, lng: -100.1308 },
  'valle-de-guadalupe': { lat: 32.0783, lng: -116.5864 },
  'veracruz':           { lat: 19.1738, lng: -96.1342 },
  'villa-del-carbon':   { lat: 19.7556, lng: -99.4667 },
  'villahermosa':       { lat: 17.9869, lng: -92.9303 },
  // ——————————— X ———————————
  'xalapa':             { lat: 19.5438, lng: -96.9103 },
  'xicotepec':          { lat: 20.2858, lng: -97.9597 },
  'xilitla':            { lat: 21.3833, lng: -98.9958 },
  'xochicalco':         { lat: 18.8014, lng: -99.2967 },
  'xochimilco':         { lat: 19.2600, lng: -99.1050 },
  // ——————————— Y ———————————
  // ——————————— Z ———————————
  'zacatecas':          { lat: 22.7709, lng: -102.5832 },
  'zacatlan':           { lat: 19.9303, lng: -97.9597 },
  'zihuatanejo':        { lat: 17.6417, lng: -101.5517 },
};

function normalizeCitySlug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function getCityCoords(nameOrSlug: string): CityCoord | null {
  const key = normalizeCitySlug(nameOrSlug);
  return CITY_COORDS[key] ?? null;
}
