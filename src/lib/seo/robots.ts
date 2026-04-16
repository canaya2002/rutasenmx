/**
 * Indexation policy for a particular page type, controlling
 * whether search engines should index and follow links on the page.
 */
export interface IndexationPolicy {
  index: boolean;
  follow: boolean;
  pageType: string;
}

/**
 * Page types that should be indexed by search engines.
 */
const INDEXABLE_TYPES = new Set([
  "home",
  "estado",
  "lugar",
  "ruta",
  "museo",
  "zona-arqueologica",
  "pueblo-magico",
  "coleccion",
  "guia",
  "hub",
]);

/**
 * Page types that should NOT be indexed by search engines.
 */
const NOINDEX_TYPES = new Set([
  "search",
  "filter",
  "auth",
  "dashboard",
  "admin",
  "checkout",
  "profile",
  "trip-editor",
  "preview",
  "shared-trip",
]);

/**
 * Returns the indexation policy for a given page type.
 */
export function getIndexationPolicy(pageType: string): {
  index: boolean;
  follow: boolean;
} {
  if (INDEXABLE_TYPES.has(pageType)) {
    return { index: true, follow: true };
  }

  if (NOINDEX_TYPES.has(pageType)) {
    return { index: false, follow: false };
  }

  // Default: noindex but follow links
  return { index: false, follow: true };
}

/**
 * Returns a robots meta directive string for a given page type.
 * Example: "index, follow" or "noindex, nofollow"
 */
export function getRobotsDirective(pageType: string): string {
  const { index, follow } = getIndexationPolicy(pageType);
  const indexDirective = index ? "index" : "noindex";
  const followDirective = follow ? "follow" : "nofollow";
  return `${indexDirective}, ${followDirective}`;
}
