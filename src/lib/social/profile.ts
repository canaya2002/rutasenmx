import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { socialProfiles } from '@/db/schema';
import {
  SOCIAL_BIO_MAX,
  SOCIAL_DISPLAY_NAME_MAX,
  SOCIAL_INTEREST_OPTIONS,
  SOCIAL_LANGUAGE_OPTIONS,
  ESTADO_NAME_BY_SLUG,
} from './constants';
import { enforceRateLimit } from './rate-limit';
import { sanitizeText, validateText } from './text-safety';
import type { SocialProfileView } from './types';

export const socialProfileInputSchema = z.object({
  displayName: z.string().trim().min(2).max(SOCIAL_DISPLAY_NAME_MAX),
  bio: z.string().trim().max(SOCIAL_BIO_MAX).optional().nullable(),
  photoUrl: z.string().url().max(500).optional().nullable(),
  destinoEstadoSlug: z.string().max(64).optional().nullable(),
  interests: z.array(z.enum(SOCIAL_INTEREST_OPTIONS)).max(10).default([]),
  intent: z
    .enum(['convivir', 'salir', 'explorar', 'conocer'])
    .optional()
    .nullable(),
  age: z.number().int().min(18).max(99).optional().nullable(),
  languages: z.array(z.enum(SOCIAL_LANGUAGE_OPTIONS)).max(5).default([]),
  travelFrom: z.string().date().optional().nullable(),
  travelTo: z.string().date().optional().nullable(),
  isVisible: z.boolean().default(true),
});

export type SocialProfileInput = z.infer<typeof socialProfileInputSchema>;

function toView(
  row: typeof socialProfiles.$inferSelect & { userName?: string | null },
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

export async function getSocialProfile(
  userId: string,
): Promise<SocialProfileView | null> {
  const rows = await db
    .select()
    .from(socialProfiles)
    .where(eq(socialProfiles.userId, userId))
    .limit(1);
  if (rows.length === 0) return null;
  return toView(rows[0]);
}

export async function upsertSocialProfile(
  userId: string,
  input: SocialProfileInput,
): Promise<SocialProfileView> {
  enforceRateLimit('profileUpdate', userId);

  const existing = await db
    .select()
    .from(socialProfiles)
    .where(eq(socialProfiles.userId, userId))
    .limit(1);

  const displayName = sanitizeText(input.displayName);
  if (displayName.length < 2) {
    throw new Error('Nombre visible muy corto');
  }

  let bio: string | null = null;
  if (input.bio) {
    const check = validateText(input.bio, { maxUrls: 1 });
    if (!check.ok) throw new Error(check.violations[0] ?? 'Bio no permitida');
    bio = check.cleaned;
  }

  const payload = {
    displayName,
    bio,
    photoUrl: input.photoUrl ?? null,
    destinoEstadoSlug: input.destinoEstadoSlug ?? null,
    interests: input.interests,
    intent: input.intent ?? null,
    age: input.age ?? null,
    languages: input.languages,
    travelFrom: input.travelFrom ?? null,
    travelTo: input.travelTo ?? null,
    isVisible: input.isVisible,
  };

  if (existing.length === 0) {
    const [row] = await db
      .insert(socialProfiles)
      .values({ userId, ...payload })
      .returning();
    return toView(row);
  }

  const [row] = await db
    .update(socialProfiles)
    .set(payload)
    .where(eq(socialProfiles.userId, userId))
    .returning();
  return toView(row);
}

export async function setSocialProfileVisibility(
  userId: string,
  isVisible: boolean,
): Promise<void> {
  await db
    .update(socialProfiles)
    .set({ isVisible })
    .where(eq(socialProfiles.userId, userId));
}

/** Fetches many profiles by user id. Used by chat/match views. */
export async function getSocialProfilesByUserIds(
  userIds: string[],
): Promise<Map<string, SocialProfileView>> {
  if (userIds.length === 0) return new Map();
  const rows = await db
    .select()
    .from(socialProfiles)
    .where(inArray(socialProfiles.userId, userIds));
  const map = new Map<string, SocialProfileView>();
  for (const r of rows) map.set(r.userId, toView(r));
  return map;
}
