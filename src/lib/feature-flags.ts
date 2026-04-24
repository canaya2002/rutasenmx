/**
 * Central feature flags.
 *
 * Flags are read from environment variables at module-evaluation time.
 * Anything that depends on a flag should import the helper (not read the env
 * directly) so we have one source of truth and one place to change defaults.
 */

function readBool(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw == null) return defaultValue;
  return raw === 'true' || raw === '1';
}

/**
 * Social surface (matching tipo Tinder, chat, comunidades, photo uploads).
 *
 * Enabled by default. The full surface is production-ready:
 *   - moderation (text-safety, media-safety, rate limits, reports, blocks)
 *   - plan gating (social_connect is exclusive to Premium)
 *   - editorial seed (foros y canales por defecto via scripts/seed-social-communities.ts)
 *
 * Set FEATURE_SOCIAL=false (or NEXT_PUBLIC_FEATURE_SOCIAL=false for clients)
 * to kill-switch the entire /conectar + /comunidad + /api/social surface
 * in one flip — useful for incidents.
 *
 * Reads NEXT_PUBLIC_FEATURE_SOCIAL first so client components can consume
 * the same flag at build time; falls back to the server-only FEATURE_SOCIAL.
 */
export function isSocialEnabled(): boolean {
  const publicFlag = process.env.NEXT_PUBLIC_FEATURE_SOCIAL;
  if (publicFlag === 'false' || publicFlag === '0') return false;
  if (publicFlag === 'true' || publicFlag === '1') return true;
  return readBool('FEATURE_SOCIAL', true);
}

/**
 * Vehicle-specific extras listed in .env.example. Off by default.
 */
export function isMotorcycleEnabled(): boolean {
  return readBool('FEATURE_MOTORCYCLE', false);
}

export function isCampervanEnabled(): boolean {
  return readBool('FEATURE_CAMPERVAN', false);
}

export function isRVEnabled(): boolean {
  return readBool('FEATURE_RV', false);
}

export function isRoadsideAssistEnabled(): boolean {
  return readBool('FEATURE_ROADSIDE_ASSIST', false);
}

/** Path prefixes that belong to the social surface. */
export const SOCIAL_PATH_PREFIXES = [
  '/conectar',
  '/comunidad',
  '/api/social',
] as const;

/** Does this request path belong to a social surface? */
export function isSocialPath(pathname: string): boolean {
  return SOCIAL_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
