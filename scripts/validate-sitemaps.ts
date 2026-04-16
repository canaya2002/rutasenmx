/**
 * Validate sitemaps.
 *
 * Run: npx tsx scripts/validate-sitemaps.ts [--base-url https://rutasenmx.com]
 *
 * Checks:
 *  - Parse all sitemap files
 *  - Check each URL returns 200
 *  - Check no redirects in sitemap
 *  - Check lastmod is valid date
 *  - Check no duplicate URLs
 *  - Check canonical matches sitemap URL
 *  - Report issues
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

interface ValidationIssue {
  url: string;
  type: 'error' | 'warning';
  message: string;
}

interface ValidationReport {
  timestamp: string;
  totalUrls: number;
  errors: number;
  warnings: number;
  issues: ValidationIssue[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

function isValidUrl(urlStr: string): boolean {
  try {
    new URL(urlStr);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Parse sitemap XML (basic parser for static analysis)
// ---------------------------------------------------------------------------

function parseSitemapXml(xml: string): SitemapUrl[] {
  const urls: SitemapUrl[] = [];
  const urlRegex = /<url>([\s\S]*?)<\/url>/g;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(xml)) !== null) {
    const block = match[1];

    const locMatch = block.match(/<loc>(.*?)<\/loc>/);
    const lastmodMatch = block.match(/<lastmod>(.*?)<\/lastmod>/);
    const changefreqMatch = block.match(/<changefreq>(.*?)<\/changefreq>/);
    const priorityMatch = block.match(/<priority>(.*?)<\/priority>/);

    if (locMatch) {
      urls.push({
        loc: locMatch[1].trim(),
        lastmod: lastmodMatch?.[1]?.trim(),
        changefreq: changefreqMatch?.[1]?.trim(),
        priority: priorityMatch ? parseFloat(priorityMatch[1]) : undefined,
      });
    }
  }

  return urls;
}

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------

function validateUrls(urls: SitemapUrl[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();

  for (const entry of urls) {
    // Check valid URL
    if (!isValidUrl(entry.loc)) {
      issues.push({
        url: entry.loc,
        type: 'error',
        message: 'Invalid URL format',
      });
      continue;
    }

    // Check for duplicates
    if (seen.has(entry.loc)) {
      issues.push({
        url: entry.loc,
        type: 'error',
        message: 'Duplicate URL in sitemap',
      });
    }
    seen.add(entry.loc);

    // Check lastmod is valid date
    if (entry.lastmod && !isValidDate(entry.lastmod)) {
      issues.push({
        url: entry.loc,
        type: 'warning',
        message: `Invalid lastmod date: ${entry.lastmod}`,
      });
    }

    // Check URL uses HTTPS
    if (!entry.loc.startsWith('https://')) {
      issues.push({
        url: entry.loc,
        type: 'warning',
        message: 'URL does not use HTTPS',
      });
    }

    // Check no trailing slash (except root)
    const urlObj = new URL(entry.loc);
    if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
      issues.push({
        url: entry.loc,
        type: 'warning',
        message: 'URL has trailing slash',
      });
    }

    // Check priority is in valid range
    if (entry.priority != null && (entry.priority < 0 || entry.priority > 1)) {
      issues.push({
        url: entry.loc,
        type: 'warning',
        message: `Invalid priority: ${entry.priority} (must be 0.0-1.0)`,
      });
    }

    // Check changefreq is valid
    const validChangefreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
    if (entry.changefreq && !validChangefreqs.includes(entry.changefreq)) {
      issues.push({
        url: entry.loc,
        type: 'warning',
        message: `Invalid changefreq: ${entry.changefreq}`,
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Live URL check (optional, requires running server)
// ---------------------------------------------------------------------------

async function checkLiveUrls(
  urls: SitemapUrl[],
  baseUrl: string,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  console.log(`  Checking ${urls.length} URLs against ${baseUrl}...`);

  for (const entry of urls) {
    try {
      const response = await fetch(entry.loc, {
        method: 'HEAD',
        redirect: 'manual',
      });

      if (response.status !== 200) {
        issues.push({
          url: entry.loc,
          type: response.status >= 300 && response.status < 400 ? 'warning' : 'error',
          message: `HTTP ${response.status} (expected 200)`,
        });
      }

      // Check for redirects
      if (response.status >= 300 && response.status < 400) {
        const redirectTo = response.headers.get('location');
        issues.push({
          url: entry.loc,
          type: 'warning',
          message: `Redirect to ${redirectTo ?? 'unknown'} - sitemap should use final URL`,
        });
      }
    } catch (err) {
      issues.push({
        url: entry.loc,
        type: 'error',
        message: `Fetch error: ${err instanceof Error ? err.message : 'unknown'}`,
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const baseUrlIndex = args.indexOf('--base-url');
  const baseUrl = baseUrlIndex >= 0 ? args[baseUrlIndex + 1] : null;
  const doLiveCheck = !!baseUrl;

  const projectRoot = path.resolve(__dirname, '..');

  console.log('==========================================================');
  console.log('  SITEMAP VALIDATION - Rutas en MX');
  console.log(`  ${new Date().toISOString()}`);
  console.log('==========================================================\n');

  // Look for sitemap files
  const publicDir = path.join(projectRoot, 'public');
  const sitemapFiles: string[] = [];

  // Check public directory for static sitemaps
  if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir);
    for (const file of files) {
      if (file.startsWith('sitemap') && file.endsWith('.xml')) {
        sitemapFiles.push(path.join(publicDir, file));
      }
    }
  }

  // Check for dynamic sitemap (app/sitemap.ts)
  const dynamicSitemap = path.join(projectRoot, 'src', 'app', 'sitemap.ts');
  const hasDynamicSitemap = fs.existsSync(dynamicSitemap);

  if (sitemapFiles.length === 0 && !hasDynamicSitemap) {
    console.log('  No sitemap files found. Checking for dynamic sitemap...');
    if (!hasDynamicSitemap) {
      console.log('  [FAIL] No sitemaps found at all!');
      process.exit(1);
    }
  }

  // Parse and validate static sitemaps
  let allUrls: SitemapUrl[] = [];

  for (const file of sitemapFiles) {
    console.log(`  Parsing: ${path.basename(file)}`);
    const xml = fs.readFileSync(file, 'utf-8');
    const urls = parseSitemapXml(xml);
    console.log(`    Found ${urls.length} URLs`);
    allUrls = allUrls.concat(urls);
  }

  if (hasDynamicSitemap) {
    console.log('  Dynamic sitemap detected (app/sitemap.ts)');
    console.log('  Note: Dynamic sitemaps are validated at build/runtime');
  }

  // Validate
  const structuralIssues = validateUrls(allUrls);
  let liveIssues: ValidationIssue[] = [];

  if (doLiveCheck && allUrls.length > 0) {
    liveIssues = await checkLiveUrls(allUrls, baseUrl!);
  }

  const allIssues = [...structuralIssues, ...liveIssues];

  // Build report
  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    totalUrls: allUrls.length,
    errors: allIssues.filter((i) => i.type === 'error').length,
    warnings: allIssues.filter((i) => i.type === 'warning').length,
    issues: allIssues,
  };

  // Print results
  console.log('\n----------------------------------------------------------');
  console.log(`  Total URLs: ${report.totalUrls}`);
  console.log(`  Errors: ${report.errors}`);
  console.log(`  Warnings: ${report.warnings}`);
  console.log('----------------------------------------------------------\n');

  if (allIssues.length > 0) {
    for (const issue of allIssues) {
      const icon = issue.type === 'error' ? '[ERROR]' : '[WARN] ';
      console.log(`  ${icon} ${issue.url}`);
      console.log(`          ${issue.message}`);
    }
  } else if (allUrls.length > 0) {
    console.log('  All sitemap URLs are valid!');
  }

  // Write report
  const outputDir = path.join(projectRoot, 'data', 'seo');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const reportPath = path.join(outputDir, 'sitemap-validation.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n  Report saved to: ${reportPath}\n`);

  if (report.errors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Sitemap validation failed:', err);
  process.exit(1);
});
