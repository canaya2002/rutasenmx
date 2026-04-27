/**
 * Trip draft — places the user has tagged "add to route" while exploring.
 *
 * Stored in AsyncStorage under `tripDraft.stops` (same key the web uses in
 * localStorage so the two clients can converge on the same shape if we ever
 * want to sync via the API). The /planear screen reads this on mount and
 * pre-loads the stops it finds.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'tripDraft.stops';

export interface DraftStop {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  stateName: string;
  category: string;
  addedAt: number;
}

export async function getDraftStops(): Promise<DraftStop[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as DraftStop[];
    return [];
  } catch {
    return [];
  }
}

export async function addDraftStop(
  stop: Omit<DraftStop, 'addedAt'>,
): Promise<{ ok: true; count: number } | { ok: false; reason: 'duplicate'; count: number }> {
  const stops = await getDraftStops();
  if (stops.some((s) => s.slug === stop.slug)) {
    return { ok: false, reason: 'duplicate', count: stops.length };
  }
  stops.push({ ...stop, addedAt: Date.now() });
  await AsyncStorage.setItem(KEY, JSON.stringify(stops));
  return { ok: true, count: stops.length };
}

export async function removeDraftStop(slug: string): Promise<DraftStop[]> {
  const stops = await getDraftStops();
  const next = stops.filter((s) => s.slug !== slug);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function clearDraftStops(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
