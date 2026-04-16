/**
 * Import pipeline for SIC (Sistema de Informacion Cultural) Museos.
 *
 * Source: https://sic.cultura.gob.mx/opendata/d/0_museo_directorio.json
 *
 * Run:
 *   npx tsx scripts/import/sic-museos.ts [--dry-run] [--limit N]
 */

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
  normalizePhone,
  normalizeUrl,
  generateSlug,
  cleanHtml,
} from "@/lib/import/normalize";

// ── SIC record shape ────────────────────────────────────────────────────────

interface SicMuseoRecord {
  museo_id?: number;
  nombre_museo?: string;
  tematica?: string;
  entidad?: string;
  municipio?: string;
  localidad?: string;
  calle?: string;
  numero_exterior?: string;
  colonia?: string;
  cp?: string;
  latitud?: string | number;
  longitud?: string | number;
  telefono?: string;
  pagina_web?: string;
  correo_electronico?: string;
  adscripcion?: string;
  horario?: string;
  costo_entrada?: string;
  link_sic?: string;
  fecha_mod?: string;
  [key: string]: unknown;
}

// ── Constants ───────────────────────────────────────────────────────────────

const SIC_API_URL =
  "https://sic.cultura.gob.mx/opendata/d/0_museo_directorio.json";

// ── Importer ────────────────────────────────────────────────────────────────

class SicMuseosImporter extends BaseImporter {
  constructor() {
    super("sic-museos");
  }

  // ── Fetch ───────────────────────────────────────────────────────────────

  async fetch(options: ImportOptions): Promise<unknown[]> {
    console.log(`[${this.source}] Fetching from ${SIC_API_URL}`);

    const res = await fetch(SIC_API_URL, {
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      throw new Error(
        `SIC API returned ${res.status} ${res.statusText}`,
      );
    }

    let records = (await res.json()) as SicMuseoRecord[];

    if (!Array.isArray(records)) {
      throw new Error("SIC API did not return an array");
    }

    console.log(`[${this.source}] API returned ${records.length} records`);

    // Apply offset / limit
    if (options.offset) records = records.slice(options.offset);
    if (options.limit) records = records.slice(0, options.limit);

    return records;
  }

  // ── Transform ───────────────────────────────────────────────────────────

  transform(raw: unknown): TransformedPlace | null {
    const r = raw as SicMuseoRecord;

    const name = normalizeString(r.nombre_museo);
    if (!name) return null;

    const state = normalizeState(r.entidad);
    const municipality = normalizeMunicipality(r.municipio);

    // Parse coordinates — SIC sometimes stores as strings
    const lat = typeof r.latitud === "string" ? parseFloat(r.latitud) : r.latitud;
    const lng = typeof r.longitud === "string" ? parseFloat(r.longitud) : r.longitud;

    // Allow places without coordinates (we can geocode later)
    const hasCoords =
      lat != null &&
      lng != null &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat !== 0 &&
      lng !== 0;

    // Build address
    const addressParts = [
      r.calle,
      r.numero_exterior ? `#${r.numero_exterior}` : null,
      r.colonia ? `Col. ${r.colonia}` : null,
    ].filter(Boolean);
    const address = addressParts.length > 0 ? addressParts.join(", ") : undefined;

    // Parse opening hours into a record
    let openingHours: Record<string, string> | undefined;
    if (r.horario) {
      openingHours = { general: normalizeString(r.horario) };
    }

    // Parse price info
    let priceInfo: { currency: string; description?: string } | undefined;
    if (r.costo_entrada) {
      priceInfo = {
        currency: "MXN",
        description: normalizeString(r.costo_entrada),
      };
    }

    const sourceId = r.museo_id
      ? `sic-museo-${r.museo_id}`
      : `sic-museo-${generateSlug(name, state)}`;

    return {
      sourceId,
      sourceName: this.source,
      name,
      slug: generateSlug(name, state),
      shortDescription: r.tematica
        ? `Museo de temática: ${cleanHtml(r.tematica)}`
        : undefined,
      latitude: hasCoords ? lat! : 0,
      longitude: hasCoords ? lng! : 0,
      state,
      municipality: municipality || undefined,
      locality: normalizeString(r.localidad) || undefined,
      address,
      postalCode: r.cp ? normalizeString(r.cp) : undefined,
      categorySlug: "museos",
      badges: ["sic"],
      website: r.pagina_web ? normalizeUrl(r.pagina_web) : undefined,
      phone: r.telefono ? normalizePhone(r.telefono) : undefined,
      email: r.correo_electronico
        ? normalizeString(r.correo_electronico)
        : undefined,
      openingHours,
      priceInfo,
      sourceData: {
        ...r,
        link_sic: r.link_sic,
        fecha_mod: r.fecha_mod,
        adscripcion: r.adscripcion,
      },
      sourceHash: this.hashData(raw),
    };
  }

  // ── Load (upsert) ──────────────────────────────────────────────────────

  async load(items: TransformedPlace[], options: ImportOptions): Promise<void> {
    // Resolve category id once
    const [cat] = await db
      .select()
      .from(placeCategories)
      .where(eq(placeCategories.slug, "museos"))
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
          if (existing.sourceHash === item.sourceHash && !options.force) {
            this.stats.skipped++;
            continue;
          }

          // Update
          await db
            .update(places)
            .set({
              name: item.name,
              shortDescription: item.shortDescription,
              latitude: item.latitude || undefined,
              longitude: item.longitude || undefined,
              state: item.state,
              municipality: item.municipality,
              locality: item.locality,
              address: item.address,
              postalCode: item.postalCode,
              badges: item.badges,
              website: item.website,
              phone: item.phone,
              email: item.email,
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
          // Insert
          const [newPlace] = await db
            .insert(places)
            .values({
              slug: item.slug,
              name: item.name,
              shortDescription: item.shortDescription,
              latitude: item.latitude || undefined,
              longitude: item.longitude || undefined,
              state: item.state,
              municipality: item.municipality,
              locality: item.locality,
              address: item.address,
              postalCode: item.postalCode,
              categoryId,
              badges: item.badges,
              website: item.website,
              phone: item.phone,
              email: item.email,
              openingHours: item.openingHours,
              priceInfo: item.priceInfo,
              isPublished: true,
              sourcePriority: 70,
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

  const importer = new SicMuseosImporter();
  const result = await importer.run(options);

  console.log("\n=== Import Result ===");
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "completed" ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

export { SicMuseosImporter };
