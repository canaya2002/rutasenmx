/**
 * Fetches real data from Mexican government open APIs and saves to JSON files.
 * These files are then used by the app as seed data.
 *
 * Usage: npx tsx scripts/fetch-real-data.ts
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const OUT_DIR = join(process.cwd(), 'data', 'fetched');
mkdirSync(OUT_DIR, { recursive: true });

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function stateSlug(stateName: string): string {
  const map: Record<string, string> = {
    'Aguascalientes': 'aguascalientes',
    'Baja California': 'baja-california',
    'Baja California Sur': 'baja-california-sur',
    'Campeche': 'campeche',
    'Chiapas': 'chiapas',
    'Chihuahua': 'chihuahua',
    'Ciudad de México': 'ciudad-de-mexico',
    'Coahuila de Zaragoza': 'coahuila',
    'Coahuila': 'coahuila',
    'Colima': 'colima',
    'Durango': 'durango',
    'Guanajuato': 'guanajuato',
    'Guerrero': 'guerrero',
    'Hidalgo': 'hidalgo',
    'Jalisco': 'jalisco',
    'México': 'estado-de-mexico',
    'Estado de México': 'estado-de-mexico',
    'Michoacán de Ocampo': 'michoacan',
    'Michoacán': 'michoacan',
    'Morelos': 'morelos',
    'Nayarit': 'nayarit',
    'Nuevo León': 'nuevo-leon',
    'Oaxaca': 'oaxaca',
    'Puebla': 'puebla',
    'Querétaro': 'queretaro',
    'Quintana Roo': 'quintana-roo',
    'San Luis Potosí': 'san-luis-potosi',
    'Sinaloa': 'sinaloa',
    'Sonora': 'sonora',
    'Tabasco': 'tabasco',
    'Tamaulipas': 'tamaulipas',
    'Tlaxcala': 'tlaxcala',
    'Veracruz de Ignacio de la Llave': 'veracruz',
    'Veracruz': 'veracruz',
    'Yucatán': 'yucatan',
    'Zacatecas': 'zacatecas',
    'Distrito Federal': 'ciudad-de-mexico',
  };
  return map[stateName] || slugify(stateName);
}

// ─── Fetch museums from SIC ───────────────────────────────────────────────

async function fetchMuseos() {
  console.log('Fetching museums from SIC Cultura...');
  const res = await fetch('https://sic.cultura.gob.mx/opendata/d/0_museo_directorio.json');
  if (!res.ok) throw new Error(`SIC API returned ${res.status}`);

  const raw: Array<{
    museo_id: number;
    museo_nombre: string;
    museo_tematica_n1: string;
    museo_calle_numero: string;
    museo_colonia: string;
    museo_cp: string;
    museo_telefono1: string;
    pagina_web: string;
    email: string;
    gmaps_latitud: number;
    gmaps_longitud: number;
    nom_ent: string;
    nom_mun: string;
    nom_loc: string;
    link_sic: string;
    fecha_mod: string;
  }> = await res.json();

  console.log(`  Raw records: ${raw.length}`);

  const museums = raw
    .filter((m) => m.gmaps_latitud && m.gmaps_longitud && m.museo_nombre)
    .map((m) => ({
      id: `sic-museo-${m.museo_id}`,
      slug: slugify(m.museo_nombre),
      name: m.museo_nombre.trim(),
      category: 'museos' as const,
      categoryName: 'Museo',
      lat: m.gmaps_latitud,
      lng: m.gmaps_longitud,
      state: m.nom_ent,
      stateSlug: stateSlug(m.nom_ent),
      municipality: m.nom_mun,
      address: [m.museo_calle_numero, m.museo_colonia, m.museo_cp].filter(Boolean).join(', '),
      phone: m.museo_telefono1 || undefined,
      website: m.pagina_web || undefined,
      email: m.email || undefined,
      theme: m.museo_tematica_n1,
      sourceUrl: m.link_sic,
      sourceDate: m.fecha_mod,
      description: `${m.museo_nombre} es un museo de ${(m.museo_tematica_n1 || 'interés general').toLowerCase()} ubicado en ${m.nom_mun}, ${m.nom_ent}.`,
      badges: ['sic-oficial'],
    }));

  // Deduplicate by slug
  const seen = new Set<string>();
  const deduped = museums.filter((m) => {
    if (seen.has(m.slug)) return false;
    seen.add(m.slug);
    return true;
  });

  console.log(`  Valid museums (with coordinates): ${deduped.length}`);
  writeFileSync(join(OUT_DIR, 'museos-sic.json'), JSON.stringify(deduped, null, 2));
  console.log(`  Saved to data/fetched/museos-sic.json`);
  return deduped;
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== RutasEnMX: Fetch Real Data ===\n');

  try {
    const museums = await fetchMuseos();
    console.log(`\nTotal museums fetched: ${museums.length}`);
  } catch (err) {
    console.error('Error fetching museums:', err);
  }

  console.log('\nDone! Check data/fetched/ for output files.');
  console.log('Run "npx tsx scripts/load-fetched-data.ts" to integrate into the app.');
}

main().catch(console.error);
