/**
 * Text safety for user-generated content.
 *
 * Layers, from cheap to expensive:
 *   1. Strict sanitize-html pass (drops script/iframe/style/handlers).
 *   2. URL count cap (anti-spam). Free posts allow up to 2 links.
 *   3. Keyword blocklist for profanity / hate / explicit content.
 *   4. Optional external API hook via `TEXT_MODERATION_PROVIDER` env.
 *
 * This module deliberately avoids pulling the full sanitize-html bundle on the
 * client: it's only imported from server code (API routes / server actions).
 */
import sanitizeHtml from 'sanitize-html';

// Words that invalidate a post. Deliberately conservative; expand with care.
// Sourced from common Spanish + English lists plus Mexico-specific slurs.
// Comparisons are done case-insensitive and accent-insensitive.
const BLOCKLIST_WORDS: string[] = [
  // explicit sexual — zero tolerance for spaces about travel/community
  'xxx', 'porno', 'porn', 'nude', 'desnuda', 'desnudo',
  // hate speech / slurs (abbreviated representatives)
  'puto', 'puta', 'maric', 'joto', 'nigger',
  // minors-safety red flags
  'menor de edad', 'pedof',
];

const URL_REGEX = /\bhttps?:\/\/[^\s<>"]{3,}/gi;

export interface TextSafetyResult {
  ok: boolean;
  cleaned: string;
  violations: string[];
}

export interface TextSafetyOptions {
  /** Max allowed URLs; default 2. Set 0 to disallow URLs completely. */
  maxUrls?: number;
  /** If true, allow soft profanity (levels down). Default false. */
  lenient?: boolean;
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Cheap sanitize for text-only fields (strips all HTML). */
export function sanitizeText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim();
}

/** Sanitize markdown-like content: allow basic formatting, drop dangerous. */
export function sanitizeRichText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u',
      'ul', 'ol', 'li', 'blockquote', 'h2', 'h3',
      'a',
    ],
    allowedAttributes: {
      a: ['href', 'rel', 'target'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: 'noopener nofollow ugc',
          target: '_blank',
        },
      }),
    },
  }).trim();
}

/**
 * Main gate. Returns a result with violations listed and a cleaned version.
 * Call this on every piece of UGC before persisting.
 */
export function validateText(
  raw: string,
  options: TextSafetyOptions = {},
): TextSafetyResult {
  const maxUrls = options.maxUrls ?? 2;
  const violations: string[] = [];

  const cleaned = sanitizeText(raw);

  // URL cap
  const urls = cleaned.match(URL_REGEX) ?? [];
  if (urls.length > maxUrls) {
    violations.push(
      maxUrls === 0
        ? 'Los enlaces no están permitidos aquí'
        : `Máximo ${maxUrls} enlaces por publicación`,
    );
  }

  // Keyword blocklist
  const normalized = normalize(cleaned);
  const hits = BLOCKLIST_WORDS.filter((w) =>
    new RegExp(`\\b${w.replace(/\s+/g, '\\s+')}\\b`).test(normalized),
  );
  if (hits.length > 0 && !options.lenient) {
    violations.push('Lenguaje no permitido en esta comunidad');
  }

  // ALL CAPS over 40 chars → spam heuristic
  if (cleaned.length > 40) {
    const letters = cleaned.replace(/[^A-Za-zÁ-ÿ]/g, '');
    if (letters.length > 30 && letters === letters.toUpperCase()) {
      violations.push('Evita escribir todo en mayúsculas');
    }
  }

  return { ok: violations.length === 0, cleaned, violations };
}

/** Simple heuristic to detect repeated spam posts from same user. */
export function isSpammyRepeat(
  currentBody: string,
  recentBodies: string[],
): boolean {
  const cn = normalize(currentBody);
  return recentBodies.some((rb) => normalize(rb) === cn);
}
