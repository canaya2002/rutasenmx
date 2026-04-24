/**
 * Canonical product event taxonomy. Emit the same names from web and mobile so
 * cross-platform funnels line up in PostHog / our `analytics_events` table.
 *
 * Mirror of src/lib/analytics.ts EVENTS on the web. Adding a new event means
 * adding it here FIRST, then both platforms. Never ship mismatched names.
 */

export const EVENTS = {
  // Auth
  signup_completed: 'signup_completed',
  login: 'login',
  logout: 'logout',

  // Trips
  trip_created: 'trip_created',
  trip_deleted: 'trip_deleted',
  trip_saved_from_autopilot: 'trip_saved_from_autopilot',

  // AI
  autopilot_run: 'autopilot_run',
  autopilot_cached_hit: 'autopilot_cached_hit',

  // Billing (web = Stripe, mobile = IAP — both flow through /api/entitlements)
  checkout_started: 'checkout_started',
  checkout_completed: 'checkout_completed',
  checkout_failed: 'checkout_failed',
  subscription_canceled: 'subscription_canceled',
  iap_started: 'iap_started',
  iap_completed: 'iap_completed',
  iap_failed: 'iap_failed',
  iap_blocked_cross_platform: 'iap_blocked_cross_platform',

  // Social
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

  // Mobile lifecycle
  app_open: 'app_open',
  push_permission_granted: 'push_permission_granted',
  push_permission_denied: 'push_permission_denied',
  offline_mode_active: 'offline_mode_active',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
