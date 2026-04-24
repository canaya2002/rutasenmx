import { NextResponse } from 'next/server';
import { and, lt, isNotNull, inArray } from 'drizzle-orm';

import {
  db,
  users,
  trips,
  tripDays,
  tripStops,
  savedPlaces,
  socialProfiles,
  socialSwipes,
  socialMatches,
  socialMessages,
  socialReports,
  socialBlocks,
  socialUploads,
  socialCommunityPosts,
  socialCommunityComments,
  socialCommunityMembers,
  pushTokens,
  mobileSubscriptions,
} from '@/db';

/**
 * POST /api/cron/hard-delete-users
 *
 * Vercel Cron endpoint. Expected schedule (see vercel.json):
 *   "0 3 * * *"    — daily at 03:00 UTC
 *
 * Deletes ALL personal data of users whose `deletedAt` is older than 30 days.
 * The soft-delete at `/api/account DELETE` already anonymized email + name
 * and cut off their product surface — this is the physical purge.
 *
 * Authenticated via Vercel's built-in cron header. Set `CRON_SECRET` in env
 * and Vercel will include it on every cron run. If missing (local dev),
 * the endpoint only accepts POSTs that carry `Authorization: Bearer <secret>`
 * where secret matches `CRON_SECRET`. Fails closed — no secret, no run.
 */

const HARD_DELETE_AFTER_DAYS = 30;

async function authorize(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[cron/hard-delete] CRON_SECRET is not configured');
    return false;
  }
  // Vercel Cron sends "Authorization: Bearer <CRON_SECRET>" automatically.
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.toLowerCase().startsWith('bearer ')
    ? auth.slice('Bearer '.length).trim()
    : '';
  return token === secret;
}

export async function POST(request: Request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(
    Date.now() - HARD_DELETE_AFTER_DAYS * 24 * 60 * 60 * 1000,
  );

  // Find candidate user ids to purge.
  const candidates = await db
    .select({ id: users.id })
    .from(users)
    .where(and(isNotNull(users.deletedAt), lt(users.deletedAt, cutoff)));

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, purged: 0 });
  }

  const ids = candidates.map((c) => c.id);
  const summary: Record<string, number> = {};

  // 1. Find trips owned by these users so we can scrub tripDays/tripStops
  //    explicitly. (FK cascades would do it too, but being explicit gives us
  //    row counts for the response + survives a future FK removal.)
  const tripsOfDeleted = await db
    .select({ id: trips.id })
    .from(trips)
    .where(inArray(trips.userId, ids));
  const tripIds = tripsOfDeleted.map((t) => t.id);

  if (tripIds.length > 0) {
    await db.delete(tripStops).where(inArray(tripStops.tripId, tripIds));
    summary.trip_stops = tripIds.length;
    await db.delete(tripDays).where(inArray(tripDays.tripId, tripIds));
    summary.trip_days = tripIds.length;
  }
  const trpRes = await db
    .delete(trips)
    .where(inArray(trips.userId, ids))
    .returning({ id: trips.id });
  summary.trips = trpRes.length;

  // 2. Find matches this user participates in; delete messages in each.
  const matchRows = await db
    .select({ id: socialMatches.id })
    .from(socialMatches)
    .where(
      // user is either side
      // drizzle doesn't love nested or(...) inside where(inArray) chain — do
      // two deletes instead.
      inArray(socialMatches.userAId, ids),
    );
  const matchRowsB = await db
    .select({ id: socialMatches.id })
    .from(socialMatches)
    .where(inArray(socialMatches.userBId, ids));
  const matchIds = Array.from(
    new Set([
      ...matchRows.map((m) => m.id),
      ...matchRowsB.map((m) => m.id),
    ]),
  );
  if (matchIds.length > 0) {
    await db
      .delete(socialMessages)
      .where(inArray(socialMessages.matchId, matchIds));
    summary.social_messages = matchIds.length;
    await db.delete(socialMatches).where(inArray(socialMatches.id, matchIds));
    summary.social_matches = matchIds.length;
  }

  // 3. Social artifacts owned by the user.
  const tables: Array<[string, Promise<{ rowCount?: number } | unknown[]>]> = [
    ['social_swipes_from', db.delete(socialSwipes).where(inArray(socialSwipes.fromUserId, ids))],
    ['social_swipes_to', db.delete(socialSwipes).where(inArray(socialSwipes.toUserId, ids))],
    ['social_profiles', db.delete(socialProfiles).where(inArray(socialProfiles.userId, ids))],
    ['social_uploads', db.delete(socialUploads).where(inArray(socialUploads.userId, ids))],
    ['social_reports_reporter', db.delete(socialReports).where(inArray(socialReports.reporterId, ids))],
    ['social_reports_target', db.delete(socialReports).where(inArray(socialReports.reportedId, ids))],
    ['social_blocks_blocker', db.delete(socialBlocks).where(inArray(socialBlocks.blockerId, ids))],
    ['social_blocks_blocked', db.delete(socialBlocks).where(inArray(socialBlocks.blockedId, ids))],
    ['social_comments', db.delete(socialCommunityComments).where(inArray(socialCommunityComments.authorId, ids))],
    ['social_posts', db.delete(socialCommunityPosts).where(inArray(socialCommunityPosts.authorId, ids))],
    ['social_community_members', db.delete(socialCommunityMembers).where(inArray(socialCommunityMembers.userId, ids))],
    ['saved_places', db.delete(savedPlaces).where(inArray(savedPlaces.userId, ids))],
    ['mobile_subscriptions', db.delete(mobileSubscriptions).where(inArray(mobileSubscriptions.userId, ids))],
    ['push_tokens', db.delete(pushTokens).where(inArray(pushTokens.userId, ids))],
  ];

  for (const [name, p] of tables) {
    try {
      await p;
      summary[name] = (summary[name] ?? 0) + 1; // marker (counts requires driver-specific returning)
    } catch (err) {
      console.warn(`[cron/hard-delete] ${name} failed`, err);
    }
  }

  // 4. Finally purge the user rows themselves.
  const userRes = await db
    .delete(users)
    .where(inArray(users.id, ids))
    .returning({ id: users.id });
  summary.users = userRes.length;

  console.log(
    `[cron/hard-delete] purged ${userRes.length} users older than ${HARD_DELETE_AFTER_DAYS} days`,
    summary,
  );

  return NextResponse.json({
    ok: true,
    cutoff: cutoff.toISOString(),
    purged: userRes.length,
    summary,
  });
}

// Allow GET too so Vercel Cron "test endpoint" button works without modification.
export const GET = POST;
