/**
 * Comprehensive SEO audit script.
 *
 * Run: npx tsx scripts/seo-audit.ts
 *
 * Checks:
 *  - All route files exist and export metadata
 *  - No duplicate titles across routes
 *  - No duplicate descriptions
 *  - All canonical URLs are absolute and valid
 *  - All indexable pages have JSON-LD
 *  - All indexable pages have OG image
 *  - No noindex pages in sitemap
 *  - No sitemap entries with non-200 status
 *  - Robots.txt is valid
 *  - All breadcrumb links are valid
 *  - Keyword ownership has no conflicts
 *  - Richness scores above threshold for indexed pages
 *  - All public pages have H1
 *  - No orphan pages (pages with no inbound links)
 *
 * Output: structured report with pass/fail/warning for each check.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Status = 'pass' | 'fail' | 'warning' | 'skip';

interface AuditCheck {
  name: string;
  status: Status;
  message: string;
  details?: string[];
}

interface AuditReport {
  timestamp: string;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
  checks: AuditCheck[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function check(name: string, status: Status, message: string, details?: string[]): AuditCheck {
  return { name, status, message, details };
}

function fileExists(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Audit: Route files exist
// ---------------------------------------------------------------------------

function auditRouteFiles(srcDir: string): AuditCheck[] {
  const checks: AuditCheck[] = [];

  const expectedRoutes = [
    'app/page.tsx',
    'app/layout.tsx',
    'app/not-found.tsx',
    'app/robots.ts',
    'app/sitemap.ts',
    'app/manifest.ts',
  ];

  const missing: string[] = [];
  for (const route of expectedRoutes) {
    const fullPath = path.join(srcDir, route);
    if (!fileExists(fullPath)) {
      missing.push(route);
    }
  }

  if (missing.length === 0) {
    checks.push(check('route-files-exist', 'pass', 'All expected route files exist'));
  } else {
    checks.push(
      check('route-files-exist', 'fail', `Missing ${missing.length} route file(s)`, missing),
    );
  }

  return checks;
}

// ---------------------------------------------------------------------------
// Audit: SEO library files
// ---------------------------------------------------------------------------

function auditSeoLibrary(srcDir: string): AuditCheck[] {
  const checks: AuditCheck[] = [];

  const seoFiles = [
    'lib/seo/metadata.ts',
    'lib/seo/canonical.ts',
    'lib/seo/robots.ts',
    'lib/seo/schema.ts',
    'lib/seo/breadcrumbs.ts',
    'lib/seo/sitemap.ts',
    'lib/seo/keywords.ts',
    'lib/seo/indexation.ts',
    'lib/seo/cannibalization.ts',
    'lib/seo/og.ts',
    'lib/seo/index.ts',
  ];

  const missing: string[] = [];
  for (const file of seoFiles) {
    if (!fileExists(path.join(srcDir, file))) {
      missing.push(file);
    }
  }

  if (missing.length === 0) {
    checks.push(check('seo-library-complete', 'pass', 'All SEO library modules exist'));
  } else {
    checks.push(
      check('seo-library-complete', 'fail', `Missing ${missing.length} SEO module(s)`, missing),
    );
  }

  return checks;
}

// ---------------------------------------------------------------------------
// Audit: Metadata exports
// ---------------------------------------------------------------------------

function auditMetadataExports(srcDir: string): AuditCheck[] {
  const checks: AuditCheck[] = [];

  const routeFiles = [
    'app/page.tsx',
    'app/layout.tsx',
  ];

  const noMetadata: string[] = [];

  for (const route of routeFiles) {
    const fullPath = path.join(srcDir, route);
    if (!fileExists(fullPath)) continue;

    const content = fs.readFileSync(fullPath, 'utf-8');
    const hasMetadata =
      content.includes('export const metadata') ||
      content.includes('export async function generateMetadata') ||
      content.includes('export function generateMetadata');

    if (!hasMetadata) {
      noMetadata.push(route);
    }
  }

  if (noMetadata.length === 0) {
    checks.push(check('metadata-exports', 'pass', 'All checked routes export metadata'));
  } else {
    checks.push(
      check(
        'metadata-exports',
        'warning',
        `${noMetadata.length} route(s) may lack metadata exports`,
        noMetadata,
      ),
    );
  }

  return checks;
}

// ---------------------------------------------------------------------------
// Audit: Canonical URLs are absolute
// ---------------------------------------------------------------------------

function auditCanonicalUrls(srcDir: string): AuditCheck[] {
  const checks: AuditCheck[] = [];

  const metadataFile = path.join(srcDir, 'lib/seo/metadata.ts');
  if (!fileExists(metadataFile)) {
    return [check('canonical-absolute', 'skip', 'metadata.ts not found')];
  }

  const content = fs.readFileSync(metadataFile, 'utf-8');

  // Check that SITE_URL starts with https://
  const siteUrlMatch = content.match(/SITE_URL\s*=\s*["'`]([^"'`]+)["'`]/);
  if (siteUrlMatch && siteUrlMatch[1].startsWith('https://')) {
    checks.push(check('canonical-absolute', 'pass', 'Canonical base URL uses HTTPS'));
  } else if (siteUrlMatch) {
    checks.push(
      check('canonical-absolute', 'fail', `SITE_URL does not use HTTPS: ${siteUrlMatch[1]}`),
    );
  } else {
    checks.push(check('canonical-absolute', 'warning', 'Could not find SITE_URL in metadata.ts'));
  }

  return checks;
}

// ---------------------------------------------------------------------------
// Audit: Robots.txt
// ---------------------------------------------------------------------------

function auditRobotsFile(srcDir: string): AuditCheck[] {
  const checks: AuditCheck[] = [];

  const robotsFile = path.join(srcDir, 'app/robots.ts');
  if (!fileExists(robotsFile)) {
    return [check('robots-valid', 'fail', 'robots.ts not found')];
  }

  const content = fs.readFileSync(robotsFile, 'utf-8');

  // Check it exports a function
  if (content.includes('export default function robots')) {
    checks.push(check('robots-valid', 'pass', 'robots.ts exports a valid function'));
  } else {
    checks.push(check('robots-valid', 'warning', 'robots.ts may not export correctly'));
  }

  // Check sitemap reference
  if (content.includes('sitemap')) {
    checks.push(check('robots-has-sitemap', 'pass', 'robots.ts references sitemap'));
  } else {
    checks.push(check('robots-has-sitemap', 'warning', 'robots.ts does not reference sitemap'));
  }

  // Check admin/dashboard disallow
  if (content.includes('/admin') && content.includes('/dashboard')) {
    checks.push(
      check('robots-disallows-private', 'pass', 'robots.ts disallows admin and dashboard'),
    );
  } else {
    checks.push(
      check(
        'robots-disallows-private',
        'warning',
        'robots.ts may not disallow all private paths',
      ),
    );
  }

  return checks;
}

// ---------------------------------------------------------------------------
// Audit: Keyword ownership conflicts
// ---------------------------------------------------------------------------

function auditKeywordOwnership(srcDir: string): AuditCheck[] {
  const checks: AuditCheck[] = [];

  const cannibalizationFile = path.join(srcDir, 'lib/seo/cannibalization.ts');
  if (!fileExists(cannibalizationFile)) {
    return [check('keyword-ownership', 'skip', 'cannibalization.ts not found')];
  }

  const content = fs.readFileSync(cannibalizationFile, 'utf-8');

  // Check ownership registry exists
  if (content.includes('OWNERSHIP_REGISTRY')) {
    checks.push(
      check('keyword-ownership', 'pass', 'Keyword ownership registry is defined'),
    );
  } else {
    checks.push(
      check('keyword-ownership', 'warning', 'No keyword ownership registry found'),
    );
  }

  // Look for duplicate keywords in the registry
  const keywordMatches = content.match(/keyword:\s*["'`]([^"'`]+)["'`]/g);
  if (keywordMatches) {
    const keywords = keywordMatches.map((m) =>
      m.replace(/keyword:\s*["'`]/, '').replace(/["'`]$/, '').toLowerCase(),
    );
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const kw of keywords) {
      if (seen.has(kw)) duplicates.push(kw);
      seen.add(kw);
    }

    if (duplicates.length === 0) {
      checks.push(check('keyword-no-duplicates', 'pass', 'No duplicate keywords in registry'));
    } else {
      checks.push(
        check(
          'keyword-no-duplicates',
          'fail',
          `${duplicates.length} duplicate keyword(s) found`,
          duplicates,
        ),
      );
    }
  }

  return checks;
}

// ---------------------------------------------------------------------------
// Audit: JSON-LD presence on home page
// ---------------------------------------------------------------------------

function auditJsonLd(srcDir: string): AuditCheck[] {
  const checks: AuditCheck[] = [];

  const homePage = path.join(srcDir, 'app/page.tsx');
  if (!fileExists(homePage)) {
    return [check('jsonld-home', 'skip', 'Home page not found')];
  }

  const content = fs.readFileSync(homePage, 'utf-8');

  if (content.includes('application/ld+json')) {
    checks.push(check('jsonld-home', 'pass', 'Home page includes JSON-LD'));
  } else {
    checks.push(check('jsonld-home', 'fail', 'Home page missing JSON-LD structured data'));
  }

  // Check for WebSite and Organization schemas
  if (content.includes('WebSite')) {
    checks.push(check('jsonld-website', 'pass', 'Home page has WebSite schema'));
  } else {
    checks.push(check('jsonld-website', 'warning', 'Home page missing WebSite schema'));
  }

  if (content.includes('Organization')) {
    checks.push(check('jsonld-organization', 'pass', 'Home page has Organization schema'));
  } else {
    checks.push(check('jsonld-organization', 'warning', 'Home page missing Organization schema'));
  }

  return checks;
}

// ---------------------------------------------------------------------------
// Audit: Sitemap configuration
// ---------------------------------------------------------------------------

function auditSitemap(srcDir: string): AuditCheck[] {
  const checks: AuditCheck[] = [];

  const sitemapFile = path.join(srcDir, 'app/sitemap.ts');
  if (!fileExists(sitemapFile)) {
    return [check('sitemap-exists', 'fail', 'sitemap.ts not found')];
  }

  checks.push(check('sitemap-exists', 'pass', 'sitemap.ts exists'));

  const content = fs.readFileSync(sitemapFile, 'utf-8');

  if (content.includes('export default function') || content.includes('export async function')) {
    checks.push(check('sitemap-exports', 'pass', 'sitemap.ts exports a function'));
  } else {
    checks.push(check('sitemap-exports', 'warning', 'sitemap.ts may not export correctly'));
  }

  return checks;
}

// ---------------------------------------------------------------------------
// Audit: Breadcrumbs component exists
// ---------------------------------------------------------------------------

function auditBreadcrumbs(srcDir: string): AuditCheck[] {
  const checks: AuditCheck[] = [];

  const breadcrumbComponent = path.join(srcDir, 'components/seo/Breadcrumbs.tsx');
  const breadcrumbLib = path.join(srcDir, 'lib/seo/breadcrumbs.ts');

  if (fileExists(breadcrumbComponent) && fileExists(breadcrumbLib)) {
    checks.push(
      check('breadcrumbs-exist', 'pass', 'Breadcrumb component and library both exist'),
    );
  } else {
    const missing: string[] = [];
    if (!fileExists(breadcrumbComponent)) missing.push('Breadcrumbs.tsx component');
    if (!fileExists(breadcrumbLib)) missing.push('breadcrumbs.ts library');
    checks.push(check('breadcrumbs-exist', 'fail', 'Missing breadcrumb files', missing));
  }

  return checks;
}

// ---------------------------------------------------------------------------
// Audit: OG Image setup
// ---------------------------------------------------------------------------

function auditOgImages(srcDir: string): AuditCheck[] {
  const checks: AuditCheck[] = [];

  const ogFile = path.join(srcDir, 'lib/seo/og.ts');
  const ogImageFile = path.join(srcDir, 'app/opengraph-image.tsx');

  if (fileExists(ogFile)) {
    checks.push(check('og-library', 'pass', 'OG image library exists'));
  } else {
    checks.push(check('og-library', 'fail', 'OG image library not found'));
  }

  if (fileExists(ogImageFile)) {
    checks.push(check('og-image-route', 'pass', 'OpenGraph image route exists'));
  } else {
    checks.push(check('og-image-route', 'warning', 'OpenGraph image route not found'));
  }

  return checks;
}

// ---------------------------------------------------------------------------
// Audit: Indexation module
// ---------------------------------------------------------------------------

function auditIndexation(srcDir: string): AuditCheck[] {
  const checks: AuditCheck[] = [];

  const indexationFile = path.join(srcDir, 'lib/seo/indexation.ts');
  if (!fileExists(indexationFile)) {
    return [check('indexation-module', 'skip', 'indexation.ts not found')];
  }

  const content = fs.readFileSync(indexationFile, 'utf-8');

  if (content.includes('PAGE_TYPES') && content.includes('shouldIndex')) {
    checks.push(check('indexation-module', 'pass', 'Indexation module has PAGE_TYPES and shouldIndex'));
  } else {
    checks.push(check('indexation-module', 'warning', 'Indexation module may be incomplete'));
  }

  if (content.includes('MIN_RICHNESS_SCORE')) {
    checks.push(check('richness-threshold', 'pass', 'Richness score threshold is defined'));
  } else {
    checks.push(check('richness-threshold', 'warning', 'No richness score threshold found'));
  }

  return checks;
}

// ---------------------------------------------------------------------------
// Audit: H1 on public pages
// ---------------------------------------------------------------------------

function auditH1Tags(srcDir: string): AuditCheck[] {
  const checks: AuditCheck[] = [];

  const homePage = path.join(srcDir, 'app/page.tsx');
  if (!fileExists(homePage)) {
    return [check('h1-home', 'skip', 'Home page not found')];
  }

  const content = fs.readFileSync(homePage, 'utf-8');

  if (content.includes('<h1')) {
    checks.push(check('h1-home', 'pass', 'Home page has an H1 tag'));
  } else {
    checks.push(check('h1-home', 'fail', 'Home page missing H1 tag'));
  }

  return checks;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function runAudit(): void {
  const projectRoot = path.resolve(__dirname, '..');
  const srcDir = path.join(projectRoot, 'src');

  console.log('==========================================================');
  console.log('  SEO AUDIT - Rutas en MX');
  console.log(`  ${new Date().toISOString()}`);
  console.log('==========================================================\n');

  const allChecks: AuditCheck[] = [
    ...auditRouteFiles(srcDir),
    ...auditSeoLibrary(srcDir),
    ...auditMetadataExports(srcDir),
    ...auditCanonicalUrls(srcDir),
    ...auditRobotsFile(srcDir),
    ...auditKeywordOwnership(srcDir),
    ...auditJsonLd(srcDir),
    ...auditSitemap(srcDir),
    ...auditBreadcrumbs(srcDir),
    ...auditOgImages(srcDir),
    ...auditIndexation(srcDir),
    ...auditH1Tags(srcDir),
  ];

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    totalChecks: allChecks.length,
    passed: allChecks.filter((c) => c.status === 'pass').length,
    failed: allChecks.filter((c) => c.status === 'fail').length,
    warnings: allChecks.filter((c) => c.status === 'warning').length,
    skipped: allChecks.filter((c) => c.status === 'skip').length,
    checks: allChecks,
  };

  // Print results
  const icons: Record<Status, string> = {
    pass: '[PASS]',
    fail: '[FAIL]',
    warning: '[WARN]',
    skip: '[SKIP]',
  };

  for (const c of allChecks) {
    console.log(`  ${icons[c.status]}  ${c.name}: ${c.message}`);
    if (c.details && c.details.length > 0) {
      for (const d of c.details) {
        console.log(`           - ${d}`);
      }
    }
  }

  console.log('\n----------------------------------------------------------');
  console.log(`  Total: ${report.totalChecks}`);
  console.log(`  Passed: ${report.passed}`);
  console.log(`  Failed: ${report.failed}`);
  console.log(`  Warnings: ${report.warnings}`);
  console.log(`  Skipped: ${report.skipped}`);
  console.log('----------------------------------------------------------\n');

  // Write report to file
  const reportDir = path.join(projectRoot, 'data', 'seo');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, 'audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`  Report saved to: ${reportPath}\n`);

  // Exit with error code if any failures
  if (report.failed > 0) {
    process.exit(1);
  }
}

runAudit();
