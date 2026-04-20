import { and, desc, eq, gt, inArray, ne, notInArray, or, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  socialBlocks,
  socialMatches,
  socialProfiles,
  socialSwipes,
} from '@/db/schema';
import {
  DISCOVERY_PAGE_SIZE,
  ESTADO_NAME_BY_SLUG,
  SOCIAL_DAILY_SWIPE_LIMIT,
} from './constants';
import { enforceRateLimit } from './rate-limit';
import type { SocialProfileView, SocialSwipeResult } from './types';

export interface DiscoveryFilters {
  destinoEstadoSlug?: string;
  interests?: string[];
  intent?: string;
  minAge?: number;
  maxAge?: number;
}

function rowToProfileView(
  row: typeof socialProfiles.$inferSelect,
): SocialProfileView {
  return {
    userId: row.userId,
    displayName: row.displayName,
    bio: row.bio,
    photoUrl: row.photoUrl,
    destinoEstadoSlug: row.destinoEstadoSlug,
    destinoEstadoName: row.destinoEstadoSlug
      ? ESTADO_NAME_BY_SLUG[row.destinoEstadoSlug] ?? null
      : null,
    interests: (row.interests ?? []) as string[],
    intent: row.intent,
    age: row.age,
    languages: (row.languages ?? []) as string[],
    travelFrom: row.travelFrom ? row.travelFrom.toString() : null,
    travelTo: row.travelTo ? row.travelTo.toString() : null,
    isVisible: row.isVisible,
  };
}

/**
 * Returns the next batch of candidates for the signed-in user, excluding
 * themselves, people they've already swiped, and anyone blocked in either
 * direction.
 */
export async function getDiscoveryQueue(
  userId: string,
  filters: DiscoveryFilters = {},
  limit = DISCOVERY_PAGE_SIZE,
): Promise<SocialProfileView[]> {
  // Already swiped
  const swiped = await db
    .select({ id: socialSwipes.toUserId })
    .from(socialSwipes)
    .where(eq(socialSwipes.fromUserId, userId));
  const swipedIds = swiped.map((r) => r.id);

  // Blocked in either direction
  const blocked = await db
    .select({
      blocker: socialBlocks.blockerId,
      blocked: socialBlocks.blockedId,
    })
    .from(socialBlocks)
    .where(
      or(eq(socialBlocks.blockerId, userId), eq(socialBlocks.blockedId, userId)),
    );
  const blockedIds = new Set<string>();
  for (const r of blocked) {
    blockedIds.add(r.blocker);
    blockedIds.add(r.blocked);
  }

  const excludeIds = [
    userId,
    ...swipedIds,
    ...Array.from(blockedIds),
  ];

  const conditions = [
    eq(socialProfiles.isVisible, true),
    ne(socialProfiles.userId, userId),
    notInArray(socialProfiles.userId, excludeIds),
  ];

  if (filters.destinoEstadoSlug) {
    conditions.push(eq(socialProfiles.destinoEstadoSlug, filters.destinoEstadoSlug));
  }
  if (filters.intent) {
    conditions.push(
      eq(
        socialProfiles.intent,
        filters.intent as 'convivir' | 'salir' | 'explorar' | 'conocer',
      ),
    );
  }
  if (filters.minAge != null) {
    conditions.push(
      sql`${socialProfiles.age} IS NULL OR ${socialProfiles.age} >= ${filters.minAge}`,
    );
  }
  if (filters.maxAge != null) {
    conditions.push(
      sql`${socialProfiles.age} IS NULL OR ${socialProfiles.age} <= ${filters.maxAge}`,
    );
  }

  const rows = await db
    .select()
    .from(socialProfiles)
    .where(and(...conditions))
    .orderBy(desc(socialProfiles.updatedAt))
    .limit(limit);

  // Re-rank by interest overlap when interests filter is present
  if (filters.interests && filters.interests.length > 0) {
    const wanted = new Set(filters.interests);
    rows.sort((a, b) => {
      const oa = (a.interests ?? []).filter((i: string) => wanted.has(i)).length;
      const ob = (b.interests ?? []).filter((i: string) => wanted.has(i)).length;
      return ob - oa;
    });
  }

  return rows.map(rowToProfileView);
}

/**
 * Counts today's swipes to enforce an anti-abuse ceiling.
 */
export async function todaySwipeCount(userId: string): Promise<number> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(socialSwipes)
    .where(
      and(
        eq(socialSwipes.fromUserId, userId),
        gt(socialSwipes.createdAt, start),
      ),
    );
  return rows[0]?.count ?? 0;
}

/**
 * Orders a pair deterministically so a unique-index on (userA, userB) works
 * regardless of who swiped first.
 */
function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/**
 * Records a swipe. If both users have liked each other, creates (or unlocks)
 * a match and returns `{ matched: true, matchId }`.
 */
export async function recordSwipe(
  fromUserId: string,
  toUserId: string,
  action: 'like' | 'pass',
): Promise<SocialSwipeResult> {
  if (fromUserId === toUserId) {
    throw new Error('No puedes deslizar sobre ti mismo');
  }

  // Per-minute burst limit + daily ceiling
  enforceRateLimit('swipe', fromUserId);
  const used = await todaySwipeCount(fromUserId);
  if (used >= SOCIAL_DAILY_SWIPE_LIMIT) {
    throw new Error('Alcanzaste el límite diario de swipes');
  }

  // Blocked in either direction → silently drop
  const blocks = await db
    .select()
    .from(socialBlocks)
    .where(
      or(
        and(
          eq(socialBlocks.blockerId, fromUserId),
          eq(socialBlocks.blockedId, toUserId),
        ),
        and(
          eq(socialBlocks.blockerId, toUserId),
          eq(socialBlocks.blockedId, fromUserId),
        ),
      ),
    )
    .limit(1);
  if (blocks.length > 0) return { matched: false };

  // Idempotent insert: if the pair already has a swipe, do nothing.
  await db
    .insert(socialSwipes)
    .values({ fromUserId, toUserId, action })
    .onConflictDoNothing({
      target: [socialSwipes.fromUserId, socialSwipes.toUserId],
    });

  if (action !== 'like') return { matched: false };

  // Did the other side also like us?
  const reciprocal = await db
    .select()
    .from(socialSwipes)
    .where(
      and(
        eq(socialSwipes.fromUserId, toUserId),
        eq(socialSwipes.toUserId, fromUserId),
        eq(socialSwipes.action, 'like'),
      ),
    )
    .limit(1);

  if (reciprocal.length === 0) return { matched: false };

  const [userAId, userBId] = orderPair(fromUserId, toUserId);

  const [match] = await db
    .insert(socialMatches)
    .values({ userAId, userBId })
    .onConflictDoNothing({
      target: [socialMatches.userAId, socialMatches.userBId],
    })
    .returning();

  // If there was a conflict, fetch the existing match id.
  if (!match) {
    const [existing] = await db
      .select()
      .from(socialMatches)
      .where(
        and(
          eq(socialMatches.userAId, userAId),
          eq(socialMatches.userBId, userBId),
        ),
      )
      .limit(1);
    return { matched: true, matchId: existing?.id };
  }

  return { matched: true, matchId: match.id };
}

/** Returns user ids the signed-in user has swiped on today (for cooldown UX). */
export async function getSwipedTodayIds(userId: string): Promise<string[]> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const rows = await db
    .select({ id: socialSwipes.toUserId })
    .from(socialSwipes)
    .where(
      and(
        eq(socialSwipes.fromUserId, userId),
        gt(socialSwipes.createdAt, start),
      ),
    );
  return rows.map((r) => r.id);
}

/** Used to prefetch the other user's profile when revealing a match modal. */
export async function getProfilesByUserIds(
  ids: string[],
): Promise<Map<string, SocialProfileView>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select()
    .from(socialProfiles)
    .where(inArray(socialProfiles.userId, ids));
  const map = new Map<string, SocialProfileView>();
  for (const r of rows) map.set(r.userId, rowToProfileView(r));
  return map;
}
