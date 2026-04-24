/**
 * API contract test. The `shared/src/api.ts` file is the single source of
 * truth for endpoint paths — if any of these change, every existing route
 * handler must still match.
 *
 * We verify the string paths are stable by string equality. A cosmetic
 * rename becomes a git diff; an unintentional prefix change becomes a
 * test failure that forces the author to confirm.
 */
import { describe, it, expect } from 'vitest';
import { API } from '../../../shared/src/api';

describe('API paths', () => {
  it('auth endpoints are stable', () => {
    expect(API.authLogin).toBe('/api/auth/login');
    expect(API.authRegister).toBe('/api/auth/register');
    expect(API.authLogout).toBe('/api/auth/logout');
    expect(API.authMe).toBe('/api/auth/me');
  });

  it('billing endpoints are stable', () => {
    expect(API.plans).toBe('/api/plans');
    expect(API.entitlements).toBe('/api/entitlements');
    expect(API.stripeCheckout).toBe('/api/stripe/checkout');
    expect(API.stripePortal).toBe('/api/stripe/portal');
  });

  it('social endpoints honor their slug pattern', () => {
    expect(API.socialMatch('abc')).toBe('/api/social/matches/abc');
    expect(API.socialMatchMessages('def')).toBe(
      '/api/social/matches/def/messages',
    );
    expect(API.communityPosts('gastronomia-mexicana')).toBe(
      '/api/social/communities/gastronomia-mexicana/posts',
    );
    expect(API.postVote('p1')).toBe('/api/social/posts/p1/vote');
  });

  it('trip endpoints work', () => {
    expect(API.trip('t1')).toBe('/api/trips/t1');
    expect(API.tripFromAutopilot).toBe('/api/trips/from-autopilot');
    expect(API.autopilot).toBe('/api/ai/autopilot');
  });
});
