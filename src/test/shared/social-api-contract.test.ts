/**
 * Contract test for the social + community API paths. Mobile's `useSocial`
 * and `useCommunity` hooks depend on these exact strings. If anyone renames
 * a route this test fires before the mobile build breaks.
 */
import { describe, it, expect } from 'vitest';
import { API } from '../../../shared/src/api';
import {
  REPORT_REASONS,
  SOCIAL_INTENT_LABELS_ES,
  SOCIAL_INTENT_LABELS_EN,
  SOCIAL_INTENT_EMOJIS,
  type SocialIntent,
} from '../../../shared/src/types/social';

describe('social API paths', () => {
  it('profile + queue + swipe', () => {
    expect(API.socialProfile).toBe('/api/social/profile');
    expect(API.socialQueue).toBe('/api/social/queue');
    expect(API.socialSwipe).toBe('/api/social/swipe');
  });

  it('matches + messages', () => {
    expect(API.socialMatches).toBe('/api/social/matches');
    expect(API.socialMatch('m1')).toBe('/api/social/matches/m1');
    expect(API.socialMatchMessages('m2')).toBe(
      '/api/social/matches/m2/messages',
    );
  });

  it('moderation', () => {
    expect(API.socialBlocks).toBe('/api/social/blocks');
    expect(API.socialReports).toBe('/api/social/reports');
    expect(API.socialUpload).toBe('/api/social/upload');
  });

  it('community endpoints', () => {
    expect(API.communities).toBe('/api/social/communities');
    expect(API.community('gastronomia')).toBe(
      '/api/social/communities/gastronomia',
    );
    expect(API.communityPosts('road-trips')).toBe(
      '/api/social/communities/road-trips/posts',
    );
    expect(API.post('p1')).toBe('/api/social/posts/p1');
    expect(API.postComments('p2')).toBe('/api/social/posts/p2/comments');
    expect(API.postVote('p3')).toBe('/api/social/posts/p3/vote');
    expect(API.postFlag('p4')).toBe('/api/social/posts/p4/flag');
    expect(API.commentVote('c1')).toBe('/api/social/comments/c1/vote');
  });
});

describe('social taxonomy', () => {
  it('REPORT_REASONS contains the canonical five', () => {
    expect(REPORT_REASONS).toEqual([
      'harassment',
      'spam',
      'inappropriate_content',
      'fake_profile',
      'other',
    ]);
  });

  it('intents have both ES + EN labels + emojis', () => {
    const intents: SocialIntent[] = ['convivir', 'salir', 'explorar', 'conocer'];
    for (const i of intents) {
      expect(SOCIAL_INTENT_LABELS_ES[i]).toBeTruthy();
      expect(SOCIAL_INTENT_LABELS_EN[i]).toBeTruthy();
      expect(SOCIAL_INTENT_EMOJIS[i]).toBeTruthy();
    }
  });
});
