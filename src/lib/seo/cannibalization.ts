// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Defines which URL pattern "owns" a particular keyword,
 * preventing multiple pages from competing for the same term.
 */
export interface KeywordOwnership {
  keyword: string;
  ownerPattern: string;
  description: string;
}

/**
 * Represents a detected cannibalization issue where two or more
 * pages are targeting the same keyword.
 */
export interface CannibalizationIssue {
  keyword: string;
  pages: Array<{
    url: string;
    title: string;
    h1: string;
    matchType: "title" | "h1" | "keywords";
  }>;
  severity: "high" | "medium" | "low";
  recommendation: string;
}

// ---------------------------------------------------------------------------
// Keyword ownership registry
// ---------------------------------------------------------------------------

/**
 * Master registry of keyword-to-URL pattern mappings.
 * Each keyword should have exactly one owning page pattern.
 */
const OWNERSHIP_REGISTRY: KeywordOwnership[] = [
  // Hub pages own their broad category keywords
  {
    keyword: "museos mexico",
    ownerPattern: "/museos",
    description: "Hub page for all museums",
  },
  {
    keyword: "zonas arqueologicas mexico",
    ownerPattern: "/zonas-arqueologicas",
    description: "Hub page for all archaeological zones",
  },
  {
    keyword: "pueblos magicos mexico",
    ownerPattern: "/pueblos-magicos",
    description: "Hub page for all pueblos magicos",
  },
  {
    keyword: "rutas de viaje mexico",
    ownerPattern: "/",
    description: "Home page",
  },

  // State pages own "category + state" keywords
  {
    keyword: "museos {estado}",
    ownerPattern: "/estados/{estado}/museos",
    description: "State-specific museum listing",
  },
  {
    keyword: "zonas arqueologicas {estado}",
    ownerPattern: "/estados/{estado}/zonas-arqueologicas",
    description: "State-specific archaeological zone listing",
  },
  {
    keyword: "pueblos magicos {estado}",
    ownerPattern: "/estados/{estado}/pueblos-magicos",
    description: "State-specific pueblo magico listing",
  },
  {
    keyword: "que visitar en {estado}",
    ownerPattern: "/estados/{estado}",
    description: "State overview page",
  },

  // Individual place pages own their name keywords
  // NOTE: Single-placeholder entries like "{lugar}" are intentionally omitted
  // to avoid false-positive matches on arbitrary text. Place-name ownership
  // is resolved at lookup time by querying the places database.
  {
    keyword: "ruta {ruta}",
    ownerPattern: "/rutas/{ruta}",
    description: "Individual route page",
  },
];

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

/**
 * Returns the URL pattern that "owns" a given keyword.
 * Performs an exact match first, then falls back to template matching.
 *
 * @returns The owning URL pattern, or `null` if no owner is registered.
 */
export function getKeywordOwner(keyword: string): string | null {
  const normalized = keyword.toLowerCase().trim();

  // Exact match
  const exact = OWNERSHIP_REGISTRY.find(
    (entry) => entry.keyword.toLowerCase() === normalized
  );
  if (exact) {
    return exact.ownerPattern;
  }

  // Template match: find entries with placeholders and see if the keyword
  // matches the template shape
  for (const entry of OWNERSHIP_REGISTRY) {
    if (!entry.keyword.includes("{")) continue;

    const regexStr = entry.keyword
      .replace(/\{[^}]+\}/g, "(.+)")
      .replace(/\s+/g, "\\s+");
    const regex = new RegExp(`^${regexStr}$`, "i");
    if (regex.test(normalized)) {
      return entry.ownerPattern;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

interface PageData {
  url: string;
  title: string;
  h1: string;
  keywords: string[];
}

/**
 * Scans an array of pages for keyword cannibalization issues.
 * Two or more pages targeting the same keyword constitute an issue.
 */
export function detectCannibalization(
  pages: PageData[]
): CannibalizationIssue[] {
  // Build a map of keyword -> list of pages that reference it
  const keywordMap = new Map<
    string,
    Array<{ url: string; title: string; h1: string; matchType: "title" | "h1" | "keywords" }>
  >();

  function addToMap(
    keyword: string,
    page: PageData,
    matchType: "title" | "h1" | "keywords"
  ) {
    const key = keyword.toLowerCase().trim();
    if (!key) return;

    if (!keywordMap.has(key)) {
      keywordMap.set(key, []);
    }

    const existing = keywordMap.get(key)!;
    // Avoid duplicating the same URL for the same keyword
    if (!existing.some((p) => p.url === page.url)) {
      existing.push({
        url: page.url,
        title: page.title,
        h1: page.h1,
        matchType,
      });
    }
  }

  for (const page of pages) {
    // Extract significant phrases from title (split on common separators)
    const titlePhrases = page.title
      .split(/[|\-–—:]/g)
      .map((p) => p.trim())
      .filter(Boolean);
    for (const phrase of titlePhrases) {
      addToMap(phrase, page, "title");
    }

    // H1 as a whole
    if (page.h1) {
      addToMap(page.h1, page, "h1");
    }

    // Explicit keywords
    for (const kw of page.keywords) {
      addToMap(kw, page, "keywords");
    }
  }

  // Find keywords targeted by more than one page
  const issues: CannibalizationIssue[] = [];

  for (const [keyword, matchingPages] of keywordMap.entries()) {
    if (matchingPages.length < 2) continue;

    // Determine severity
    const hasMultipleTitleMatches =
      matchingPages.filter((p) => p.matchType === "title").length > 1;
    const hasMultipleH1Matches =
      matchingPages.filter((p) => p.matchType === "h1").length > 1;

    let severity: "high" | "medium" | "low";
    if (hasMultipleTitleMatches || hasMultipleH1Matches) {
      severity = "high";
    } else if (matchingPages.length > 2) {
      severity = "medium";
    } else {
      severity = "low";
    }

    // Build recommendation
    const owner = getKeywordOwner(keyword);
    let recommendation: string;
    if (owner) {
      recommendation = `La keyword "${keyword}" deberia pertenecer a ${owner}. Las demas paginas deben usar variantes de cola larga.`;
    } else {
      recommendation = `Asignar un dueno claro para la keyword "${keyword}" y diferenciar las demas paginas con keywords mas especificas.`;
    }

    issues.push({
      keyword,
      pages: matchingPages,
      severity,
      recommendation,
    });
  }

  // Sort by severity (high first)
  const severityOrder: Record<string, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  issues.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  return issues;
}
