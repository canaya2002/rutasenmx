import { createHash } from 'node:crypto';
import { and, desc, eq, gt, sql } from 'drizzle-orm';

import { db } from '@/db';
import { aiTripRuns } from '@/db/schema';
import type { AutopilotInput, AutopilotOutput } from './types';

// 90 days: same input hash → same output. Itineraries for "CDMX→Oaxaca,
// cultural, moderado budget, 5 days" don't change often enough to justify
// re-generating every 30 days. This cuts Anthropic spend roughly 3x on
// popular prompts with zero user-visible staleness (cache key is
// deterministic, so dates/mustVisit changes bypass the cache anyway).
const CACHE_TTL_DAYS = Number(process.env.AI_CACHE_TTL_DAYS ?? '90');
const CACHE_VERSION = 'v1';

function roundCoord(n: number): number {
  return Math.round(n * 10) / 10;
}

function normalizeInput(input: AutopilotInput): Record<string, unknown> {
  return {
    v: CACHE_VERSION,
    origin: { lat: roundCoord(input.origin.lat), lng: roundCoord(input.origin.lng) },
    destination: {
      lat: roundCoord(input.destination.lat),
      lng: roundCoord(input.destination.lng),
    },
    days: input.dates
      ? Math.max(
          1,
          Math.ceil(
            (new Date(input.dates.end).getTime() -
              new Date(input.dates.start).getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1,
        )
      : null,
    pace: input.pace,
    budget: input.budget,
    style: input.style,
    interests: [...(input.interests ?? [])].sort(),
    restrictions: input.restrictions,
    travelersKind: `${input.travelers.type}:${input.travelers.count}:${input.travelers.hasChildren ? 1 : 0}:${input.travelers.hasPets ? 1 : 0}`,
    mustVisit: (input.mustVisit ?? [])
      .map((m) => `${roundCoord(m.lat)},${roundCoord(m.lng)}`)
      .sort(),
  };
}

export function hashAutopilotInput(input: AutopilotInput): string {
  const normalized = normalizeInput(input);
  return createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex')
    .slice(0, 40);
}

export async function findCachedItinerary(
  inputHash: string,
): Promise<AutopilotOutput | null> {
  try {
    const cutoff = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

    const rows = await db
      .select({ result: aiTripRuns.result })
      .from(aiTripRuns)
      .where(
        and(
          eq(aiTripRuns.inputHash, inputHash),
          eq(aiTripRuns.status, 'completed'),
          gt(aiTripRuns.createdAt, cutoff),
        ),
      )
      .orderBy(desc(aiTripRuns.createdAt))
      .limit(1);

    if (rows.length === 0 || !rows[0].result) return null;

    const cached = rows[0].result as AutopilotOutput;
    // Back-compat: older cached entries predate the `source` field.
    if (!cached.source) cached.source = 'heuristic';
    return cached;
  } catch (err) {
    console.warn('AI cache lookup failed:', err);
    return null;
  }
}

export async function saveCachedItinerary(params: {
  userId: string;
  inputParams: AutopilotInput;
  inputHash: string;
  result: AutopilotOutput;
  modelUsed: string;
}): Promise<void> {
  try {
    await db.insert(aiTripRuns).values({
      userId: params.userId,
      inputParams: params.inputParams as unknown as Record<string, unknown>,
      inputHash: params.inputHash,
      status: 'completed',
      result: params.result as unknown as Record<string, unknown>,
      modelUsed: params.modelUsed,
      completedAt: new Date(),
    });
  } catch (err) {
    console.warn('AI cache save failed:', err);
  }
}

export async function countRunsForUserThisMonth(
  userId: string,
): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(aiTripRuns)
    .where(
      and(
        eq(aiTripRuns.userId, userId),
        gt(aiTripRuns.createdAt, startOfMonth),
      ),
    );

  return rows[0]?.count ?? 0;
}
