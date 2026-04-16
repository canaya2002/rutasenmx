/**
 * String normalisation utilities shared across all import pipelines.
 *
 * Every function is pure (no side-effects) and safe to call with
 * undefined / empty input — they always return a deterministic string.
 */

import slugify from "slugify";
import { ESTADOS_MEXICO, PLACE_CATEGORIES } from "@/lib/constants";

// ── Generic string helpers ──────────────────────────────────────────────────

/** Trim, NFC-normalise, collapse whitespace. */
export function normalizeString(s: string | null | undefined): string {
  if (!s) return "";
  return s.normalize("NFC").replace(/\s+/g, " ").trim();
}

// ── State normalisation ─────────────────────────────────────────────────────

/**
 * Map of common variations (lower-cased) to our canonical state slugs as
 * defined in `ESTADOS_MEXICO`.
 */
const STATE_ALIASES: Record<string, string> = {
  // CDMX variants
  cdmx: "ciudad-de-mexico",
  "ciudad de mexico": "ciudad-de-mexico",
  "ciudad de méxico": "ciudad-de-mexico",
  "distrito federal": "ciudad-de-mexico",
  df: "ciudad-de-mexico",
  "d.f.": "ciudad-de-mexico",
  "d.f": "ciudad-de-mexico",

  // Estado de México variants
  "edo. de méxico": "estado-de-mexico",
  "edo. de mexico": "estado-de-mexico",
  "edo de méxico": "estado-de-mexico",
  "edo de mexico": "estado-de-mexico",
  "edo. mex.": "estado-de-mexico",
  "edo. méx.": "estado-de-mexico",
  edomex: "estado-de-mexico",
  "estado de mexico": "estado-de-mexico",
  "estado de méxico": "estado-de-mexico",
  méxico: "estado-de-mexico",
  mexico: "estado-de-mexico",

  // Michoacán
  "michoacán de ocampo": "michoacan",
  michoacan: "michoacan",
  "michoacán": "michoacan",

  // Veracruz
  "veracruz de ignacio de la llave": "veracruz",
  "veracruz llave": "veracruz",

  // Coahuila
  "coahuila de zaragoza": "coahuila",

  // Common abbreviation aliases
  ags: "aguascalientes",
  bc: "baja-california",
  bcs: "baja-california-sur",
  cam: "campeche",
  chis: "chiapas",
  chih: "chihuahua",
  coah: "coahuila",
  col: "colima",
  dgo: "durango",
  mex: "estado-de-mexico",
  gto: "guanajuato",
  gro: "guerrero",
  hgo: "hidalgo",
  jal: "jalisco",
  mich: "michoacan",
  mor: "morelos",
  nay: "nayarit",
  nl: "nuevo-leon",
  oax: "oaxaca",
  pue: "puebla",
  qro: "queretaro",
  qroo: "quintana-roo",
  slp: "san-luis-potosi",
  sin: "sinaloa",
  son: "sonora",
  tab: "tabasco",
  tamps: "tamaulipas",
  tlax: "tlaxcala",
  ver: "veracruz",
  yuc: "yucatan",
  zac: "zacatecas",

  // Sonora
  "sonora, mx": "sonora",

  // Nuevo León
  "nuevo leon": "nuevo-leon",
  "nuevo león": "nuevo-leon",

  // San Luis Potosí
  "san luis potosi": "san-luis-potosi",
  "san luis potosí": "san-luis-potosi",

  // Querétaro
  queretaro: "queretaro",
  "querétaro": "queretaro",

  // Yucatán
  yucatan: "yucatan",
  "yucatán": "yucatan",
};

// Pre-build a lookup from canonical name (lower) -> slug
const CANONICAL_STATE_MAP = new Map<string, string>();
for (const st of ESTADOS_MEXICO) {
  CANONICAL_STATE_MAP.set(st.name.toLowerCase(), st.slug);
  CANONICAL_STATE_MAP.set(st.slug, st.slug);
}

/**
 * Resolve any state string (abbreviation, full name, common alias) to the
 * canonical slug used in our database.  Returns the original (slugified) if
 * no match is found.
 */
export function normalizeState(s: string | null | undefined): string {
  if (!s) return "";
  const clean = normalizeString(s).toLowerCase();

  // Direct canonical match
  const direct = CANONICAL_STATE_MAP.get(clean);
  if (direct) return direct;

  // Alias table
  const alias = STATE_ALIASES[clean];
  if (alias) return alias;

  // Try stripping accents and matching
  const stripped = clean
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const aliasStripped = STATE_ALIASES[stripped];
  if (aliasStripped) return aliasStripped;

  // Last resort: slugify and hope for the best
  return generateSlug(s);
}

// ── Municipality normalisation ──────────────────────────────────────────────

export function normalizeMunicipality(s: string | null | undefined): string {
  if (!s) return "";
  return normalizeString(s);
}

// ── Category normalisation ──────────────────────────────────────────────────

const CATEGORY_ALIASES: Record<string, string> = {
  museo: "museos",
  museos: "museos",
  "museo de arte": "museos",
  "museo de historia": "museos",
  "museo comunitario": "museos",
  "zona arqueológica": "zonas-arqueologicas",
  "zona arqueologica": "zonas-arqueologicas",
  "zonas arqueológicas": "zonas-arqueologicas",
  "zonas arqueologicas": "zonas-arqueologicas",
  "sitio arqueológico": "zonas-arqueologicas",
  "sitio arqueologico": "zonas-arqueologicas",
  "pueblo mágico": "pueblos-magicos",
  "pueblo magico": "pueblos-magicos",
  "pueblos mágicos": "pueblos-magicos",
  "pueblos magicos": "pueblos-magicos",
  playa: "playas",
  cenote: "cenotes",
  cascada: "cascadas",
  hacienda: "haciendas",
  hotel: "hoteles",
  restaurante: "restaurantes",
  "centro histórico": "centros-historicos",
  "centro historico": "centros-historicos",
  viñedo: "vinedos",
  vinedo: "vinedos",
  mercado: "mercados",
  gruta: "grutas",
  balneario: "balnearios",
  cabaña: "cabanas",
  cabana: "cabanas",
  camping: "campings",
  glamping: "glamping",
  cafetería: "cafeterias",
  cafeteria: "cafeterias",
  mirador: "miradores",
  "área natural protegida": "areas-protegidas",
  "area natural protegida": "areas-protegidas",
  "parque nacional": "areas-protegidas",
  "reserva de la biósfera": "areas-protegidas",
  "reserva de la biosfera": "areas-protegidas",
  gasolinera: "gasolineras",
  caseta: "casetas",
  tour: "tours-guias",
  "tour guiado": "tours-guias",
};

// Build slug map from constants
const CATEGORY_SLUG_SET = new Set(PLACE_CATEGORIES.map((c) => c.slug));

/**
 * Map free-form category text to a canonical category slug from our taxonomy.
 * Returns the slug or `""` if no match is found.
 */
export function normalizeCategory(s: string | null | undefined): string {
  if (!s) return "";
  const clean = normalizeString(s).toLowerCase();

  // Already a valid slug?
  if (CATEGORY_SLUG_SET.has(clean as typeof PLACE_CATEGORIES[number]['slug'])) return clean;

  // Alias lookup
  const alias = CATEGORY_ALIASES[clean];
  if (alias) return alias;

  // Strip accents and retry
  const stripped = clean
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const aliasStripped = CATEGORY_ALIASES[stripped];
  if (aliasStripped) return aliasStripped;

  return "";
}

// ── Phone normalisation ─────────────────────────────────────────────────────

/**
 * Normalise a phone number to Mexican format.
 * Outputs `+52 <10 digits>` when possible, otherwise cleans the original.
 */
export function normalizePhone(s: string | null | undefined): string {
  if (!s) return "";

  // Strip everything except digits and leading +
  let digits = s.replace(/[^\d+]/g, "");

  // Remove leading + for processing
  const hasPlus = digits.startsWith("+");
  if (hasPlus) digits = digits.slice(1);

  // If starts with 52 and has 12 digits total -> +52 + 10 digits
  if (digits.startsWith("52") && digits.length === 12) {
    return `+52 ${digits.slice(2)}`;
  }

  // 10 digits -> assume Mexican mobile/landline
  if (digits.length === 10) {
    return `+52 ${digits}`;
  }

  // 13 digits starting with 521 (old mobile prefix) -> normalise
  if (digits.startsWith("521") && digits.length === 13) {
    return `+52 ${digits.slice(3)}`;
  }

  // Return cleaned version
  return normalizeString(s);
}

// ── URL normalisation ───────────────────────────────────────────────────────

const TRACKING_PARAMS_SET = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "ref",
  "mc_cid",
  "mc_eid",
  "msclkid",
  "dclid",
  "yclid",
  "_ga",
  "_gl",
]);

/** Ensure https, strip tracking query params. */
export function normalizeUrl(s: string | null | undefined): string {
  if (!s) return "";
  let url = normalizeString(s);

  // Add protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Force https
  url = url.replace(/^http:\/\//i, "https://");

  try {
    const parsed = new URL(url);
    // Remove tracking params
    for (const key of [...parsed.searchParams.keys()]) {
      if (TRACKING_PARAMS_SET.has(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    }
    // Remove trailing slash on path (unless root)
    if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

// ── Slug generation ─────────────────────────────────────────────────────────

/**
 * Generate a URL-safe slug. Optionally prefix with state slug for uniqueness.
 *
 * Examples:
 *   generateSlug("Tepoztlán")            -> "tepoztlan"
 *   generateSlug("Tepoztlán", "morelos") -> "morelos-tepoztlan"
 */
export function generateSlug(
  name: string,
  state?: string | null,
): string {
  const base = slugify(normalizeString(name), {
    lower: true,
    strict: true,
    locale: "es",
  });

  if (state) {
    const stateSlug = slugify(normalizeString(state), {
      lower: true,
      strict: true,
      locale: "es",
    });
    return `${stateSlug}-${base}`;
  }

  return base;
}

// ── HTML cleaning ───────────────────────────────────────────────────────────

/**
 * Strip HTML tags, decode common entities, collapse whitespace.
 * Intentionally simple — for heavy HTML use sanitize-html instead.
 */
export function cleanHtml(s: string | null | undefined): string {
  if (!s) return "";

  let out = s
    // Strip tags
    .replace(/<[^>]*>/g, " ")
    // Decode common entities
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code) =>
      String.fromCharCode(parseInt(code, 16)),
    );

  // Collapse whitespace
  out = out.replace(/\s+/g, " ").trim();

  return out;
}
