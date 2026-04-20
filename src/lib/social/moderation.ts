import { and, eq, or } from 'drizzle-orm';

import { db } from '@/db';
import {
  socialBlocks,
  socialMatches,
  socialReports,
} from '@/db/schema';
import { REPORT_REASONS, type ReportReason } from './constants';
import { enforceRateLimit } from './rate-limit';
import { sanitizeText } from './text-safety';

export { REPORT_REASONS, REPORT_REASON_LABELS } from './constants';
export type { ReportReason } from './constants';

/**
 * Blocks a user. Idempotent. Also closes any active match between them.
 */
export async function blockUser(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  if (blockerId === blockedId) {
    throw new Error('No puedes bloquearte a ti mismo');
  }

  enforceRateLimit('block', blockerId);

  await db
    .insert(socialBlocks)
    .values({ blockerId, blockedId })
    .onConflictDoNothing({
      target: [socialBlocks.blockerId, socialBlocks.blockedId],
    });

  // Close any active match between them.
  const [userAId, userBId] =
    blockerId < blockedId ? [blockerId, blockedId] : [blockedId, blockerId];

  await db
    .update(socialMatches)
    .set({ closedByUserId: blockerId, closedAt: new Date() })
    .where(
      and(
        eq(socialMatches.userAId, userAId),
        eq(socialMatches.userBId, userBId),
      ),
    );
}

export async function unblockUser(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  await db
    .delete(socialBlocks)
    .where(
      and(
        eq(socialBlocks.blockerId, blockerId),
        eq(socialBlocks.blockedId, blockedId),
      ),
    );
}

export async function listBlockedUsers(userId: string): Promise<string[]> {
  const rows = await db
    .select({ id: socialBlocks.blockedId })
    .from(socialBlocks)
    .where(eq(socialBlocks.blockerId, userId));
  return rows.map((r) => r.id);
}

export async function isBlockedEither(
  userA: string,
  userB: string,
): Promise<boolean> {
  const rows = await db
    .select()
    .from(socialBlocks)
    .where(
      or(
        and(eq(socialBlocks.blockerId, userA), eq(socialBlocks.blockedId, userB)),
        and(eq(socialBlocks.blockerId, userB), eq(socialBlocks.blockedId, userA)),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function reportUser(args: {
  reporterId: string;
  reportedId: string;
  reason: ReportReason;
  note?: string | null;
}): Promise<void> {
  if (args.reporterId === args.reportedId) {
    throw new Error('No puedes reportarte a ti mismo');
  }
  if (!REPORT_REASONS.includes(args.reason)) {
    throw new Error('Motivo inválido');
  }
  enforceRateLimit('report', args.reporterId);
  await db.insert(socialReports).values({
    reporterId: args.reporterId,
    reportedId: args.reportedId,
    reason: args.reason,
    note: args.note ? sanitizeText(args.note).slice(0, 1000) : null,
  });
}
