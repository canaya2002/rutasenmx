/**
 * Brand + domain constants reused by both platforms.
 */

export const APP_NAME = 'Rutas en MX';
export const APP_DOMAIN = 'rutasenmx.com';
export const APP_URL = 'https://rutasenmx.com';
export const APP_CURRENCY = 'MXN';
export const APP_COUNTRY = 'MX';

export const MEXICO_CENTER = { lat: 23.6345, lng: -102.5528 };
export const MEXICO_BOUNDS = {
  north: 32.72,
  south: 14.53,
  east: -86.71,
  west: -118.4,
};

/**
 * Deep-link scheme for the mobile app. Must match `scheme` in mobile/app.json.
 * Also whitelisted for iOS Universal Links / Android App Links at
 * https://rutasenmx.com/.well-known/{apple-app-site-association,assetlinks.json}.
 */
export const APP_DEEP_LINK_SCHEME = 'rutasenmx';
