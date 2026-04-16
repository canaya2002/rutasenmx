/**
 * Import pipeline for SECTUR Pueblos Magicos.
 *
 * Strategy:
 *   1. Try to fetch from the SECTUR open-data endpoint (JSON).
 *   2. On failure, fall back to the curated seed file at
 *      `data/seeds/pueblos-magicos.json` which contains 60+ verified entries.
 *
 * Run:
 *   npx tsx scripts/import/sectur-pueblos-magicos.ts [--dry-run] [--limit N]
 */

import path from "node:path";
import fs from "node:fs/promises";
import { eq, and } from "drizzle-orm";
import { db, places, placeSources, placeCategories } from "@/db";
import {
  BaseImporter,
  type ImportOptions,
  type TransformedPlace,
} from "@/lib/import/base";
import {
  normalizeString,
  normalizeState,
  normalizeMunicipality,
  generateSlug,
  cleanHtml,
} from "@/lib/import/normalize";

// ── Seed record shape ───────────────────────────────────────────────────────

interface PuebloMagicoSeed {
  name: string;
  state: string;
  municipality: string;
  latitude: number;
  longitude: number;
  description: string;
  yearDesignated: number;
}

// ── SECTUR API record (hypothetical) ────────────────────────────────────────

interface SecturApiRecord {
  nombre: string;
  estado: string;
  municipio: string;
  latitud?: number;
  longitud?: number;
  descripcion?: string;
  anio_designacion?: number;
  imagen_url?: string;
  sitio_web?: string;
}

// ── Importer ────────────────────────────────────────────────────────────────

const SECTUR_API_URL =
  "https://api.datatur.sectur.gob.mx/opendata/pueblosmagicos.json";

const SEED_PATH = path.resolve(
  process.cwd(),
  "data/seeds/pueblos-magicos.json",
);

class SecturPueblosMagicosImporter extends BaseImporter {
  constructor() {
    super("sectur-pueblos-magicos");
  }

  // ── Fetch ───────────────────────────────────────────────────────────────

  async fetch(options: ImportOptions): Promise<unknown[]> {
    let records: unknown[] = [];

    // Attempt remote fetch first
    try {
      console.log(`[${this.source}] Trying SECTUR API: ${SECTUR_API_URL}`);
      const res = await fetch(SECTUR_API_URL, {
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        const json = (await res.json()) as SecturApiRecord[];
        if (Array.isArray(json) && json.length > 0) {
          console.log(
            `[${this.source}] SECTUR API returned ${json.length} records`,
          );
          records = json;
        }
      }
    } catch {
      console.log(
        `[${this.source}] SECTUR API unavailable, falling back to seed data`,
      );
    }

    // Fallback to seed file
    if (records.length === 0) {
      const raw = await fs.readFile(SEED_PATH, "utf-8");
      records = JSON.parse(raw) as PuebloMagicoSeed[];
      console.log(
        `[${this.source}] Loaded ${records.length} records from seed file`,
      );
    }

    // Apply offset / limit
    if (options.offset) records = records.slice(options.offset);
    if (options.limit) records = records.slice(0, options.limit);

    return records;
  }

  // ── Transform ───────────────────────────────────────────────────────────

  transform(raw: unknown): TransformedPlace | null {
    // Handle both seed and API shapes
    const r = raw as PuebloMagicoSeed & Partial<SecturApiRecord>;

    const name = normalizeString(r.name ?? r.nombre);
    if (!name) return null;

    const state = normalizeState(r.state ?? r.estado);
    const municipality = normalizeMunicipality(r.municipality ?? r.municipio);
    const lat = r.latitude ?? r.latitud;
    const lng = r.longitude ?? r.longitud;

    if (lat == null || lng == null) {
      this.errors.push({
        recordId: name,
        error: "Missing coordinates",
        rawData: raw,
      });
      return null;
    }

    const description = cleanHtml(
      r.description ?? r.descripcion ?? "",
    );

    return {
      sourceId: `pm-${generateSlug(name, state)}`,
      sourceName: this.source,
      name,
      slug: generateSlug(name, state),
      shortDescription: description.slice(0, 300) || undefined,
      longDescription: description || undefined,
      latitude: lat,
      longitude: lng,
      state,
      municipality: municipality || undefined,
      categorySlug: "pueblos-magicos",
      badges: ["pueblo_magico"],
      website: r.sitio_web ? r.sitio_web : undefined,
      imageUrl: r.imagen_url ? r.imagen_url : undefined,
      sourceData: raw,
      sourceHash: this.hashData(raw),
    };
  }

  // ── Load (upsert) ──────────────────────────────────────────────────────

  async load(items: TransformedPlace[], options: ImportOptions): Promise<void> {
    // Resolve category id once
    const [cat] = await db
      .select()
      .from(placeCategories)
      .where(eq(placeCategories.slug, "pueblos-magicos"))
      .limit(1);

    const categoryId = cat?.id ?? null;

    for (const item of items) {
      try {
        // Check if source record already exists
        const [existing] = await db
          .select()
          .from(placeSources)
          .where(
            and(
              eq(placeSources.sourceName, item.sourceName),
              eq(placeSources.sourceId, item.sourceId),
            ),
          )
          .limit(1);

        if (existing) {
          // Skip if hash unchanged (unless --force)
          if (existing.sourceHash === item.sourceHash && !options.force) {
            this.stats.skipped++;
            continue;
          }

          // Update the place
          await db
            .update(places)
            .set({
              name: item.name,
              shortDescription: item.shortDescription,
              longDescription: item.longDescription,
              latitude: item.latitude,
              longitude: item.longitude,
              state: item.state,
              municipality: item.municipality,
              badges: item.badges,
              categoryId,
            })
            .where(eq(places.id, existing.placeId));

          await db
            .update(placeSources)
            .set({
              sourceData: item.sourceData as Record<string, unknown>,
              sourceHash: item.sourceHash,
              lastSyncedAt: new Date(),
            })
            .where(eq(placeSources.id, existing.id));

          this.stats.updated++;
        } else {
          // Insert new place
          const [newPlace] = await db
            .insert(places)
            .values({
              slug: item.slug,
              name: item.name,
              shortDescription: item.shortDescription,
              longDescription: item.longDescription,
              latitude: item.latitude,
              longitude: item.longitude,
              state: item.state,
              municipality: item.municipality,
              categoryId,
              badges: item.badges,
              website: item.website,
              primaryImageUrl: item.imageUrl,
              isPublished: true,
              sourcePriority: 80,
            })
            .returning({ id: places.id });

          // Insert source record
          await db.insert(placeSources).values({
            placeId: newPlace.id,
            sourceName: item.sourceName,
            sourceId: item.sourceId,
            sourceData: item.sourceData as Record<string, unknown>,
            sourceHash: item.sourceHash,
            lastSyncedAt: new Date(),
          });

          this.stats.inserted++;
        }
      } catch (err) {
        this.errors.push({
          recordId: item.sourceId,
          error: String(err),
          rawData: item.sourceData,
        });
      }
    }
  }
}

// ── CLI ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const options: ImportOptions = {
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
  };

  const limitIdx = args.indexOf("--limit");
  if (limitIdx !== -1 && args[limitIdx + 1]) {
    options.limit = parseInt(args[limitIdx + 1], 10);
  }

  const importer = new SecturPueblosMagicosImporter();
  const result = await importer.run(options);

  console.log("\n=== Import Result ===");
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "completed" ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

export { SecturPueblosMagicosImporter };
