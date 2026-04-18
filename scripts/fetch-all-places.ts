/**
 * Fetches ALL real places from Mexican government open APIs
 * and generates a complete mock-places-real.ts file.
 *
 * Usage: npx tsx scripts/fetch-all-places.ts
 */

import { writeFileSync, readFileSync, mkdirSync } from 'fs';
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

const STATE_MAP: Record<string, string> = {
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
  'Estado de México': 'estado-de-mexico',
  'Guanajuato': 'guanajuato',
  'Guerrero': 'guerrero',
  'Hidalgo': 'hidalgo',
  'Jalisco': 'jalisco',
  'México': 'estado-de-mexico',
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

function getStateSlug(name: string): string {
  return STATE_MAP[name] || slugify(name);
}

interface Place {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryName: string;
  lat: number;
  lng: number;
  state: string;
  stateSlug: string;
  municipality: string;
  description: string;
  badges: string[];
  source: string;
}

async function fetchMuseos(): Promise<Place[]> {
  console.log('Fetching museums from SIC Cultura...');
  const res = await fetch('https://sic.cultura.gob.mx/opendata/d/0_museo_directorio.json');
  if (!res.ok) throw new Error(`SIC museums API returned ${res.status}`);
  const raw = await res.json() as Array<Record<string, unknown>>;
  console.log(`  Raw: ${raw.length}`);

  const seen = new Set<string>();
  return raw
    .filter((m) => m.gmaps_latitud && m.gmaps_longitud && m.museo_nombre)
    .map((m) => {
      const name = (m.museo_nombre as string).trim();
      let slug = slugify(name);
      if (seen.has(slug)) slug = `${slug}-${m.museo_id}`;
      seen.add(slug);
      const state = (m.nom_ent as string) || '';
      return {
        id: `sic-${m.museo_id}`,
        slug,
        name,
        category: 'museos',
        categoryName: 'Museo',
        lat: m.gmaps_latitud as number,
        lng: m.gmaps_longitud as number,
        state,
        stateSlug: getStateSlug(state),
        municipality: (m.nom_mun as string) || '',
        description: `${name} es un museo de ${((m.museo_tematica_n1 as string) || 'interés general').toLowerCase()} ubicado en ${m.nom_mun || ''}, ${state}.`,
        badges: ['sic-oficial'],
        source: 'SIC Cultura',
      };
    });
}

async function fetchZonasArqueologicas(): Promise<Place[]> {
  console.log('Fetching archaeological zones from SIC...');
  const res = await fetch('https://sic.cultura.gob.mx/opendata/d/0_zona_arqueologica_directorio.json');
  if (!res.ok) throw new Error(`SIC ZA API returned ${res.status}`);
  const raw = await res.json() as Array<Record<string, unknown>>;
  console.log(`  Raw: ${raw.length}`);

  const seen = new Set<string>();
  return raw
    .filter((z) => z.gmaps_latitud && z.gmaps_longitud && z.zona_arqueologica_nombre)
    .map((z) => {
      const name = (z.zona_arqueologica_nombre as string).trim();
      let slug = slugify(name);
      if (seen.has(slug)) slug = `${slug}-${z.zona_arqueologica_id}`;
      seen.add(slug);
      const state = (z.nom_ent as string) || '';
      return {
        id: `sic-za-${z.zona_arqueologica_id}`,
        slug,
        name,
        category: 'zonas-arqueologicas',
        categoryName: 'Zona arqueológica',
        lat: z.gmaps_latitud as number,
        lng: z.gmaps_longitud as number,
        state,
        stateSlug: getStateSlug(state),
        municipality: (z.nom_mun as string) || '',
        description: `${name} es una zona arqueológica ubicada en ${z.nom_mun || ''}, ${state}.`,
        badges: ['inah-oficial'],
        source: 'SIC Cultura / INAH',
      };
    });
}

async function main() {
  console.log('=== Fetching ALL real places from government APIs ===\n');

  const museums = await fetchMuseos();
  console.log(`  Museums with coords: ${museums.length}`);

  const zonas = await fetchZonasArqueologicas();
  console.log(`  Archaeological zones with coords: ${zonas.length}`);

  // Save individual files
  writeFileSync(join(OUT_DIR, 'museos.json'), JSON.stringify(museums, null, 2));
  writeFileSync(join(OUT_DIR, 'zonas-arqueologicas.json'), JSON.stringify(zonas, null, 2));

  // Combine all
  const all = [...museums, ...zonas];
  writeFileSync(join(OUT_DIR, 'all-places.json'), JSON.stringify(all, null, 2));

  console.log(`\n=== Summary ===`);
  console.log(`Museums: ${museums.length}`);
  console.log(`Archaeological zones: ${zonas.length}`);
  console.log(`Total: ${all.length}`);
  console.log(`\nSaved to data/fetched/`);

  // Now generate the TypeScript data module
  console.log('\nGenerating real-places data module...');

  const tsContent = `// Auto-generated from government APIs - ${new Date().toISOString().split('T')[0]}
// Museums: SIC Cultura (https://sic.cultura.gob.mx)
// Zones: SIC Cultura / INAH
// DO NOT EDIT MANUALLY

export interface RealPlace {
  id: string;
  slug: string;
  name: string;
  category: 'museos' | 'zonas-arqueologicas';
  categoryName: string;
  lat: number;
  lng: number;
  state: string;
  stateSlug: string;
  municipality: string;
  description: string;
  badges: string[];
  source: string;
}

export const realMuseos: RealPlace[] = ${JSON.stringify(museums, null, 2)};

export const realZonasArqueologicas: RealPlace[] = ${JSON.stringify(zonas, null, 2)};

export const allRealPlaces: RealPlace[] = [...realMuseos, ...realZonasArqueologicas];
`;

  writeFileSync(join(process.cwd(), 'src', 'lib', 'data', 'real-places.ts'), tsContent);
  console.log('Generated src/lib/data/real-places.ts');
}

main().catch(console.error);
