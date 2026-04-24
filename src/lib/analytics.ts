/**
 * Product analytics: one thin, pluggable emitter for all funnel events.
 *
 * Design:
 *   • `emit(name, { userId, properties, sessionId })` is fire-and-forget.
 *     Callers never `await` it in the hot path — a failure here must not
 *     break the user's request.
 *   • Default sink writes a row to the `analytics_events` table.
 *   • An optional sink forwards to PostHog when POSTHOG_API_KEY is set —
 *     nothing else to configure, no SDK dependency.
 *   • All sinks receive the same payload, so you can add console logging,
 *     a Slack hook, or Segment later without touching call sites.
 *
 * Only call from SERVER code (route handlers, server actions). Client-side
 * events should hit a `/api/events` endpoint if/when we add one.
 */

import { db, analyticsEvents } from '@/db';

export const EVENTS = {
  // Auth
  signup_completed: 'signup_completed',
  login: 'login',

  // Trips
  trip_created: 'trip_created',
  trip_deleted: 'trip_deleted',
  trip_saved_from_autopilot: 'trip_saved_from_autopilot',

  // AI
  autopilot_run: 'autopilot_run',
  autopilot_cached_hit: 'autopilot_cached_hit',

  // Billing
  checkout_started: 'checkout_started',
  checkout_completed: 'checkout_completed',
  checkout_failed: 'checkout_failed',
  subscription_canceled: 'subscription_canceled',
  iap_completed: 'iap_completed',
  iap_blocked_cross_platform: 'iap_blocked_cross_platform',

  // Social (match/tinder-style)
  social_profile_saved: 'social_profile_saved',
  swipe: 'swipe',
  match_created: 'match_created',
  message_sent: 'message_sent',
  user_reported: 'user_reported',
  user_blocked: 'user_blocked',

  // Community
  community_created: 'community_created',
  community_joined: 'community_joined',
  post_created: 'post_created',
  comment_created: 'comment_created',
  post_flagged: 'post_flagged',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

export interface EmitInput {
  userId?: string | null;
  sessionId?: string | null;
  properties?: Record<string, unknown>;
}

type Sink = (name: EventName, input: EmitInput) => Promise<void>;

// ── Sink: Postgres `analytics_events` ───────────────────────────────────────
const dbSink: Sink = async (name, input) => {
  try {
    await db.insert(analyticsEvents).values({
      userId: input.userId ?? null,
      sessionId: input.sessionId ?? null,
      name,
      properties: input.properties ?? null,
    });
  } catch (err) {
    // Analytics must never break user flows. Swallow and log.
    console.warn('[analytics] dbSink failed for', name, err);
  }
};

// ── Sink: PostHog (optional; only runs when POSTHOG_API_KEY is set) ─────────
const posthogSink: Sink = async (name, input) => {
  const apiKey = process.env.POSTHOG_API_KEY;
  if (!apiKey) return;
  const host = process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com';
  try {
    await fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        event: name,
        distinct_id: input.userId ?? input.sessionId ?? 'anonymous',
        properties: {
          ...input.properties,
          $lib: 'rutasenmx-server',
        },
      }),
      // Don't block; fail-open.
      signal: AbortSignal.timeout(1500),
    });
  } catch (err) {
    console.warn('[analytics] posthogSink failed for', name, err);
  }
};

const SINKS: Sink[] = [dbSink, posthogSink];

/**
 * Emit a product event. Never throws. Safe to call from anywhere server-side.
 *
 * @example
 *   emit(EVENTS.trip_created, { userId, properties: { planSlug: 'pro' } });
 */
export function emit(name: EventName, input: EmitInput = {}): void {
  // Fire-and-forget: do NOT await. We want zero impact on request latency.
  void (async () => {
    await Promise.all(SINKS.map((sink) => sink(name, input)));
  })();
}
