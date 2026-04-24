import { and, asc, desc, eq, gt, inArray, isNull, or, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  socialMatches,
  socialMessages,
  socialProfiles,
} from '@/db/schema';
import { ESTADO_NAME_BY_SLUG, SOCIAL_MESSAGE_MAX, SOCIAL_MESSAGE_MIN } from './constants';
import { enforceRateLimit } from './rate-limit';
import { validateText } from './text-safety';
import type {
  SocialMatchView,
  SocialMessageView,
  SocialProfileView,
} from './types';

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
 * Returns all matches (open or closed) that involve the given user. For each
 * match, we join the other user's profile so the list can render immediately.
 */
export async function listMatches(userId: string): Promise<SocialMatchView[]> {
  const matches = await db
    .select()
    .from(socialMatches)
    .where(
      or(
        eq(socialMatches.userAId, userId),
        eq(socialMatches.userBId, userId),
      ),
    )
    .orderBy(desc(socialMatches.lastMessageAt), desc(socialMatches.createdAt));

  if (matches.length === 0) return [];

  const otherIds = matches.map((m) =>
    m.userAId === userId ? m.userBId : m.userAId,
  );

  const profRows = await db
    .select()
    .from(socialProfiles)
    .where(inArray(socialProfiles.userId, otherIds));
  const profiles = new Map<string, SocialProfileView>();
  for (const r of profRows) profiles.set(r.userId, rowToProfileView(r));

  // Last message preview + unread count per match
  const matchIds = matches.map((m) => m.id);

  const previews = await db
    .select({
      matchId: socialMessages.matchId,
      body: socialMessages.body,
      createdAt: socialMessages.createdAt,
    })
    .from(socialMessages)
    .where(
      and(
        inArray(socialMessages.matchId, matchIds),
        sql`${socialMessages.createdAt} = (
          SELECT MAX(m2.created_at) FROM social_messages m2
          WHERE m2.match_id = ${socialMessages.matchId}
        )`,
      ),
    );
  const previewByMatch = new Map<string, string>();
  for (const p of previews) previewByMatch.set(p.matchId, p.body);

  const unread = await db
    .select({
      matchId: socialMessages.matchId,
      count: sql<number>`count(*)::int`,
    })
    .from(socialMessages)
    .where(
      and(
        inArray(socialMessages.matchId, matchIds),
        isNull(socialMessages.readAt),
        sql`${socialMessages.senderId} <> ${userId}`,
      ),
    )
    .groupBy(socialMessages.matchId);
  const unreadByMatch = new Map<string, number>();
  for (const u of unread) unreadByMatch.set(u.matchId, u.count);

  const fallbackProfile = (otherId: string): SocialProfileView => ({
    userId: otherId,
    displayName: 'Usuario',
    bio: null,
    photoUrl: null,
    destinoEstadoSlug: null,
    destinoEstadoName: null,
    interests: [],
    intent: null,
    age: null,
    languages: [],
    travelFrom: null,
    travelTo: null,
    isVisible: false,
  });

  return matches.map((m) => {
    const otherId = m.userAId === userId ? m.userBId : m.userAId;
    return {
      matchId: m.id,
      other: profiles.get(otherId) ?? fallbackProfile(otherId),
      createdAt: m.createdAt.toISOString(),
      lastMessageAt: m.lastMessageAt ? m.lastMessageAt.toISOString() : null,
      isClosed: m.closedAt != null,
      unreadCount: unreadByMatch.get(m.id) ?? 0,
      lastMessagePreview: previewByMatch.get(m.id) ?? null,
    };
  });
}

/**
 * Checks that the caller participates in the given match and returns both the
 * match row and the other user id. Throws if not found or not a participant.
 */
export async function getMatchForUser(
  matchId: string,
  userId: string,
): Promise<{ match: typeof socialMatches.$inferSelect; otherId: string }> {
  const [match] = await db
    .select()
    .from(socialMatches)
    .where(eq(socialMatches.id, matchId))
    .limit(1);
  if (!match) throw new Error('Match no encontrado');
  if (match.userAId !== userId && match.userBId !== userId) {
    throw new Error('No participas en este match');
  }
  const otherId = match.userAId === userId ? match.userBId : match.userAId;
  return { match, otherId };
}

/**
 * Returns messages in ascending order. Optional `after` allows cheap polling:
 * pass the latest message id you have and only newer ones come back.
 */
export async function listMessages(
  matchId: string,
  userId: string,
  opts: { after?: string; limit?: number } = {},
): Promise<SocialMessageView[]> {
  const { match } = await getMatchForUser(matchId, userId);

  const conditions = [eq(socialMessages.matchId, match.id)];
  if (opts.after) {
    const [afterRow] = await db
      .select({ createdAt: socialMessages.createdAt })
      .from(socialMessages)
      .where(eq(socialMessages.id, opts.after))
      .limit(1);
    if (afterRow) {
      conditions.push(gt(socialMessages.createdAt, afterRow.createdAt));
    }
  }

  const rows = await db
    .select()
    .from(socialMessages)
    .where(and(...conditions))
    .orderBy(asc(socialMessages.createdAt))
    .limit(opts.limit ?? 200);

  // Mark messages from the other side as read (best effort).
  await db
    .update(socialMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(socialMessages.matchId, match.id),
        sql`${socialMessages.senderId} <> ${userId}`,
        isNull(socialMessages.readAt),
      ),
    );

  return rows.map((r) => ({
    id: r.id,
    matchId: r.matchId,
    senderId: r.senderId,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    readAt: r.readAt ? r.readAt.toISOString() : null,
  }));
}

export async function sendMessage(
  matchId: string,
  senderId: string,
  rawBody: string,
): Promise<{ message: SocialMessageView; recipientId: string }> {
  enforceRateLimit('sendMessage', senderId);

  const { cleaned, ok, violations } = validateText(rawBody, { maxUrls: 2 });
  if (!ok) {
    throw new Error(violations[0] ?? 'Mensaje no permitido');
  }
  if (cleaned.length < SOCIAL_MESSAGE_MIN) {
    throw new Error('El mensaje está vacío');
  }
  if (cleaned.length > SOCIAL_MESSAGE_MAX) {
    throw new Error(`El mensaje supera ${SOCIAL_MESSAGE_MAX} caracteres`);
  }

  const { match, otherId } = await getMatchForUser(matchId, senderId);
  if (match.closedAt) {
    throw new Error('La conversación está cerrada');
  }

  const [msg] = await db
    .insert(socialMessages)
    .values({ matchId: match.id, senderId, body: cleaned })
    .returning();

  await db
    .update(socialMatches)
    .set({ lastMessageAt: msg.createdAt })
    .where(eq(socialMatches.id, match.id));

  return {
    message: {
      id: msg.id,
      matchId: msg.matchId,
      senderId: msg.senderId,
      body: msg.body,
      createdAt: msg.createdAt.toISOString(),
      readAt: msg.readAt ? msg.readAt.toISOString() : null,
    },
    recipientId: otherId,
  };
}

/**
 * Closes a match (unmatch). Either participant may close. Messages remain for
 * the existing participant's history but the chat UI will mark it read-only.
 */
export async function closeMatch(
  matchId: string,
  userId: string,
): Promise<void> {
  const { match } = await getMatchForUser(matchId, userId);
  if (match.closedAt) return;
  await db
    .update(socialMatches)
    .set({ closedByUserId: userId, closedAt: new Date() })
    .where(eq(socialMatches.id, match.id));
}
