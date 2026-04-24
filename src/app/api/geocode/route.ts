import { type NextRequest, NextResponse } from 'next/server';

import { searchPlace } from '@/lib/providers/geocoding';
import { checkRateLimit } from '@/lib/social/rate-limit';
import { getSession } from '@/lib/auth/session';

/**
 * GET /api/geocode?q=...&limit=5
 *
 * Server-side proxy for geocoding so the provider API key stays secret.
 *
 * Rate-limited per IP (or per user if logged in) to prevent the endpoint
 * from becoming a free geocoding gateway for abusers.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const limitRaw = Number(url.searchParams.get('limit') ?? '5');
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 10) : 5;

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Prefer userId for the rate-limit bucket; otherwise fall back to the
  // source IP. Keeps anonymous abuse from flooding the provider.
  const session = await getSession();
  const ipHeader =
    request.headers.get('x-forwarded-for') ??
    request.headers.get('x-real-ip') ??
    'unknown';
  const ip = ipHeader.split(',')[0].trim();
  const bucketKey = `geocode:${session?.userId ?? `ip:${ip}`}`;

  const rl = checkRateLimit(bucketKey, { max: 60, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: 'Demasiadas búsquedas, intenta en un momento',
        retryAfter: rl.retryAfterSeconds,
      },
      {
        status: 429,
        headers: rl.retryAfterSeconds
          ? { 'Retry-After': String(rl.retryAfterSeconds) }
          : undefined,
      },
    );
  }

  try {
    const results = await searchPlace(q, { limit });
    return NextResponse.json({ results });
  } catch (err) {
    console.error('[api/geocode]', err);
    return NextResponse.json(
      { error: 'Geocoding falló', results: [] },
      { status: 502 },
    );
  }
}
