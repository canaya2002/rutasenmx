/**
 * API endpoint paths (relative), used by both web (same-origin fetch) and
 * mobile (absolute against API_BASE_URL). Keep every URL literal in this file
 * — greping once here beats hunting them across routes.
 */

export const API = {
  // Auth
  authLogin: '/api/auth/login',
  authRegister: '/api/auth/register',
  authLogout: '/api/auth/logout',
  authMe: '/api/auth/me',
  authRecover: '/api/auth/recover',
  authResetPassword: '/api/auth/reset-password',

  // Plans + billing
  plans: '/api/plans',
  entitlements: '/api/entitlements',
  stripeCheckout: '/api/stripe/checkout',
  stripePortal: '/api/stripe/portal',
  iapSync: '/api/iap/sync',

  // Geocode
  geocode: '/api/geocode',

  // Trips
  trips: '/api/trips',
  trip: (id: string) => `/api/trips/${id}`,
  tripFromAutopilot: '/api/trips/from-autopilot',

  // Autopilot
  autopilot: '/api/ai/autopilot',

  // Places / routes / states (public, read-only)
  places: '/api/places',
  place: (slug: string) => `/api/places/${slug}`,
  routes: '/api/routes',
  route: (slug: string) => `/api/routes/${slug}`,
  states: '/api/states',
  search: '/api/search',
  searchSuggestions: '/api/search/suggestions',
  favorites: '/api/favorites',
  favoriteBySlug: (slug: string) =>
    `/api/favorites?slug=${encodeURIComponent(slug)}`,
  tripShare: (id: string) => `/api/trips/${id}/share`,
  accountDelete: '/api/account',

  // Social — matching
  socialProfile: '/api/social/profile',
  socialQueue: '/api/social/queue',
  socialSwipe: '/api/social/swipe',
  socialMatches: '/api/social/matches',
  socialMatch: (matchId: string) => `/api/social/matches/${matchId}`,
  socialMatchMessages: (matchId: string) =>
    `/api/social/matches/${matchId}/messages`,
  socialBlocks: '/api/social/blocks',
  socialReports: '/api/social/reports',
  socialUpload: '/api/social/upload',

  // Social — community
  communities: '/api/social/communities',
  community: (slug: string) => `/api/social/communities/${slug}`,
  communityPosts: (slug: string) => `/api/social/communities/${slug}/posts`,
  post: (postId: string) => `/api/social/posts/${postId}`,
  postComments: (postId: string) => `/api/social/posts/${postId}/comments`,
  postVote: (postId: string) => `/api/social/posts/${postId}/vote`,
  postFlag: (postId: string) => `/api/social/posts/${postId}/flag`,
  commentVote: (commentId: string) =>
    `/api/social/comments/${commentId}/vote`,
} as const;
