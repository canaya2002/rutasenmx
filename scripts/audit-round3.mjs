import fs from 'node:fs';

const checks = [];

// -------- Bug fixes --------
const realPlaces = fs.readFileSync('src/lib/data/real-places.ts', 'utf8');
// Verify La Organera museum has correct coords
const organeraBlock = realPlaces.match(
  /sic-2079[\s\S]{0,500}/,
);
checks.push(['La Organera museum fixed (lng ≠ 17.78)', organeraBlock ? !/"lat":\s*17\.78472,\s*"lng":\s*17\.78472/.test(organeraBlock[0]) : false]);
checks.push(['La Organera museum has valid lng (-99.63307)', organeraBlock ? /"lng":\s*-99\.63307/.test(organeraBlock[0]) : false]);

// Scan all coords for Mexico bounds
{
  const re = /"lat":\s*(-?[0-9.]+),\s*"lng":\s*(-?[0-9.]+)/g;
  let m;
  let bad = 0;
  while ((m = re.exec(realPlaces))) {
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    if (!(lat >= 14.4 && lat <= 33 && lng >= -118.5 && lng <= -86.5)) bad++;
  }
  checks.push([`All real-places coords inside Mexico bbox (bad=${bad})`, bad === 0]);
}

// -------- Gallery layout fixes --------
const home = fs.readFileSync('src/app/page.tsx', 'utf8');
checks.push(['Home collage uses auto-rows', /auto-rows-\[/.test(home)]);
const acerca = fs.readFileSync('src/app/(public)/acerca-de/page.tsx', 'utf8');
checks.push(['Acerca-de mosaic uses auto-rows', /auto-rows-\[/.test(acerca)]);
const colecciones = fs.readFileSync('src/app/colecciones/page.tsx', 'utf8');
checks.push(['Colecciones mosaic: mobile 3 cols', /grid-cols-3 gap-3 sm:grid-cols-6/.test(colecciones)]);

// -------- Image picker no-duplicates --------
const gi = fs.readFileSync('src/lib/data/general-images.ts', 'utf8');
checks.push(['pickDecorations uses seen Set', /const seen = new Set/.test(gi)]);
checks.push(['pickDecorationBatch helper exists', /pickDecorationBatch/.test(gi)]);
const guiaImages = fs.readFileSync('src/lib/data/guia-images.ts', 'utf8');
checks.push(['pickGuiaSet hero+gallery helper', /pickGuiaSet/.test(guiaImages)]);

// -------- Density map on pueblos / museos / zonas --------
const pueblos = fs.readFileSync('src/app/(public)/pueblos-magicos/page.tsx', 'utf8');
checks.push(['Pueblos uses DensityStaticMap', /DensityStaticMap/.test(pueblos)]);
checks.push(['Pueblos removed "próximamente" placeholder', !/mapPlaceholder/.test(pueblos)]);

const museos = fs.readFileSync('src/app/(public)/museos/page.tsx', 'utf8');
checks.push(['Museos uses DensityStaticMap', /DensityStaticMap/.test(museos)]);
checks.push(['Museos card uses StaticMapPreview', /StaticMapPreview/.test(museos)]);

const zonas = fs.readFileSync('src/app/(public)/zonas-arqueologicas/page.tsx', 'utf8');
checks.push(['Zonas uses DensityStaticMap', /DensityStaticMap/.test(zonas)]);
checks.push(['Zonas card uses StaticMapPreview', /StaticMapPreview/.test(zonas)]);
checks.push(['Zonas removed "próximamente" placeholder', !/mapPlaceholder/.test(zonas)]);

// -------- /precios redesign --------
const precios = fs.readFileSync('src/app/(public)/precios/page.tsx', 'utf8');
checks.push(['Precios uses PricingTableV2', /PricingTableV2/.test(precios)]);
checks.push(['Precios feature comparison table', /FEATURE_ROWS_ES/.test(precios)]);
checks.push(['Precios has FAQ details/summary', /<details/.test(precios)]);
checks.push(['Precios trust badges', /14-day|14 días/.test(precios)]);
const pricingV2 = fs.readFileSync('src/components/subscription/PricingTableV2.tsx', 'utf8');
checks.push(['PricingTableV2: annual default', /useState<BillingInterval>\('annual'\)/.test(pricingV2)]);
checks.push(['PricingTableV2: savings badge', /computeAnnualSavings/.test(pricingV2)]);

// -------- /estados redesign --------
const estados = fs.readFileSync('src/app/(public)/estados/page.tsx', 'utf8');
checks.push(['Estados has featured section', /Destacados/.test(estados)]);
checks.push(['Estados uses density map', /DensityStaticMap/.test(estados)]);
checks.push(['Estados renders category pills per state', /pueblosCount/.test(estados)]);

// -------- /autopilot, /planear metadata --------
const autopilot = fs.readFileSync('src/app/(public)/autopilot/page.tsx', 'utf8');
checks.push(['Autopilot uses buildPageMetadata', /buildPageMetadata/.test(autopilot)]);
checks.push(['Autopilot has decor', /pickDecorations/.test(autopilot)]);

const planear = fs.readFileSync('src/app/(public)/planear/page.tsx', 'utf8');
checks.push(['Planear uses buildPageMetadata', /buildPageMetadata/.test(planear)]);

// -------- SEO hardening --------
const sitemap = fs.readFileSync('src/app/sitemap.ts', 'utf8');
checks.push(['Sitemap includes /autopilot', /autopilot/.test(sitemap)]);
checks.push(['Sitemap includes /precios', /precios/.test(sitemap)]);
checks.push(['Sitemap includes /estados', /estados/.test(sitemap)]);

// Report
let pass = 0, fail = 0;
for (const [n, ok] of checks) {
  if (ok) { pass++; console.log('  PASS  ' + n); }
  else   { fail++; console.log('  FAIL  ' + n); }
}
console.log(`\nROUND 3: ${pass}/${checks.length} ${fail === 0 ? '— ALL PASS' : '— FAILURES'}`);
process.exit(fail > 0 ? 1 : 0);
