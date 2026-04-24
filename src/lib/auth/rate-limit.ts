/**
 * IP-based rate limit for auth endpoints. In-memory per-process — adequate
 * for a single Vercel instance; swap in Upstash/Redis if you ever horizontally
 * scale beyond one region.
 *
 * Separate from social/rate-limit.ts because:
 *   - Different bucket namespace (IP-keyed vs user-keyed)
 *   - Stricter numbers (brute-force defense, not anti-spam)
 *   - We want auth rate-limiting to keep working even if social/* isn't loaded
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, b] of buckets.entries()) {
      if (b.resetAt <= now) buckets.delete(key);
    }
  }, 5 * 60_000).unref?.();
}

export interface RateLimitVerdict {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkAuthRateLimit(
  key: string,
  max: number,
  windowSeconds: number,
): RateLimitVerdict {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: max - 1, retryAfterSeconds: 0 };
  }
  if (bucket.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  return {
    allowed: true,
    remaining: max - bucket.count,
    retryAfterSeconds: 0,
  };
}

/** Extracts the caller IP from Next.js request headers, preferring XFF. */
export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
