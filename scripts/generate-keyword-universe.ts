/**
 * Generate keyword universe.
 *
 * Run: npx tsx scripts/generate-keyword-universe.ts
 *
 * - Combines geo + category + intent + modifier templates
 * - Generates all combinations
 * - Assigns target URL for each
 * - Detects potential cannibalization
 * - Outputs to data/seo/keyword-universe.json
 * - Outputs keyword cluster ownership to data/seo/keyword-clusters.json
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const ESTADOS = [
  'aguascalientes', 'baja-california', 'baja-california-sur', 'campeche',
  'chiapas', 'chihuahua', 'ciudad-de-mexico', 'coahuila', 'colima',
  'durango', 'estado-de-mexico', 'guanajuato', 'guerrero', 'hidalgo',
  'jalisco', 'michoacan', 'morelos', 'nayarit', 'nuevo-leon', 'oaxaca',
  'puebla', 'queretaro', 'quintana-roo', 'san-luis-potosi', 'sinaloa',
  'sonora', 'tabasco', 'tamaulipas', 'tlaxcala', 'veracruz', 'yucatan',
  'zacatecas',
];

const ESTADO_NAMES: Record<string, string> = {
  'aguascalientes': 'Aguascalientes',
  'baja-california': 'Baja California',
  'baja-california-sur': 'Baja California Sur',
  'campeche': 'Campeche',
  'chiapas': 'Chiapas',
  'chihuahua': 'Chihuahua',
  'ciudad-de-mexico': 'Ciudad de Mexico',
  'coahuila': 'Coahuila',
  'colima': 'Colima',
  'durango': 'Durango',
  'estado-de-mexico': 'Estado de Mexico',
  'guanajuato': 'Guanajuato',
  'guerrero': 'Guerrero',
  'hidalgo': 'Hidalgo',
  'jalisco': 'Jalisco',
  'michoacan': 'Michoacan',
  'morelos': 'Morelos',
  'nayarit': 'Nayarit',
  'nuevo-leon': 'Nuevo Leon',
  'oaxaca': 'Oaxaca',
  'puebla': 'Puebla',
  'queretaro': 'Queretaro',
  'quintana-roo': 'Quintana Roo',
  'san-luis-potosi': 'San Luis Potosi',
  'sinaloa': 'Sinaloa',
  'sonora': 'Sonora',
  'tabasco': 'Tabasco',
  'tamaulipas': 'Tamaulipas',
  'tlaxcala': 'Tlaxcala',
  'veracruz': 'Veracruz',
  'yucatan': 'Yucatan',
  'zacatecas': 'Zacatecas',
};

const CATEGORIES = [
  { slug: 'museos', name: 'museos' },
  { slug: 'zonas-arqueologicas', name: 'zonas arqueologicas' },
  { slug: 'pueblos-magicos', name: 'pueblos magicos' },
  { slug: 'playas', name: 'playas' },
  { slug: 'cenotes', name: 'cenotes' },
  { slug: 'cascadas', name: 'cascadas' },
];

const MODIFIERS = [
  'mejores', 'top', 'que visitar', 'como llegar', 'horarios y precios',
  'cerca de', 'baratos', 'gratis', 'con ninos', 'en pareja',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KeywordEntry {
  keyword: string;
  targetUrl: string;
  intent: string;
  category?: string;
  estado?: string;
  modifier?: string;
  type: 'hub' | 'state-category' | 'state' | 'modified';
}

interface KeywordCluster {
  primary: string;
  secondary: string[];
  targetUrl: string;
  owner: string;
}

interface CannibalizationWarning {
  keyword: string;
  urls: string[];
  reason: string;
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

function generateKeywordUniverse(): {
  keywords: KeywordEntry[];
  clusters: KeywordCluster[];
  cannibalization: CannibalizationWarning[];
} {
  const keywords: KeywordEntry[] = [];
  const keywordUrlMap = new Map<string, string[]>();

  function addKeyword(entry: KeywordEntry) {
    keywords.push(entry);
    const existing = keywordUrlMap.get(entry.keyword) ?? [];
    existing.push(entry.targetUrl);
    keywordUrlMap.set(entry.keyword, existing);
  }

  // 1. Hub-level keywords (category hubs)
  for (const cat of CATEGORIES) {
    addKeyword({
      keyword: `${cat.name} mexico`,
      targetUrl: `/${cat.slug}`,
      intent: 'navigational',
      category: cat.slug,
      type: 'hub',
    });

    addKeyword({
      keyword: `mejores ${cat.name} mexico`,
      targetUrl: `/${cat.slug}`,
      intent: 'informational',
      category: cat.slug,
      modifier: 'mejores',
      type: 'modified',
    });
  }

  // 2. State-level keywords
  for (const estado of ESTADOS) {
    const estadoName = ESTADO_NAMES[estado] ?? estado;

    addKeyword({
      keyword: `que visitar en ${estadoName.toLowerCase()}`,
      targetUrl: `/estados/${estado}`,
      intent: 'informational',
      estado,
      type: 'state',
    });

    addKeyword({
      keyword: `turismo en ${estadoName.toLowerCase()}`,
      targetUrl: `/estados/${estado}`,
      intent: 'informational',
      estado,
      modifier: 'turismo',
      type: 'modified',
    });

    // 3. State + Category combinations
    for (const cat of CATEGORIES) {
      addKeyword({
        keyword: `${cat.name} ${estadoName.toLowerCase()}`,
        targetUrl: `/estados/${estado}/${cat.slug}`,
        intent: 'informational',
        category: cat.slug,
        estado,
        type: 'state-category',
      });

      // With modifiers
      for (const modifier of MODIFIERS.slice(0, 3)) {
        addKeyword({
          keyword: `${modifier} ${cat.name} ${estadoName.toLowerCase()}`,
          targetUrl: `/estados/${estado}/${cat.slug}`,
          intent: 'informational',
          category: cat.slug,
          estado,
          modifier,
          type: 'modified',
        });
      }
    }
  }

  // 4. Detect cannibalization
  const cannibalization: CannibalizationWarning[] = [];
  for (const [keyword, urls] of keywordUrlMap.entries()) {
    const uniqueUrls = [...new Set(urls)];
    if (uniqueUrls.length > 1) {
      cannibalization.push({
        keyword,
        urls: uniqueUrls,
        reason: `Keyword "${keyword}" is targeted by ${uniqueUrls.length} different URLs`,
      });
    }
  }

  // 5. Build clusters
  const clusterMap = new Map<string, KeywordCluster>();
  for (const entry of keywords) {
    const existing = clusterMap.get(entry.targetUrl);
    if (!existing) {
      clusterMap.set(entry.targetUrl, {
        primary: entry.keyword,
        secondary: [],
        targetUrl: entry.targetUrl,
        owner: entry.targetUrl,
      });
    } else {
      existing.secondary.push(entry.keyword);
    }
  }
  const clusters = [...clusterMap.values()];

  return { keywords, clusters, cannibalization };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('Generating keyword universe...\n');

  const { keywords, clusters, cannibalization } = generateKeywordUniverse();

  const outputDir = path.resolve(__dirname, '..', 'data', 'seo');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write keyword universe
  const universePath = path.join(outputDir, 'keyword-universe.json');
  fs.writeFileSync(universePath, JSON.stringify(keywords, null, 2), 'utf-8');
  console.log(`  Keywords: ${keywords.length}`);
  console.log(`  Written to: ${universePath}`);

  // Write clusters
  const clustersPath = path.join(outputDir, 'keyword-clusters.json');
  fs.writeFileSync(clustersPath, JSON.stringify(clusters, null, 2), 'utf-8');
  console.log(`  Clusters: ${clusters.length}`);
  console.log(`  Written to: ${clustersPath}`);

  // Report cannibalization
  if (cannibalization.length > 0) {
    console.log(`\n  [WARN] ${cannibalization.length} potential cannibalization issue(s):`);
    for (const issue of cannibalization.slice(0, 10)) {
      console.log(`    - "${issue.keyword}" -> ${issue.urls.join(', ')}`);
    }
    if (cannibalization.length > 10) {
      console.log(`    ... and ${cannibalization.length - 10} more`);
    }

    const cannibPath = path.join(outputDir, 'cannibalization-warnings.json');
    fs.writeFileSync(cannibPath, JSON.stringify(cannibalization, null, 2), 'utf-8');
    console.log(`  Written to: ${cannibPath}`);
  } else {
    console.log('\n  No cannibalization issues detected.');
  }

  console.log('\nDone.');
}

main();
