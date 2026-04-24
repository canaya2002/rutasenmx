import { NextResponse } from 'next/server';
import { and, eq, ne, or } from 'drizzle-orm';
import Stripe from 'stripe';

import {
  db,
  users,
  subscriptions,
  mobileSubscriptions,
  pushTokens,
  socialProfiles,
  socialMatches,
} from '@/db';
import { getSession, clearSession } from '@/lib/auth/session';
import { emit, EVENTS } from '@/lib/analytics';

/**
 * DELETE /api/account
 *
 * Apple App Store guideline 5.1.1(v) requires in-app account deletion for any
 * app that creates accounts. Google Play has the same requirement since 2023.
 *
 * Two-phase deletion:
 *   1. SYNCHRONOUS (this handler):
 *      - Cancel any active Stripe subscription
 *      - Mark any mobile IAP sub as canceled locally (RevenueCat will sync
 *        when the user cancels in App Store / Play Store settings)
 *      - Hide social profile so ex-user doesn't show up in swipes
 *      - Close open matches so ex-partners can't message a ghost
 *      - Remove push tokens
 *      - Soft-delete the user (anonymize email/name, clear session)

 *   2. ASYNCHRONOUS — daily cron at 03:00 UTC, see
 *      `/api/cron/hard-delete-users` + `vercel.json`:
 *      - Users whose `deletedAt` is older than 30 days get their trips,
 *        matches, messages, social profile, push tokens, favorites, and
 *        community posts/comments physically purged.
 */
export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const userId = session.userId;

  // 1. Cancel Stripe subscription (best effort).
  try {
    const [sub] = await db
      .select({
        stripeSubscriptionId: subscriptions.stripeSubscriptionId,
        status: subscriptions.status,
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          ne(subscriptions.status, 'canceled'),
        ),
      )
      .limit(1);

    if (sub?.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      await stripe.subscriptions
        .cancel(sub.stripeSubscriptionId)
        .catch((err: unknown) => {
          console.warn('[account/delete] Stripe cancel failed', err);
        });
    }
  } catch (err) {
    console.warn('[account/delete] subscription lookup failed', err);
  }

  // 2. Mark IAP subs as canceled locally.
  try {
    await db
      .update(mobileSubscriptions)
      .set({ status: 'canceled' })
      .where(eq(mobileSubscriptions.userId, userId));
  } catch {
    /* ignore */
  }

  // 3. Revoke push tokens.
  try {
    await db.delete(pushTokens).where(eq(pushTokens.userId, userId));
  } catch (err) {
    console.warn('[account/delete] push token cleanup failed', err);
  }

  // 4. Hide social profile.
  try {
    await db
      .update(socialProfiles)
      .set({ isVisible: false })
      .where(eq(socialProfiles.userId, userId));
  } catch {
    /* ignore */
  }

  // 5. Close any open match this user participates in.
  try {
    await db
      .update(socialMatches)
      .set({ closedAt: new Date(), closedByUserId: userId })
      .where(
        or(
          eq(socialMatches.userAId, userId),
          eq(socialMatches.userBId, userId),
        ),
      );
  } catch (err) {
    console.warn('[account/delete] match close failed', err);
  }

  // 6. Soft-delete + anonymize. Uses userId-derived suffix so the deletion
  //    is deterministic and we never collide with a fresh account.
  const anonSuffix = userId.slice(0, 8);
  try {
    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        email: `deleted-${anonSuffix}@deleted.local`,
        name: 'Cuenta eliminada',
        passwordHash: null,
        avatarUrl: null,
      })
      .where(eq(users.id, userId));
  } catch (err) {
    console.error('[account/delete] user soft-delete failed', err);
    return NextResponse.json(
      { error: 'No pudimos completar la eliminación. Intenta de nuevo.' },
      { status: 500 },
    );
  }

  // 7. Analytics BEFORE clearing session so userId is still on the event.
  emit(EVENTS.subscription_canceled, {
    userId,
    properties: { reason: 'account_deleted' },
  });

  // 8. Wipe the session cookie.
  await clearSession();

  return NextResponse.json({
    ok: true,
    message:
      'Cuenta eliminada. Tus datos personales se borrarán completamente en 30 días.',
  });
}
