/**
 * In-memory rate limiter. Per-process, so a multi-instance deploy would need
 * Redis or similar. Good enough for MVP; abstracted behind one function so we
 * can swap the store later without touching call sites.
 *
 * Keys are scoped as `${action}:${userId}` to avoid cross-action interference.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitConfig {
  /** Max operations in the window. */
  max: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.max - 1 };
  }

  if (bucket.count >= config.max) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((bucket.resetAt - now) / 1000),
    );
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  bucket.count += 1;
  return { allowed: true, remaining: config.max - bucket.count };
}

/** Periodic cleanup of stale buckets (once per 5 min). */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, b] of buckets.entries()) {
      if (b.resetAt <= now) buckets.delete(key);
    }
  }, 5 * 60_000).unref?.();
}

// ── Standard limits for social actions ──────────────────────────────────────
export const LIMITS = {
  profileUpdate: { max: 20, windowMs: 60 * 60_000 }, // 20/hour
  swipe: { max: 60, windowMs: 60_000 }, // 60/min (daily ceiling enforced elsewhere)
  sendMessage: { max: 30, windowMs: 60_000 }, // 30/min
  report: { max: 5, windowMs: 10 * 60_000 }, // 5 per 10 min
  block: { max: 20, windowMs: 60 * 60_000 }, // 20/hour
  createPost: { max: 20, windowMs: 60 * 60_000 }, // 20/hour
  createComment: { max: 60, windowMs: 60 * 60_000 }, // 60/hour
  createCommunity: { max: 3, windowMs: 24 * 60 * 60_000 }, // 3/day
  vote: { max: 200, windowMs: 60 * 60_000 }, // 200/hour
  upload: { max: 30, windowMs: 60 * 60_000 }, // 30 uploads/hour
} as const;

export type RateLimitAction = keyof typeof LIMITS;

/** Convenience: throws a special error when the limit is hit. */
export class RateLimitError extends Error {
  public retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    super('Demasiadas solicitudes, intenta de nuevo pronto');
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function enforceRateLimit(
  action: RateLimitAction,
  userId: string,
): void {
  const result = checkRateLimit(`${action}:${userId}`, LIMITS[action]);
  if (!result.allowed) {
    throw new RateLimitError(result.retryAfterSeconds ?? 60);
  }
}
