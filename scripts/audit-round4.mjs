import fs from 'node:fs';

const checks = [];

// Route maps
const mock = fs.readFileSync('src/lib/data/mock.ts', 'utf8');
checks.push(['MockRouteStop has optional lat/lng', /lat\?: number;\s*lng\?: number/.test(mock)]);
checks.push([
  'Barrancas del Cobre route has ≥ 4 stops',
  (() => {
    const m = mock.match(/slug: 'barrancas-del-cobre-chepe'[\s\S]*?stops: \[([\s\S]*?)\],/);
    if (!m) return false;
    return (m[1].match(/placeSlug:/g) || []).length >= 4;
  })(),
]);
checks.push([
  'Barrancas has Chihuahua + Creel + Divisadero + Los Mochis',
  /placeSlug: 'chihuahua'/.test(mock) && /placeSlug: 'divisadero'/.test(mock) && /placeSlug: 'los-mochis'/.test(mock),
]);

const seedRoutes = fs.readFileSync('src/lib/data/seed-routes.ts', 'utf8');
checks.push(['seed-routes imports getCityCoords', /getCityCoords/.test(seedRoutes)]);
checks.push(['seed-routes buildStops attaches lat/lng', /coords \? \{ lat: coords\.lat, lng: coords\.lng \}/.test(seedRoutes)]);

const rutasDetail = fs.readFileSync('src/app/(public)/rutas/[slug]/page.tsx', 'utf8');
checks.push(['Route detail uses stop.lat/lng fallback', /s\.place\?\.lat \?\? s\.lat/.test(rutasDetail)]);
checks.push([
  'Route detail itinerary uses coord fallback for gmaps/waze',
  /stopLat = stop\.place\?\.lat \?\? stop\.lat/.test(rutasDetail),
]);

const rutasList = fs.readFileSync('src/app/(public)/rutas/page.tsx', 'utf8');
checks.push(['Route list uses stop.lat/lng fallback', /place\?\.lat \?\? s\.lat/.test(rutasList)]);

// City coords
const cc = fs.readFileSync('src/lib/data/city-coords.ts', 'utf8');
const keys = new Set([...cc.matchAll(/^\s*'([a-z0-9-]+)':/gm)].map((m) => m[1]));
checks.push([`CITY_COORDS has ≥ 150 entries (found ${keys.size})`, keys.size >= 150]);
for (const k of [
  'queretaro',
  'amealco',
  'san-juan-del-rio',
  'creel',
  'chihuahua',
  'divisadero',
  'el-fuerte',
  'los-mochis',
]) {
  checks.push([`CITY_COORDS has ${k}`, keys.has(k)]);
}

// Duplicate image fix (PageShell sole owner of hero+accents)
for (const f of [
  'src/app/(public)/acerca-de/page.tsx',
  'src/app/(public)/fuentes-de-datos/page.tsx',
  'src/app/(public)/metodologia/page.tsx',
  'src/app/(public)/contacto/page.tsx',
  'src/app/colecciones/page.tsx',
  'src/app/colecciones/[slug]/page.tsx',
]) {
  const src = fs.readFileSync(f, 'utf8');
  checks.push([`${f}: no heroImage prop passed`, !/heroImage=\{/.test(src)]);
}

// Planear glass redesign
const planear = fs.readFileSync('src/app/(public)/planear/planear-client.tsx', 'utf8');
checks.push(['Planear hero has gradient + blobs', /bg-gradient-to-br from-white via-emerald-50/.test(planear)]);
checks.push(['Planear uses glass backdrop-blur-xl', /backdrop-blur-xl/.test(planear)]);
checks.push(['Planear has Autopilot CTA card', /Autopilot/.test(planear)]);
checks.push(['Planear has Sparkles icon', /Sparkles/.test(planear)]);

// Autopilot animations
const autopilot = fs.readFileSync('src/app/(public)/autopilot/page.tsx', 'utf8');
checks.push(['Autopilot uses animate-floaty', /animate-floaty/.test(autopilot)]);
checks.push(['Autopilot uses animate-fade-up', /animate-fade-up/.test(autopilot)]);
checks.push(['Autopilot has gradient text on title', /bg-clip-text text-transparent/.test(autopilot)]);
checks.push(['Autopilot has STEPS how-it-works', /const STEPS =/.test(autopilot)]);
checks.push(['Autopilot has pulsing live dot', /animate-ping/.test(autopilot)]);

// Broken links
const mapMarker = fs.readFileSync('src/components/map/MapMarker.tsx', 'utf8');
const mapPopup = fs.readFileSync('src/components/map/MapPopup.tsx', 'utf8');
checks.push(['MapMarker uses /lugares/ (not /lugar/)', !/\/lugar\//.test(mapMarker) && /\/lugares\//.test(mapMarker)]);
checks.push(['MapPopup uses /lugares/ (not /lugar/)', !/\/lugar\//.test(mapPopup) && /\/lugares\//.test(mapPopup)]);

let pass = 0,
  fail = 0;
for (const [n, ok] of checks) {
  if (ok) {
    pass++;
    console.log('  PASS  ' + n);
  } else {
    fail++;
    console.log('  FAIL  ' + n);
  }
}
console.log(`\nROUND 4: ${pass}/${checks.length} ${fail === 0 ? '— ALL PASS' : '— FAILURES'}`);
process.exit(fail > 0 ? 1 : 0);
