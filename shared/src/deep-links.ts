/**
 * Pure URL → in-app path mapper. Lives in `shared/` so:
 *   - mobile imports it from a `DeepLinkProvider` to route incoming Universal
 *     Links / App Links into expo-router.
 *   - the vitest suite (which runs from web's tsconfig) can import + test it
 *     without needing to resolve mobile's tsconfig.
 *   - the web can, if ever needed, build deep links that open the app.
 *
 * No RN, no next, no fetch — just standard WHATWG URL parsing.
 */

const STATIC_MAP: Record<string, string> = {
  '/': '/(tabs)',
  '/rutas': '/(tabs)/rutas',
  '/precios': '/suscripcion',
  '/suscripcion': '/suscripcion',
  '/mis-viajes': '/mis-viajes',
  '/perfil': '/(tabs)/perfil',
  '/planear': '/(tabs)/autopilot',
};

export function mapWebUrlToAppPath(rawUrl: string): string | null {
  let url: URL;
  let path: string;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol === 'rutasenmx:') {
    // Custom scheme: `rutasenmx://lugares/teotihuacan` — WHATWG puts "lugares"
    // in `host`, not in pathname. Reconstruct the path ourselves.
    const hostPart = url.host ? `/${url.host}` : '';
    path = (hostPart + url.pathname).replace(/\/+$/, '') || '/';
  } else {
    if (url.protocol === 'https:' && url.host !== 'rutasenmx.com') {
      return null;
    }
    path = url.pathname.replace(/\/+$/, '') || '/';
  }
  if (path in STATIC_MAP) return STATIC_MAP[path]!;

  const segments = path.split('/').filter(Boolean);

  if (segments[0] === 'lugares' && segments[1]) {
    return `/lugar/${encodeURIComponent(segments[1])}`;
  }
  if (segments[0] === 'rutas' && segments[1]) {
    return `/ruta/${encodeURIComponent(segments[1])}`;
  }
  if (segments[0] === 'mis-viajes' && segments[1]) {
    return `/mis-viajes/${encodeURIComponent(segments[1])}`;
  }
  if (segments[0] === 'comunidad') {
    if (segments[1] === 'post' && segments[2]) {
      return `/comunidad/post/${encodeURIComponent(segments[2])}`;
    }
    if (segments[1]) {
      return `/comunidad/${encodeURIComponent(segments[1])}`;
    }
    return '/comunidad';
  }
  if (segments[0] === 'categoria' && segments[1]) {
    return `/categoria/${encodeURIComponent(segments[1])}`;
  }

  return null;
}
