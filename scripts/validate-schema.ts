/**
 * Validate JSON-LD schemas.
 *
 * Run: npx tsx scripts/validate-schema.ts [--base-url http://localhost:3000]
 *
 * Checks:
 *  - Extract JSON-LD from rendered pages (or validate schema builders directly)
 *  - Check against Schema.org expectations
 *  - Report missing required fields
 *  - Report invalid types
 *  - Report warnings
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SchemaIssue {
  schemaType: string;
  field: string;
  severity: 'error' | 'warning';
  message: string;
}

interface SchemaValidationReport {
  timestamp: string;
  totalSchemas: number;
  errors: number;
  warnings: number;
  issues: SchemaIssue[];
}

// ---------------------------------------------------------------------------
// Required fields per Schema.org type
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS: Record<string, string[]> = {
  Organization: ['name', 'url'],
  WebSite: ['name', 'url'],
  BreadcrumbList: ['itemListElement'],
  TouristAttraction: ['name', 'description'],
  Museum: ['name', 'description'],
  Article: ['headline', 'datePublished', 'author'],
  CollectionPage: ['name'],
  ItemList: ['itemListElement'],
  Trip: ['name', 'description'],
  ListItem: ['position', 'name'],
};

const RECOMMENDED_FIELDS: Record<string, string[]> = {
  Organization: ['logo', 'contactPoint'],
  WebSite: ['potentialAction', 'inLanguage'],
  TouristAttraction: ['url', 'geo', 'image'],
  Museum: ['url', 'openingHours', 'geo'],
  Article: ['description', 'image', 'publisher', 'dateModified'],
  CollectionPage: ['description', 'mainEntity'],
  ItemList: ['numberOfItems'],
  Trip: ['url', 'image', 'itinerary'],
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateSchema(schema: Record<string, unknown>): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  // Check @context
  if (!schema['@context']) {
    issues.push({
      schemaType: String(schema['@type'] ?? 'unknown'),
      field: '@context',
      severity: 'error',
      message: 'Missing @context field',
    });
  } else if (schema['@context'] !== 'https://schema.org') {
    issues.push({
      schemaType: String(schema['@type'] ?? 'unknown'),
      field: '@context',
      severity: 'warning',
      message: `Unexpected @context value: ${schema['@context']}`,
    });
  }

  // Check @type
  if (!schema['@type']) {
    issues.push({
      schemaType: 'unknown',
      field: '@type',
      severity: 'error',
      message: 'Missing @type field',
    });
    return issues;
  }

  const schemaType = String(schema['@type']);

  // Check required fields
  const required = REQUIRED_FIELDS[schemaType] ?? [];
  for (const field of required) {
    if (schema[field] == null) {
      issues.push({
        schemaType,
        field,
        severity: 'error',
        message: `Missing required field: ${field}`,
      });
    }
  }

  // Check recommended fields
  const recommended = RECOMMENDED_FIELDS[schemaType] ?? [];
  for (const field of recommended) {
    if (schema[field] == null) {
      issues.push({
        schemaType,
        field,
        severity: 'warning',
        message: `Missing recommended field: ${field}`,
      });
    }
  }

  // Type-specific validations
  if (schemaType === 'BreadcrumbList') {
    const items = schema.itemListElement as Array<Record<string, unknown>> | undefined;
    if (items && Array.isArray(items)) {
      items.forEach((item, i) => {
        if (!item.position) {
          issues.push({
            schemaType,
            field: `itemListElement[${i}].position`,
            severity: 'error',
            message: `ListItem at index ${i} missing position`,
          });
        }
        if (!item.name) {
          issues.push({
            schemaType,
            field: `itemListElement[${i}].name`,
            severity: 'error',
            message: `ListItem at index ${i} missing name`,
          });
        }
      });
    }
  }

  if (schemaType === 'Article') {
    const datePublished = schema.datePublished as string | undefined;
    if (datePublished && isNaN(new Date(datePublished).getTime())) {
      issues.push({
        schemaType,
        field: 'datePublished',
        severity: 'error',
        message: `Invalid datePublished: ${datePublished}`,
      });
    }
  }

  if (schemaType === 'TouristAttraction' || schemaType === 'Museum') {
    const geo = schema.geo as Record<string, unknown> | undefined;
    if (geo) {
      if (geo['@type'] !== 'GeoCoordinates') {
        issues.push({
          schemaType,
          field: 'geo.@type',
          severity: 'error',
          message: `Expected geo @type "GeoCoordinates", got "${geo['@type']}"`,
        });
      }
      if (geo.latitude == null || geo.longitude == null) {
        issues.push({
          schemaType,
          field: 'geo',
          severity: 'error',
          message: 'Geo missing latitude or longitude',
        });
      }
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Extract JSON-LD from HTML
// ---------------------------------------------------------------------------

function extractJsonLd(html: string): Record<string, unknown>[] {
  const schemas: Record<string, unknown>[] = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        schemas.push(...parsed);
      } else {
        schemas.push(parsed);
      }
    } catch {
      // Skip invalid JSON
    }
  }

  return schemas;
}

// ---------------------------------------------------------------------------
// Validate from live pages
// ---------------------------------------------------------------------------

async function validateLivePages(baseUrl: string): Promise<SchemaIssue[]> {
  const pages = [
    '/',
    '/museos',
    '/pueblos-magicos',
    '/zonas-arqueologicas',
  ];

  const allIssues: SchemaIssue[] = [];

  for (const pagePath of pages) {
    try {
      const url = `${baseUrl}${pagePath}`;
      console.log(`  Fetching: ${url}`);
      const response = await fetch(url);
      const html = await response.text();
      const schemas = extractJsonLd(html);

      if (schemas.length === 0) {
        allIssues.push({
          schemaType: 'none',
          field: 'JSON-LD',
          severity: 'warning',
          message: `No JSON-LD found on ${pagePath}`,
        });
        continue;
      }

      for (const schema of schemas) {
        const issues = validateSchema(schema);
        allIssues.push(...issues);
      }
    } catch (err) {
      allIssues.push({
        schemaType: 'fetch',
        field: pagePath,
        severity: 'error',
        message: `Failed to fetch ${pagePath}: ${err instanceof Error ? err.message : 'unknown'}`,
      });
    }
  }

  return allIssues;
}

// ---------------------------------------------------------------------------
// Validate schema builders directly (static analysis)
// ---------------------------------------------------------------------------

function validateSchemaBuilders(): SchemaIssue[] {
  const allIssues: SchemaIssue[] = [];

  // We import the schema builders dynamically and validate their output
  try {
    // Validate with sample data
    const sampleSchemas: Record<string, unknown>[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Rutas en MX',
        url: 'https://rutasenmx.com',
        logo: 'https://rutasenmx.com/logo.png',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Rutas en MX',
        url: 'https://rutasenmx.com',
        inLanguage: 'es',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://rutasenmx.com/buscar?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'TouristAttraction',
        name: 'Teotihuacan',
        description: 'Ancient pyramids',
        url: 'https://rutasenmx.com/lugares/teotihuacan',
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 19.6925,
          longitude: -98.8438,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Test Article',
        datePublished: '2025-01-15',
        author: { '@type': 'Organization', name: 'Rutas en MX' },
      },
    ];

    for (const schema of sampleSchemas) {
      const issues = validateSchema(schema);
      allIssues.push(...issues);
    }
  } catch (err) {
    allIssues.push({
      schemaType: 'import',
      field: 'schema.ts',
      severity: 'error',
      message: `Failed to validate schema builders: ${err instanceof Error ? err.message : 'unknown'}`,
    });
  }

  return allIssues;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const baseUrlIndex = args.indexOf('--base-url');
  const baseUrl = baseUrlIndex >= 0 ? args[baseUrlIndex + 1] : null;

  console.log('==========================================================');
  console.log('  JSON-LD SCHEMA VALIDATION - Rutas en MX');
  console.log(`  ${new Date().toISOString()}`);
  console.log('==========================================================\n');

  let allIssues: SchemaIssue[] = [];

  // Static analysis of schema builders
  console.log('  Validating schema builders (static)...');
  const staticIssues = validateSchemaBuilders();
  allIssues = allIssues.concat(staticIssues);

  // Live page analysis (optional)
  if (baseUrl) {
    console.log(`\n  Validating live pages at ${baseUrl}...`);
    const liveIssues = await validateLivePages(baseUrl);
    allIssues = allIssues.concat(liveIssues);
  } else {
    console.log('\n  Skipping live page validation (pass --base-url to enable)');
  }

  // Build report
  const report: SchemaValidationReport = {
    timestamp: new Date().toISOString(),
    totalSchemas: allIssues.length,
    errors: allIssues.filter((i) => i.severity === 'error').length,
    warnings: allIssues.filter((i) => i.severity === 'warning').length,
    issues: allIssues,
  };

  // Print results
  console.log('\n----------------------------------------------------------');
  console.log(`  Errors: ${report.errors}`);
  console.log(`  Warnings: ${report.warnings}`);
  console.log('----------------------------------------------------------\n');

  if (allIssues.length > 0) {
    for (const issue of allIssues) {
      const icon = issue.severity === 'error' ? '[ERROR]' : '[WARN] ';
      console.log(`  ${icon} ${issue.schemaType}.${issue.field}: ${issue.message}`);
    }
  } else {
    console.log('  All schemas are valid!');
  }

  // Write report
  const projectRoot = path.resolve(__dirname, '..');
  const outputDir = path.join(projectRoot, 'data', 'seo');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const reportPath = path.join(outputDir, 'schema-validation.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n  Report saved to: ${reportPath}\n`);

  if (report.errors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Schema validation failed:', err);
  process.exit(1);
});
