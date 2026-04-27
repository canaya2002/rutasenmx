/**
 * Seed script for RutasEnMX
 *
 * Populates the database with the full catalogue used by the explorer map:
 *   • Pueblos Mágicos       (177)   — data/seeds/pueblos-magicos-177.json
 *   • Museos                (~1700) — data/fetched/museos.json (SIC Cultura)
 *   • Zonas Arqueológicas   (~196)  — data/fetched/zonas-arqueologicas.json (INAH/SIC)
 *   • Centros Históricos    (10)    — extracted from data/seeds/extra-places.json
 *   • Haciendas             (200+)  — data/seeds/haciendas.json
 *   • Playas                (450+)  — data/seeds/playas.json
 *
 * Each row is wired to its `place_categories.id` (looked up by slug) so the
 * /api/places category filter works without falling back to subcategory_ids.
 *
 * Usage: npx tsx scripts/seed.ts [--dry-run]
 */

import './_env'; // MUST be first — loads .env.local before @/db touches process.env
import { readFileSync, existsSync } from 'fs';
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

interface FetchedPlace {
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
  badges?: string[];
}

interface ExtraPlace {
  name: string;
  category: string;
  state: string;
  stateSlug?: string;
  lat: number;
  lng: number;
  description: string;
  municipality?: string;
}

interface CuratedPlace {
  name: string;
  state: string;
  stateSlug?: string;
  municipality?: string;
  lat: number;
  lng: number;
  description: string;
}

function loadJson<T>(relativePath: string): T {
  const fullPath = join(process.cwd(), relativePath);
  const raw = readFileSync(fullPath, 'utf-8');
  return JSON.parse(raw) as T;
}

function safeLoadJson<T>(relativePath: string): T | null {
  const fullPath = join(process.cwd(), relativePath);
  if (!existsSync(fullPath)) return null;
  const raw = readFileSync(fullPath, 'utf-8');
  return JSON.parse(raw) as T;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const CATEGORY_DEFS: Array<{
  slug: string;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  sortOrder: number;
}> = [
  { slug: 'pueblos-magicos', name: 'Pueblos Mágicos', nameEn: 'Magic Towns', icon: 'sparkles', color: '#06C167', sortOrder: 1 },
  { slug: 'museos', name: 'Museos', nameEn: 'Museums', icon: 'landmark', color: '#8B5CF6', sortOrder: 2 },
  { slug: 'zonas-arqueologicas', name: 'Zonas arqueológicas', nameEn: 'Archaeological zones', icon: 'pyramid', color: '#D97706', sortOrder: 3 },
  { slug: 'centros-historicos', name: 'Centros históricos', nameEn: 'Historic centers', icon: 'church', color: '#DC2626', sortOrder: 4 },
  { slug: 'haciendas', name: 'Haciendas', nameEn: 'Haciendas', icon: 'home', color: '#E11D48', sortOrder: 5 },
  { slug: 'playas', name: 'Playas', nameEn: 'Beaches', icon: 'waves', color: '#0EA5E9', sortOrder: 6 },
];

async function main() {
  console.log('=== RutasEnMX Seed Script ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  // ─── Load Pueblos Mágicos (177 + coords + legacy) ──────────────────────────
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

  // ─── Load Zonas Arqueológicas — prefer the full SIC/INAH dump ──────────────
  const zonasFetched = safeLoadJson<FetchedPlace[]>(
    'data/fetched/zonas-arqueologicas.json',
  );
  const zonasSeed = loadJson<SeedZonaArqueologica[]>(
    'data/seeds/zonas-arqueologicas.json',
  );

  const zonasArqueologicas: SeedZonaArqueologica[] =
    zonasFetched && zonasFetched.length > zonasSeed.length
      ? zonasFetched.map((z) => ({
          name: z.name,
          state: z.state,
          municipality: z.municipality,
          latitude: z.lat,
          longitude: z.lng,
          description: z.description,
        }))
      : zonasSeed;

  // ─── Load Museos (full SIC dump) ──────────────────────────────────────────
  const museos = safeLoadJson<FetchedPlace[]>('data/fetched/museos.json') ?? [];

  // ─── Load Haciendas + Playas (curated) ────────────────────────────────────
  const haciendas = safeLoadJson<CuratedPlace[]>('data/seeds/haciendas.json') ?? [];
  const playas = safeLoadJson<CuratedPlace[]>('data/seeds/playas.json') ?? [];

  // ─── Load extra-places for Centros Históricos (10 patrimonio UNESCO) ─────
  const extra = safeLoadJson<ExtraPlace[]>('data/seeds/extra-places.json') ?? [];
  const centrosHistoricos: CuratedPlace[] = extra
    .filter((p) => p.category === 'centros-historicos')
    .map((p) => ({
      name: p.name,
      state: p.state,
      stateSlug: p.stateSlug,
      municipality: p.municipality,
      lat: p.lat,
      lng: p.lng,
      description: p.description,
    }));

  console.log('=== Loaded data ===');
  console.log(`Estados:                ${estados.length}`);
  console.log(`Pueblos Mágicos:        ${pueblosMagicos.length}`);
  console.log(`Museos:                 ${museos.length}`);
  console.log(`Zonas Arqueológicas:    ${zonasArqueologicas.length}`);
  console.log(`Centros Históricos:     ${centrosHistoricos.length}`);
  console.log(`Haciendas:              ${haciendas.length}`);
  console.log(`Playas:                 ${playas.length}`);
  console.log('');

  if (DRY_RUN) {
    console.log('[DRY RUN] No data was written.');
    return;
  }

  const { db } = await import('../src/db');
  const schema = await import('../src/db/schema');
  const { eq, sql } = await import('drizzle-orm');

  // ─── Ensure place_categories rows exist + remember their UUIDs ────────────
  console.log('Upserting place_categories…');
  const categoryIdBySlug = new Map<string, string>();
  for (const c of CATEGORY_DEFS) {
    const [existing] = await db
      .select({ id: schema.placeCategories.id })
      .from(schema.placeCategories)
      .where(eq(schema.placeCategories.slug, c.slug))
      .limit(1);

    if (existing) {
      await db
        .update(schema.placeCategories)
        .set({
          name: c.name,
          nameEn: c.nameEn,
          icon: c.icon,
          color: c.color,
          sortOrder: c.sortOrder,
          isActive: true,
        })
        .where(eq(schema.placeCategories.id, existing.id));
      categoryIdBySlug.set(c.slug, existing.id);
    } else {
      const [created] = await db
        .insert(schema.placeCategories)
        .values({
          slug: c.slug,
          name: c.name,
          nameEn: c.nameEn,
          icon: c.icon,
          color: c.color,
          sortOrder: c.sortOrder,
        })
        .returning({ id: schema.placeCategories.id });
      categoryIdBySlug.set(c.slug, created.id);
    }
  }

  // Drop legacy categories that are no longer surfaced in the explorer.
  // We also unpublish any places still pointing at them so they stop
  // showing up on /explorar with a generic 📍 marker.
  for (const oldSlug of ['cenotes', 'sitios-inah']) {
    const [legacyCat] = await db
      .select({ id: schema.placeCategories.id })
      .from(schema.placeCategories)
      .where(eq(schema.placeCategories.slug, oldSlug))
      .limit(1);

    if (legacyCat) {
      await db
        .update(schema.placeCategories)
        .set({ isActive: false })
        .where(eq(schema.placeCategories.id, legacyCat.id));

      await db
        .update(schema.places)
        .set({ isPublished: false })
        .where(eq(schema.places.categoryId, legacyCat.id));
    }
  }

  // ─── Sweep: unpublish any place whose stored coordinates are obviously
  //     wrong. Catches rows that were inserted by a previous seed run before
  //     the in-loop guard existed (e.g. SIC's `sic-2079` Xochipala row whose
  //     lng was set equal to lat, dropping it in Chad).
  console.log('Sweeping out-of-bounds coordinates…');
  const sweep = await db
    .update(schema.places)
    .set({ isPublished: false })
    .where(
      sql`(
        ${schema.places.latitude} IS NULL OR
        ${schema.places.longitude} IS NULL OR
        ${schema.places.latitude} < 14 OR
        ${schema.places.latitude} > 33 OR
        ${schema.places.longitude} < -119 OR
        ${schema.places.longitude} > -86 OR
        ${schema.places.latitude} = ${schema.places.longitude}
      )`,
    )
    .returning({ id: schema.places.id });
  console.log(`  Unpublished ${sweep.length} rows with bad coords.`);

  // ─── Generic upsert helper ────────────────────────────────────────────────
  async function seedCategory<T extends { name: string }>(
    label: string,
    categorySlug: string,
    rows: T[],
    pickFields: (row: T) => {
      slug: string;
      shortDescription: string;
      latitude: number;
      longitude: number;
      state: string;
      municipality: string | null;
      badges: string[];
      subcategoryIds: string[];
      richness: number;
    },
  ) {
    const categoryId = categoryIdBySlug.get(categorySlug);
    if (!categoryId) {
      console.warn(`  Skipping ${label}: missing categoryId for ${categorySlug}`);
      return;
    }
    console.log(`Seeding ${label} (${rows.length})…`);
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const seenSlugs = new Set<string>();
    for (const row of rows) {
      const fields = pickFields(row);
      const baseSlug = fields.slug;
      if (!baseSlug) {
        skipped++;
        continue;
      }
      if (fields.latitude === 0 && fields.longitude === 0) {
        skipped++;
        continue;
      }

      // Sanity-check coordinates — drop anything outside Mexico's bounding box.
      // SIC's open-data feed has at least one row (sic-2079) where the API
      // returned lat==lng, dropping the place in Chad. We don't want those in
      // the map. Mexico ~ lat[14, 33], lng[-119, -86].
      if (
        fields.latitude < 14 ||
        fields.latitude > 33 ||
        fields.longitude < -119 ||
        fields.longitude > -86 ||
        fields.latitude === fields.longitude
      ) {
        skipped++;
        continue;
      }

      // Disambiguate within a category if the file has duplicates.
      let slug = baseSlug;
      let dedupe = 2;
      while (seenSlugs.has(slug)) {
        slug = `${baseSlug}-${dedupe++}`;
      }
      seenSlugs.add(slug);

      try {
        const [existing] = await db
          .select({ id: schema.places.id })
          .from(schema.places)
          .where(eq(schema.places.slug, slug))
          .limit(1);

        if (existing) {
          await db
            .update(schema.places)
            .set({
              name: row.name,
              shortDescription: fields.shortDescription,
              latitude: fields.latitude,
              longitude: fields.longitude,
              state: fields.state,
              municipality: fields.municipality,
              categoryId,
              subcategoryIds: fields.subcategoryIds,
              badges: fields.badges,
              isPublished: true,
              richnessScore: fields.richness,
            })
            .where(eq(schema.places.id, existing.id));
          updated++;
        } else {
          await db.insert(schema.places).values({
            slug,
            name: row.name,
            shortDescription: fields.shortDescription,
            latitude: fields.latitude,
            longitude: fields.longitude,
            state: fields.state,
            municipality: fields.municipality,
            categoryId,
            subcategoryIds: fields.subcategoryIds,
            badges: fields.badges,
            isPublished: true,
            richnessScore: fields.richness,
            editorialNotes: `Seeded as ${categorySlug}`,
          });
          inserted++;
        }
      } catch (err) {
        console.error(`  Error on ${row.name}: ${err instanceof Error ? err.message : err}`);
      }
    }
    console.log(`  ${label}: inserted ${inserted}, updated ${updated}, skipped ${skipped}`);
  }

  // ─── Pueblos Mágicos ──────────────────────────────────────────────────────
  await seedCategory(
    'Pueblos Mágicos',
    'pueblos-magicos',
    pueblosMagicos,
    (pm) => ({
      slug: slugify(pm.name),
      shortDescription: pm.description,
      latitude: pm.latitude,
      longitude: pm.longitude,
      state: pm.state,
      municipality: pm.municipality ?? null,
      subcategoryIds: ['pueblos-magicos'],
      badges: ['pueblo-magico-oficial'],
      richness: 100,
    }),
  );

  // ─── Zonas Arqueológicas ──────────────────────────────────────────────────
  await seedCategory(
    'Zonas Arqueológicas',
    'zonas-arqueologicas',
    zonasArqueologicas,
    (za) => ({
      slug: slugify(za.name),
      shortDescription: za.description,
      latitude: za.latitude,
      longitude: za.longitude,
      state: za.state,
      municipality: za.municipality ?? null,
      subcategoryIds: ['zonas-arqueologicas'],
      badges: ['inah-oficial'],
      richness: 80,
    }),
  );

  // ─── Museos ───────────────────────────────────────────────────────────────
  await seedCategory(
    'Museos',
    'museos',
    museos,
    (m) => ({
      slug: m.slug || slugify(m.name),
      shortDescription: m.description,
      latitude: m.lat,
      longitude: m.lng,
      state: m.state,
      municipality: m.municipality || null,
      subcategoryIds: ['museos'],
      badges: m.badges ?? ['sic-oficial'],
      richness: 60,
    }),
  );

  // ─── Centros Históricos ───────────────────────────────────────────────────
  await seedCategory(
    'Centros Históricos',
    'centros-historicos',
    centrosHistoricos,
    (c) => ({
      slug: slugify(`centro-historico-${c.name}`),
      shortDescription: c.description,
      latitude: c.lat,
      longitude: c.lng,
      state: c.state,
      municipality: c.municipality ?? null,
      subcategoryIds: ['centros-historicos'],
      badges: ['unesco-patrimonio'],
      richness: 90,
    }),
  );

  // ─── Haciendas ────────────────────────────────────────────────────────────
  await seedCategory(
    'Haciendas',
    'haciendas',
    haciendas,
    (h) => ({
      slug: slugify(h.name),
      shortDescription: h.description,
      latitude: h.lat,
      longitude: h.lng,
      state: h.state,
      municipality: h.municipality ?? null,
      subcategoryIds: ['haciendas'],
      badges: [],
      richness: 50,
    }),
  );

  // ─── Playas ───────────────────────────────────────────────────────────────
  await seedCategory(
    'Playas',
    'playas',
    playas,
    (p) => ({
      slug: slugify(`playa-${p.name}`),
      shortDescription: p.description,
      latitude: p.lat,
      longitude: p.lng,
      state: p.state,
      municipality: p.municipality ?? null,
      subcategoryIds: ['playas'],
      badges: [],
      richness: 50,
    }),
  );

  console.log('');
  console.log('Seed complete!');

  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
