/**
 * Base importer class and shared interfaces for all data import pipelines.
 *
 * Every concrete importer extends `BaseImporter` and implements:
 *   - fetch()      – pull raw records from source (API, file, seed)
 *   - transform()  – normalise one raw record into `TransformedPlace`
 *   - load()       – upsert transformed records into the database
 *
 * Usage:
 *   const importer = new MyImporter();
 *   const result = await importer.run({ dryRun: true, limit: 10 });
 */

// ── Result / Error types ────────────────────────────────────────────────────

export interface ImportResult {
  source: string;
  status: "completed" | "failed";
  totalRecords: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  duration: number;
  errorDetails: ImportError[];
}

export interface ImportError {
  recordId: string;
  error: string;
  rawData?: unknown;
}

// ── Options ─────────────────────────────────────────────────────────────────

export interface ImportOptions {
  /** When true no writes happen – useful for validation. */
  dryRun?: boolean;
  /** Max records to process (handy during development). */
  limit?: number;
  /** Skip the first N records. */
  offset?: number;
  /** Force re-import even if source hash has not changed. */
  force?: boolean;
}

// ── Transformed place ───────────────────────────────────────────────────────

export interface TransformedPlace {
  sourceId: string;
  sourceName: string;
  name: string;
  slug: string;
  shortDescription?: string;
  longDescription?: string;
  latitude: number;
  longitude: number;
  state: string;
  municipality?: string;
  locality?: string;
  address?: string;
  postalCode?: string;
  categorySlug: string;
  subcategories?: string[];
  badges?: string[];
  website?: string;
  phone?: string;
  email?: string;
  openingHours?: Record<string, string>;
  priceInfo?: { currency: string; amount?: number; description?: string };
  imageUrl?: string;
  sourceData: unknown;
  sourceHash: string;
}

// ── Abstract base class ─────────────────────────────────────────────────────

export abstract class BaseImporter {
  protected source: string;
  protected errors: ImportError[] = [];
  protected stats = { inserted: 0, updated: 0, skipped: 0 };

  constructor(source: string) {
    this.source = source;
  }

  /** Pull raw records from the upstream source. */
  abstract fetch(options: ImportOptions): Promise<unknown[]>;

  /** Convert one raw record into our canonical shape (return null to skip). */
  abstract transform(raw: unknown): TransformedPlace | null;

  /** Persist an array of transformed records (upsert logic lives here). */
  abstract load(
    items: TransformedPlace[],
    options: ImportOptions,
  ): Promise<void>;

  /**
   * Orchestrate the full fetch -> transform -> load pipeline, logging progress
   * and returning a structured result.
   */
  async run(options: ImportOptions = {}): Promise<ImportResult> {
    const start = Date.now();
    console.log(`[${this.source}] Starting import...`);
    if (options.dryRun) console.log("[DRY RUN] No data will be written");

    // Reset per-run state
    this.errors = [];
    this.stats = { inserted: 0, updated: 0, skipped: 0 };

    try {
      const raw = await this.fetch(options);
      console.log(`[${this.source}] Fetched ${raw.length} records`);

      const transformed = raw
        .map((r) => {
          try {
            return this.transform(r);
          } catch (err) {
            this.errors.push({
              recordId: "transform",
              error: String(err),
              rawData: r,
            });
            return null;
          }
        })
        .filter((t): t is TransformedPlace => t !== null);
      console.log(`[${this.source}] Transformed ${transformed.length} records`);

      if (!options.dryRun) {
        await this.load(transformed, options);
      } else {
        // In dry-run we still count what *would* happen
        this.stats.inserted = transformed.length;
      }

      return {
        source: this.source,
        status: "completed",
        totalRecords: raw.length,
        inserted: this.stats.inserted,
        updated: this.stats.updated,
        skipped: this.stats.skipped,
        errors: this.errors.length,
        duration: Date.now() - start,
        errorDetails: this.errors,
      };
    } catch (error) {
      return {
        source: this.source,
        status: "failed",
        totalRecords: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors: 1,
        duration: Date.now() - start,
        errorDetails: [{ recordId: "global", error: String(error) }],
      };
    }
  }

  /**
   * Produce a short deterministic hash of serialised data. Used to detect
   * whether a source record has changed since last import.
   */
  protected hashData(data: unknown): string {
    return Buffer.from(JSON.stringify(data)).toString("base64").slice(0, 32);
  }
}
