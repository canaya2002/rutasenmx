const SITE_URL = "https://rutasenmx.com";

/**
 * Tracking parameters that should be stripped from URLs
 * to produce clean canonical URLs.
 */
export const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "fbclid",
  "gclid",
  "gad_source",
  "dclid",
  "msclkid",
  "twclid",
  "mc_cid",
  "mc_eid",
  "igshid",
  "s_kwcid",
  "ttclid",
  "_ga",
  "_gl",
] as const;

/**
 * Returns the absolute canonical URL for a given path.
 */
export function getCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const normalized = cleanPath.replace(/\/+$/, "") || "/";
  return `${SITE_URL}${normalized}`;
}

/**
 * Removes tracking parameters, normalizes the URL by stripping trailing slashes,
 * lowercasing, and removing fragments.
 */
export function cleanUrl(url: string): string {
  try {
    const parsed = new URL(url, SITE_URL);

    // Remove tracking params
    for (const param of TRACKING_PARAMS) {
      parsed.searchParams.delete(param);
    }

    // Remove fragment
    parsed.hash = "";

    // Sort remaining params for consistency
    parsed.searchParams.sort();

    // Collapse double slashes in path
    parsed.pathname = parsed.pathname.replace(/\/{2,}/g, "/");

    // Rebuild the URL
    let result = parsed.origin + parsed.pathname;

    // Remove trailing slash (except root)
    if (result.endsWith("/") && parsed.pathname !== "/") {
      result = result.slice(0, -1);
    }

    // Append remaining search params
    const search = parsed.searchParams.toString();
    if (search) {
      result += `?${search}`;
    }

    return result.toLowerCase();
  } catch {
    // If URL parsing fails, return as-is after basic cleanup
    return url.toLowerCase().replace(/\/+$/, "") || "/";
  }
}

/**
 * Normalizes a slug by lowercasing, removing accents, and stripping
 * non-alphanumeric characters (except hyphens).
 */
export function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritical marks
    .replace(/[^a-z0-9-]/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Trim leading/trailing hyphens
}

/**
 * Valid canonical path patterns for the application.
 */
const CANONICAL_PATTERNS = [
  /^\/$/,
  /^\/estados\/[a-z0-9-]+$/,
  /^\/lugares\/[a-z0-9-]+$/,
  /^\/rutas\/[a-z0-9-]+$/,
  /^\/museos\/[a-z0-9-]+$/,
  /^\/zonas-arqueologicas\/[a-z0-9-]+$/,
  /^\/pueblos-magicos\/[a-z0-9-]+$/,
  /^\/museos$/,
  /^\/zonas-arqueologicas$/,
  /^\/pueblos-magicos$/,
  /^\/guias\/[a-z0-9-]+$/,
  /^\/colecciones\/[a-z0-9-]+$/,
  /^\/estados\/[a-z0-9-]+\/museos$/,
  /^\/estados\/[a-z0-9-]+\/zonas-arqueologicas$/,
  /^\/estados\/[a-z0-9-]+\/pueblos-magicos$/,
];

/**
 * Checks whether a path matches one of the known canonical URL patterns.
 */
export function isCanonicalPath(path: string): boolean {
  const normalized = path.toLowerCase().replace(/\/+$/, "") || "/";
  return CANONICAL_PATTERNS.some((pattern) => pattern.test(normalized));
}
