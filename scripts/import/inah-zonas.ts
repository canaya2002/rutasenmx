/**
 * Import pipeline for INAH Zonas Arqueologicas.
 *
 * Strategy:
 *   1. Try INAH datos abiertos endpoint.
 *   2. Fallback to curated seed at `data/seeds/zonas-arqueologicas.json`.
 *
 * Run:
 *   npx tsx scripts/import/inah-zonas.ts [--dry-run] [--limit N]
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

// ── Types ───────────────────────────────────────────────────────────────────

interface ZonaArqueologicaSeed {
  name: string;
  state: string;
  municipality: string;
  latitude: number;
  longitude: number;
  description: string;
  culture: string;
  period: string;
}

interface InahApiRecord {
  nombre?: string;
  estado?: string;
  municipio?: string;
  latitud?: number | string;
  longitud?: number | string;
  descripcion?: string;
  cultura?: string;
  periodo?: string;
  horario?: string;
  costo?: string;
  sitio_web?: string;
  [key: string]: unknown;
}

// ── Constants ───────────────────────────────────────────────────────────────

const INAH_API_URL =
  "https://datosabiertos.inah.gob.mx/api/zonas-arqueologicas.json";

const SEED_PATH = path.resolve(
  process.cwd(),
  "data/seeds/zonas-arqueologicas.json",
);

// ── Importer ────────────────────────────────────────────────────────────────

class InahZonasImporter extends BaseImporter {
  constructor() {
    super("inah-zonas");
  }

  // ── Fetch ───────────────────────────────────────────────────────────────

  async fetch(options: ImportOptions): Promise<unknown[]> {
    let records: unknown[] = [];

    // Attempt remote fetch
    try {
      console.log(`[${this.source}] Trying INAH API: ${INAH_API_URL}`);
      const res = await fetch(INAH_API_URL, {
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        const json = (await res.json()) as InahApiRecord[];
        if (Array.isArray(json) && json.length > 0) {
          console.log(
            `[${this.source}] INAH API returned ${json.length} records`,
          );
          records = json;
        }
      }
    } catch {
      console.log(
        `[${this.source}] INAH API unavailable, falling back to seed data`,
      );
    }

    // Fallback to seed file
    if (records.length === 0) {
      const raw = await fs.readFile(SEED_PATH, "utf-8");
      records = JSON.parse(raw) as ZonaArqueologicaSeed[];
      console.log(
        `[${this.source}] Loaded ${records.length} records from seed file`,
      );
    }

    if (options.offset) records = records.slice(options.offset);
    if (options.limit) records = records.slice(0, options.limit);

    return records;
  }

  // ── Transform ───────────────────────────────────────────────────────────

  transform(raw: unknown): TransformedPlace | null {
    const r = raw as ZonaArqueologicaSeed & Partial<InahApiRecord>;

    const name = normalizeString(r.name ?? r.nombre);
    if (!name) return null;

    const state = normalizeState(r.state ?? r.estado);
    const municipality = normalizeMunicipality(r.municipality ?? r.municipio);

    const lat =
      typeof r.latitude === "number"
        ? r.latitude
        : typeof r.latitud === "string"
          ? parseFloat(r.latitud)
          : (r.latitud as number | undefined);

    const lng =
      typeof r.longitude === "number"
        ? r.longitude
        : typeof r.longitud === "string"
          ? parseFloat(r.longitud)
          : (r.longitud as number | undefined);

    if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
      this.errors.push({
        recordId: name,
        error: "Missing coordinates",
        rawData: raw,
      });
      return null;
    }

    const description = cleanHtml(r.description ?? r.descripcion ?? "");
    const culture = normalizeString(r.culture ?? r.cultura ?? "");
    const period = normalizeString(r.period ?? r.periodo ?? "");

    const longDesc = [
      description,
      culture ? `Cultura: ${culture}.` : "",
      period ? `Periodo: ${period}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    // Parse opening hours & price
    let openingHours: Record<string, string> | undefined;
    if (r.horario) {
      openingHours = { general: normalizeString(r.horario) };
    }

    let priceInfo: { currency: string; description?: string } | undefined;
    if (r.costo) {
      priceInfo = { currency: "MXN", description: normalizeString(r.costo) };
    }

    return {
      sourceId: `inah-za-${generateSlug(name, state)}`,
      sourceName: this.source,
      name,
      slug: generateSlug(name, state),
      shortDescription: description.slice(0, 300) || undefined,
      longDescription: longDesc || undefined,
      latitude: lat,
      longitude: lng,
      state,
      municipality: municipality || undefined,
      categorySlug: "zonas-arqueologicas",
      badges: ["inah"],
      website: r.sitio_web ? r.sitio_web : undefined,
      openingHours,
      priceInfo,
      sourceData: raw,
      sourceHash: this.hashData(raw),
    };
  }

  // ── Load (upsert) ──────────────────────────────────────────────────────

  async load(items: TransformedPlace[], options: ImportOptions): Promise<void> {
    const [cat] = await db
      .select()
      .from(placeCategories)
      .where(eq(placeCategories.slug, "zonas-arqueologicas"))
      .limit(1);

    const categoryId = cat?.id ?? null;

    for (const item of items) {
      try {
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
          if (existing.sourceHash === item.sourceHash && !options.force) {
            this.stats.skipped++;
            continue;
          }

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
              website: item.website,
              openingHours: item.openingHours,
              priceInfo: item.priceInfo,
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
              openingHours: item.openingHours,
              priceInfo: item.priceInfo,
              isPublished: true,
              sourcePriority: 90,
            })
            .returning({ id: places.id });

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

  const importer = new InahZonasImporter();
  const result = await importer.run(options);

  console.log("\n=== Import Result ===");
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "completed" ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

export { InahZonasImporter };
