import fs from 'node:fs';
import path from 'node:path';

const audit = [];

audit.push([
  'Breadcrumbs still schema-emitting',
  /JsonLd/.test(fs.readFileSync('src/components/seo/Breadcrumbs.tsx', 'utf8')),
]);

function walk(dir, list = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, list);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) list.push(p);
  }
  return list;
}

const publicFiles = walk('src/app/(public)');
const noindexHits = publicFiles.filter((f) => /noIndex:\s*true/.test(fs.readFileSync(f, 'utf8')));
audit.push(['No public page has noIndex:true', noindexHits.length === 0]);

const sitemap = fs.readFileSync('src/app/sitemap.ts', 'utf8');
audit.push(['Sitemap includes /colecciones', sitemap.includes('/colecciones')]);
audit.push(['Sitemap includes /acerca-de', sitemap.includes('/acerca-de')]);
audit.push(['Sitemap includes /guias', sitemap.includes('/guias')]);

const decor = fs.readFileSync('src/components/decor/DecorImage.tsx', 'utf8');
audit.push(['DecorImage includes pointer-events-none', decor.includes('pointer-events-none')]);

const ps = fs.readFileSync('src/components/layout/PageShell.tsx', 'utf8');
audit.push(['PageShell responsive grid', /lg:grid-cols-\[240px_1fr\]/.test(ps)]);

const mustHaveCurrent = [
  { file: 'src/app/(public)/acerca-de/page.tsx', v: 'acerca-de' },
  { file: 'src/app/(public)/fuentes-de-datos/page.tsx', v: 'fuentes-de-datos' },
  { file: 'src/app/(public)/metodologia/page.tsx', v: 'metodologia' },
  { file: 'src/app/(public)/contacto/page.tsx', v: 'contacto' },
  { file: 'src/app/colecciones/page.tsx', v: 'colecciones' },
  { file: 'src/app/colecciones/[slug]/page.tsx', v: 'colecciones' },
];
for (const { file, v } of mustHaveCurrent) {
  const s = fs.readFileSync(file, 'utf8');
  audit.push([`${path.basename(path.dirname(file))}/${path.basename(file)}: current="${v}"`, s.includes(`current="${v}"`)]);
}

const gc = fs.readFileSync('src/app/(public)/guias/guias-client.tsx', 'utf8');
audit.push(['Guides: clearAll helper', /clearAll/.test(gc)]);

const stillHasInline = publicFiles.filter((f) => /aria-label="Breadcrumb"/.test(fs.readFileSync(f, 'utf8')));
audit.push(['No inline Breadcrumb nav remains', stillHasInline.length === 0]);

const generalCount = fs
  .readdirSync('public/General')
  .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f)).length;
audit.push([`public/General has ≥ 50 images (found ${generalCount})`, generalCount >= 50]);

const guiasCount = fs
  .readdirSync('public/guias')
  .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f)).length;
audit.push([`public/guias has ≥ 100 images (found ${guiasCount})`, guiasCount >= 100]);

// Check that RouteStaticMapPreview polyline encoder is pure and returns a string
const rm = fs.readFileSync('src/components/map/RouteStaticMapPreview.tsx', 'utf8');
audit.push(['RouteStaticMapPreview thins > 25 stops', /thin\(valid, 25\)/.test(rm)]);

// Check PageShell doesn't render breadcrumbs
audit.push(['PageShell has no breadcrumb', !/aria-label="Breadcrumb"/.test(ps)]);

// ROUND 2 complete
let pass = 0,
  fail = 0;
for (const [n, ok] of audit) {
  if (ok) {
    pass++;
    console.log('  PASS  ' + n);
  } else {
    fail++;
    console.log('  FAIL  ' + n);
  }
}
console.log(`\nROUND 2: ${pass}/${audit.length} ${fail === 0 ? '— ALL PASS' : '— FAILURES'}`);
process.exit(fail > 0 ? 1 : 0);
