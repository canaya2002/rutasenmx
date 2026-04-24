import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { defaultLocale, locales, type Locale } from '@/lib/i18n/config';
import { isSocialEnabled, isSocialPath } from '@/lib/feature-flags';

const LOCALE_COOKIE = 'rutasmx_locale';

function getPreferredLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale as Locale;
  }

  const acceptLang = request.headers.get('accept-language') ?? '';
  for (const locale of locales) {
    if (acceptLang.toLowerCase().includes(locale)) {
      return locale;
    }
  }

  return defaultLocale;
}

// Origins that are allowed to call /api/* cross-origin. This is important
// for the Expo Go web preview (which runs on localhost:8081 / 192.168.x.x)
// and for letting the compiled mobile app talk to www.rutasenmx.com without
// a preflight redirect. Everything else is same-origin by default.
const ALLOWED_API_ORIGINS: Array<string | RegExp> = [
  'https://rutasenmx.com',
  'https://www.rutasenmx.com',
  'http://localhost:3000',
  'http://localhost:8081',
  // Local network IPs served by Metro when you scan the Expo QR from a
  // dev-built app (or `Press w` for web preview). Matches 10.0.0.0/8,
  // 172.16.0.0/12, 192.168.0.0/16 — all RFC1918 private ranges.
  /^http:\/\/(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)\d+\.\d+:\d+$/,
  // Expo tunnel URLs when running `npm start -- --tunnel`.
  /^https:\/\/[\w-]+\.exp\.direct$/,
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  for (const rule of ALLOWED_API_ORIGINS) {
    if (typeof rule === 'string' ? rule === origin : rule.test(origin)) {
      return true;
    }
  }
  return false;
}

function withCors(response: NextResponse, origin: string | null): NextResponse {
  if (isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin!);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, X-Client-Platform',
    );
    response.headers.set('Access-Control-Max-Age', '86400');
  }
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');

  // Feature-flag kill switch for social/communities surface.
  // 404 at the edge keeps the surface out of production until FEATURE_SOCIAL=true.
  if (!isSocialEnabled() && isSocialPath(pathname)) {
    return new NextResponse('Not found', { status: 404 });
  }

  // CORS short-circuit: respond to preflight directly without going through
  // any further redirects. This fixes the "Redirect is not allowed for a
  // preflight request" error that Vercel's apex→www 308 triggers.
  if (pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    return withCors(new NextResponse(null, { status: 204 }), origin);
  }

  // Actual API call — let it pass through, but stamp CORS headers on the
  // response for allowed origins.
  if (pathname.startsWith('/api/')) {
    return withCors(NextResponse.next(), origin);
  }

  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.endsWith('/sitemap.xml')
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const locale = getPreferredLocale(request);

  response.headers.set('x-locale', locale);

  if (!request.cookies.get(LOCALE_COOKIE)) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
