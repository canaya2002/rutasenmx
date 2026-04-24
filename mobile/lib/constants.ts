import Constants from 'expo-constants';

/**
 * Resolves the API base URL from, in order:
 *   1. EXPO_PUBLIC_API_BASE_URL (set in eas.json per profile)
 *   2. app.json → extra.apiBaseUrl
 *   3. production default
 */
// Canonical URL is `www.rutasenmx.com` — Vercel redirects the apex to it.
// Using `www` directly avoids the 308 redirect that breaks POST bodies on
// some HTTP clients and breaks CORS preflight entirely on web.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'https://www.rutasenmx.com';

export const APP_ENV = process.env.EXPO_PUBLIC_ENV ?? 'development';

/** Where SecureStore keeps the JWT. */
export const SESSION_TOKEN_KEY = 'rmx.session';

/** Where SecureStore keeps the user's biometric opt-in state. */
export const BIOMETRIC_OPT_IN_KEY = 'rmx.biometric.optin';
