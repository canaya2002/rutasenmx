/**
 * Seed script for RutasEnMX
 *
 * Populates the database with initial data from JSON seed files.
 *
 * Usage: npx tsx scripts/seed.ts [--dry-run]
 */

import './_env'; // MUST be first — loads .env.local before @/db touches process.env
import { readFileSync } from 'fs';
import { join } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');

interface SeedState {
  name: string;
  slug: string;
  abbr: string;
  capital: string;
  description: string;
  descriptionSeo?: string;
}

interface SeedPuebloMagico {
  name: string;
  state: string;
  municipality?: string;
  latitude: number;
  longitude: number;
  description: string;
  yearDesignated?: number;
}

interface SeedZonaArqueologica {
  name: string;
  state: string;
  municipality?: string;
  latitude: number;
  longitude: number;
  description: string;
  culture?: string;
  period?: string;
}

function loadJson<T>(relativePath: string): T {
  const fullPath = join(process.cwd(), relativePath);
  const raw = readFileSync(fullPath, 'utf-8');
  return JSON.parse(raw) as T;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  console.log('=== RutasEnMX Seed Script ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  // Load seed data.
  //
  // Pueblos Mágicos: there are two complementary files:
  //   - pueblos-magicos-177.json → editorial content (name, resumen, dato curioso,
  //     atracciones) for all 177 oficialmente designados por SECTUR.
  //   - pueblos-magicos-coords.json → lat/lng lookup keyed on the 177 file's id.
  //
  // Merge both so every row lands with editorial copy AND coordinates. The
  // legacy pueblos-magicos.json (64 rows with lat/lng inline) is kept as
  // fallback — if any id is missing in the coords file, we fall back to
  // name-based coord lookup against the legacy 64 set.
  const estados = loadJson<SeedState[]>('data/seeds/estados.json');
  const pm177 = loadJson<{
    pueblos_magicos: Array<{
      id: string;
      estado: string;
      pueblo_magico: string;
      macroregion: string;
      resumen_general: string;
      dato_curioso: string;
      atracciones_principales: string[];
    }>;
  }>('data/seeds/pueblos-magicos-177.json');
  const pmCoords = loadJson<Record<string, { lat: number; lng: number }>>(
    'data/seeds/pueblos-magicos-coords.json',
  );
  const legacyPm = loadJson<SeedPuebloMagico[]>(
    'data/seeds/pueblos-magicos.json',
  );
  const legacyByName = new Map(
    legacyPm.map((p) => [
      p.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''),
      p,
    ]),
  );

  const pueblosMagicos: SeedPuebloMagico[] = pm177.pueblos_magicos.map((p) => {
    const coords = pmCoords[p.id];
    const legacy = legacyByName.get(
      p.pueblo_magico
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, ''),
    );
    return {
      name: p.pueblo_magico,
      state: p.estado,
      municipality: legacy?.municipality,
      latitude: coords?.lat ?? legacy?.latitude ?? 0,
      longitude: coords?.lng ?? legacy?.longitude ?? 0,
      description: p.resumen_general,
      yearDesignated: legacy?.yearDesignated,
    };
  });

  const zonasArqueologicas = loadJson<SeedZonaArqueologica[]>(
    'data/seeds/zonas-arqueologicas.json',
  );

  // Sanity check: log how many merged entries have real coordinates.
  const withCoords = pueblosMagicos.filter(
    (p) => p.latitude !== 0 && p.longitude !== 0,
  ).length;

  console.log(`Estados: ${estados.length}`);
  console.log(
    `Pueblos Magicos: ${pueblosMagicos.length} (con coordenadas: ${withCoords})`,
  );
  console.log(`Zonas Arqueologicas: ${zonasArqueologicas.length}`);
  console.log('');

  if (DRY_RUN) {
    console.log('[DRY RUN] Would insert:');
    console.log(`  - ${pueblosMagicos.length} pueblos magicos as places`);
    console.log(`  - ${zonasArqueologicas.length} zonas arqueologicas as places`);
    console.log('');
    console.log('[DRY RUN] Sample place slugs:');
    pueblosMagicos.slice(0, 5).forEach((pm) => {
      console.log(`  - ${slugify(pm.name)} (${pm.state})`);
    });
    console.log('');
    console.log('Dry run complete. No data was written.');
    return;
  }

  // Dynamic import of DB to avoid connection during --dry-run
  const { db } = await import('../src/db');
  const schema = await import('../src/db/schema');

  // Seed places - Pueblos Magicos
  console.log('Seeding Pueblos Magicos...');
  let insertedPM = 0;
  for (const pm of pueblosMagicos) {
    const slug = slugify(pm.name);

    try {
      await db
        .insert(schema.places)
        .values({
          slug,
          name: pm.name,
          shortDescription: pm.description,
          latitude: pm.latitude,
          longitude: pm.longitude,
          state: pm.state,
          municipality: pm.municipality ?? null,
          subcategoryIds: ['pueblo-magico'],
          badges: ['pueblo-magico-oficial'],
          isPublished: true,
          editorialNotes: 'Seeded from data/seeds/pueblos-magicos.json',
        })
        .onConflictDoNothing({ target: schema.places.slug });
      insertedPM++;
    } catch (err) {
      console.error(`  Error inserting ${pm.name}: ${err instanceof Error ? err.message : err}`);
    }
  }
  console.log(`  Inserted: ${insertedPM}/${pueblosMagicos.length}`);

  // Seed places - Zonas Arqueologicas
  console.log('Seeding Zonas Arqueologicas...');
  let insertedZA = 0;
  for (const za of zonasArqueologicas) {
    const slug = slugify(za.name);

    try {
      await db
        .insert(schema.places)
        .values({
          slug,
          name: za.name,
          shortDescription: za.description,
          latitude: za.latitude,
          longitude: za.longitude,
          state: za.state,
          municipality: za.municipality ?? null,
          subcategoryIds: za.culture ? [za.culture.toLowerCase()] : [],
          badges: ['inah-oficial'],
          isPublished: true,
          editorialNotes: 'Seeded from data/seeds/zonas-arqueologicas.json',
        })
        .onConflictDoNothing({ target: schema.places.slug });
      insertedZA++;
    } catch (err) {
      console.error(`  Error inserting ${za.name}: ${err instanceof Error ? err.message : err}`);
    }
  }
  console.log(`  Inserted: ${insertedZA}/${zonasArqueologicas.length}`);

  console.log('');
  console.log('Seed complete!');
  console.log(`Total places seeded: ${insertedPM + insertedZA}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
