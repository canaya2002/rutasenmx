import fs from 'node:fs';
import path from 'node:path';

/**
 * Scan src/app for internal Link hrefs and check whether they resolve to
 * either a static route (file exists under src/app/**) or a dynamic route
 * whose segment list the href can satisfy.
 */

function walk(dir, list = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, list);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) list.push(p);
  }
  return list;
}

// Collect all route definitions under src/app
const routeFiles = walk('src/app').filter(
  (f) => f.endsWith(path.sep + 'page.tsx') || f.endsWith(path.sep + 'page.ts'),
);

// Convert file path to route pattern.
// e.g. "src/app/(public)/rutas/[slug]/page.tsx" → "/rutas/[slug]"
function toRoute(p) {
  const rel = p.replace(/\\/g, '/').replace(/^src\/app/, '');
  let route = rel.replace(/\/page\.(tsx?|jsx?)$/, '');
  // Remove route groups like (public), (auth), (dashboard), (admin)
  route = route.replace(/\/\([^)]+\)/g, '');
  return route || '/';
}

const routes = routeFiles.map(toRoute);

// Build regex checker: for each href, try to match against routes.
// Dynamic segments [slug] match any non-empty, non-slash segment.
function routeToRegex(route) {
  const esc = route
    .split('/')
    .map((seg) => {
      if (seg.startsWith('[...') && seg.endsWith(']')) return '(.+?)';
      if (seg.startsWith('[') && seg.endsWith(']')) return '([^/]+)';
      return seg.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    })
    .join('/');
  return new RegExp(`^${esc}/?$`);
}
const routeRegexes = routes.map(routeToRegex);

// Enumerate every internal href.
const files = walk('src/app').concat(walk('src/components'));
const brokenLinks = [];
const HREF_RE = /href\s*=\s*"(\/[^"#?\s]*)"/g;
const TEMPLATE_HREF_RE = /href\s*=\s*\{`(\/[^`#?\s]*)`\}/g;

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const found = new Set();
  for (const re of [HREF_RE, TEMPLATE_HREF_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) {
      let href = m[1];
      // Skip external, mailto, tel, anchors, etc. — but we already filter by /
      if (!href.startsWith('/')) continue;
      // Replace ${...} placeholders with "x" so template strings resolve
      href = href.replace(/\$\{[^}]+\}/g, 'x');
      found.add(href);
    }
  }
  for (const href of found) {
    const ok = routeRegexes.some((re) => re.test(href));
    if (!ok) {
      brokenLinks.push({ file: f, href });
    }
  }
}

// Also check data layer routes (lugares/[slug]/etc.)
const knownRoutes = new Set(routes);
const _pretty = [...knownRoutes].sort();
console.log(`Enumerated ${routes.length} route patterns under src/app.`);

if (brokenLinks.length === 0) {
  console.log('\n✓ No broken internal hrefs detected.');
  process.exit(0);
}

// Group by href
const grouped = new Map();
for (const { file, href } of brokenLinks) {
  if (!grouped.has(href)) grouped.set(href, new Set());
  grouped.get(href).add(file);
}

console.log(`\n✗ Found ${grouped.size} unresolved hrefs:`);
for (const [href, filesSet] of grouped.entries()) {
  console.log(`  ${href}`);
  for (const f of filesSet) console.log(`      ↳ ${f}`);
}

process.exit(1);
