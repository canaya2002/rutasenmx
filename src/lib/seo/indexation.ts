// ---------------------------------------------------------------------------
// Page type definitions
// ---------------------------------------------------------------------------

interface PageTypeConfig {
  /** Whether this page type is indexable by default. */
  indexable: boolean;
  /** Whether links on this page should be followed. */
  follow: boolean;
  /** Whether indexation is conditional on content richness. */
  richnessDependant: boolean;
}

/**
 * Complete registry of page types and their indexation rules.
 */
export const PAGE_TYPES: Record<string, PageTypeConfig> = {
  // Indexable pages
  home: { indexable: true, follow: true, richnessDependant: false },
  estado: { indexable: true, follow: true, richnessDependant: false },
  lugar: { indexable: true, follow: true, richnessDependant: true },
  ruta: { indexable: true, follow: true, richnessDependant: true },
  museo: { indexable: true, follow: true, richnessDependant: true },
  "zona-arqueologica": { indexable: true, follow: true, richnessDependant: true },
  "pueblo-magico": { indexable: true, follow: true, richnessDependant: true },
  coleccion: { indexable: true, follow: true, richnessDependant: false },
  guia: { indexable: true, follow: true, richnessDependant: true },
  hub: { indexable: true, follow: true, richnessDependant: false },

  // NoIndex pages
  search: { indexable: false, follow: false, richnessDependant: false },
  filter: { indexable: false, follow: false, richnessDependant: false },
  auth: { indexable: false, follow: false, richnessDependant: false },
  dashboard: { indexable: false, follow: false, richnessDependant: false },
  admin: { indexable: false, follow: false, richnessDependant: false },
  checkout: { indexable: false, follow: false, richnessDependant: false },
  profile: { indexable: false, follow: false, richnessDependant: false },
  "trip-editor": { indexable: false, follow: false, richnessDependant: false },
  preview: { indexable: false, follow: false, richnessDependant: false },
  "shared-trip": { indexable: false, follow: false, richnessDependant: false },
} as const;

// ---------------------------------------------------------------------------
// Richness scoring
// ---------------------------------------------------------------------------

/**
 * Minimum richness score required for a richness-dependant page to be indexed.
 * Pages below this threshold will be set to noindex to prevent thin content
 * from diluting crawl budget.
 */
export const MIN_RICHNESS_SCORE = 30;

interface RichnessInput {
  /** Whether the page has a text description. */
  hasDescription?: boolean;
  /** Length of the description in characters. */
  descriptionLength?: number;
  /** Whether the page has at least one image. */
  hasImage?: boolean;
  /** Number of images on the page. */
  imageCount?: number;
  /** Whether the page has geographic coordinates. */
  hasCoordinates?: boolean;
  /** Whether the page has an address or location string. */
  hasAddress?: boolean;
  /** Whether the page has opening hours or schedule info. */
  hasSchedule?: boolean;
  /** Whether the page has pricing information. */
  hasPricing?: boolean;
  /** Whether the page has user ratings or reviews. */
  hasRatings?: boolean;
  /** Number of related items linked from this page. */
  relatedItemCount?: number;
}

/**
 * Calculates a richness score (0-100) for a place/content page.
 * Used to determine whether thin pages should be indexed.
 */
export function calculateRichnessScore(input: RichnessInput): number {
  let score = 0;

  // Description: up to 25 points
  if (input.hasDescription) {
    score += 10;
    if ((input.descriptionLength ?? 0) > 100) score += 5;
    if ((input.descriptionLength ?? 0) > 300) score += 5;
    if ((input.descriptionLength ?? 0) > 600) score += 5;
  }

  // Images: up to 20 points
  if (input.hasImage) {
    score += 10;
    if ((input.imageCount ?? 0) >= 3) score += 5;
    if ((input.imageCount ?? 0) >= 6) score += 5;
  }

  // Location data: up to 15 points
  if (input.hasCoordinates) score += 10;
  if (input.hasAddress) score += 5;

  // Practical info: up to 20 points
  if (input.hasSchedule) score += 10;
  if (input.hasPricing) score += 10;

  // Social proof: 10 points
  if (input.hasRatings) score += 10;

  // Related content: up to 10 points
  if ((input.relatedItemCount ?? 0) >= 1) score += 5;
  if ((input.relatedItemCount ?? 0) >= 5) score += 5;

  return Math.min(score, 100);
}

// ---------------------------------------------------------------------------
// Decision function
// ---------------------------------------------------------------------------

/**
 * Determines whether a page should be indexed based on its type
 * and, optionally, its content richness score.
 *
 * @param pageType - One of the keys from PAGE_TYPES.
 * @param richness - Optional richness score (0-100). Only relevant
 *                   for richness-dependant page types.
 * @returns `true` if the page should be indexed.
 */
export function shouldIndex(pageType: string, richness?: number): boolean {
  const config = PAGE_TYPES[pageType];

  if (!config) {
    return false;
  }

  if (!config.indexable) {
    return false;
  }

  if (config.richnessDependant && richness != null) {
    return richness >= MIN_RICHNESS_SCORE;
  }

  // If richness-dependant but no score provided, default to indexable
  return config.indexable;
}
