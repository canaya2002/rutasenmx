// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: ChangeFreq;
  priority?: number;
}

// ---------------------------------------------------------------------------
// Defaults per page type
// ---------------------------------------------------------------------------

export const SITEMAP_DEFAULTS: Record<
  string,
  { changefreq: ChangeFreq; priority: number }
> = {
  home: { changefreq: "daily", priority: 1.0 },
  estado: { changefreq: "weekly", priority: 0.9 },
  hub: { changefreq: "weekly", priority: 0.8 },
  lugar: { changefreq: "weekly", priority: 0.8 },
  museo: { changefreq: "weekly", priority: 0.8 },
  "zona-arqueologica": { changefreq: "weekly", priority: 0.8 },
  "pueblo-magico": { changefreq: "weekly", priority: 0.8 },
  ruta: { changefreq: "weekly", priority: 0.7 },
  guia: { changefreq: "monthly", priority: 0.7 },
  coleccion: { changefreq: "monthly", priority: 0.6 },
  "categoria-estado": { changefreq: "weekly", priority: 0.7 },
  static: { changefreq: "monthly", priority: 0.3 },
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface SitemapUrlInput {
  loc: string;
  lastmod?: string | Date;
  changefreq?: ChangeFreq;
  priority?: number;
}

/**
 * Normalises an array of URL entries into properly formatted SitemapEntry
 * objects. Dates are converted to ISO 8601 date strings.
 */
export function buildSitemapEntries(
  urls: SitemapUrlInput[]
): SitemapEntry[] {
  return urls.map((url) => {
    const entry: SitemapEntry = {
      loc: url.loc,
    };

    if (url.lastmod) {
      entry.lastmod =
        url.lastmod instanceof Date
          ? url.lastmod.toISOString().split("T")[0]
          : url.lastmod;
    }

    if (url.changefreq) {
      entry.changefreq = url.changefreq;
    }

    if (url.priority != null) {
      entry.priority = url.priority;
    }

    return entry;
  });
}

/**
 * Returns the default changefreq and priority for a given page type.
 * Falls back to a conservative default when the page type is unknown.
 */
export function getSitemapDefaults(pageType: string): {
  changefreq: ChangeFreq;
  priority: number;
} {
  return (
    SITEMAP_DEFAULTS[pageType] ?? { changefreq: "monthly", priority: 0.5 }
  );
}
