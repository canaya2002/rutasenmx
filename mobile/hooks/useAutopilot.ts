import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch, ApiError } from '@/lib/api';
import {
  API,
  type AutopilotInput,
  type AutopilotOutput,
} from '@shared/index';
import { emit, EVENTS } from '@/lib/analytics';

interface AutopilotResponse {
  itinerary: AutopilotOutput;
  cached: boolean;
}

interface SaveResponse {
  tripId: string;
  redirect: string;
}

/**
 * Runs the server-side Autopilot pipeline. Server returns `{ itinerary,
 * cached }`. If the user doesn't have IA in their plan, the server returns
 * 403 with `upgradeRequired: 'pro'` — we surface that so the UI can show a
 * paywall instead of a generic error.
 */
export function useRunAutopilot() {
  return useMutation<
    AutopilotResponse,
    ApiError,
    AutopilotInput
  >({
    mutationFn: (input) =>
      apiFetch<AutopilotResponse>(API.autopilot, {
        method: 'POST',
        body: input,
        timeoutMs: 60_000, // Generation can take 20-40s
      }),
    onSuccess: (data, input) => {
      emit(EVENTS.autopilot_run, {
        properties: {
          source: data.itinerary.source,
          cached: data.cached,
          dayCount: data.itinerary.days.length,
          style: input.style,
          budget: input.budget,
        },
      });
    },
  });
}

/**
 * Persists an AutopilotOutput as a full trip (trip + trip_days + trip_stops).
 * Returns the new tripId + an absolute-ish redirect path.
 */
export function useSaveFromAutopilot() {
  const qc = useQueryClient();
  return useMutation<SaveResponse, ApiError, AutopilotOutput>({
    mutationFn: (itinerary) =>
      apiFetch<SaveResponse>(API.tripFromAutopilot, {
        method: 'POST',
        body: itinerary,
      }),
    onSuccess: (data, itinerary) => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      emit(EVENTS.trip_saved_from_autopilot, {
        properties: {
          tripId: data.tripId,
          dayCount: itinerary.days.length,
          source: itinerary.source,
        },
      });
    },
  });
}
