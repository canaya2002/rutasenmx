/**
 * Mobile analytics — mirrors the web's `emit` helper with the SAME event names
 * from `@shared/index` so cross-platform funnels line up in any sink.
 *
 * Default transport: POST to our own `/api/events` (not yet implemented —
 * placeholder). A PostHog React Native SDK can be swapped in here without
 * touching call sites.
 */
import { apiFetch } from './api';
import { EVENTS, type EventName } from '@shared/index';

export { EVENTS };
export type { EventName };

export interface EmitInput {
  properties?: Record<string, unknown>;
  sessionId?: string | null;
}

/**
 * Fire-and-forget. Never blocks, never throws. If analytics fails the user
 * should never notice.
 */
export function emit(name: EventName, input: EmitInput = {}): void {
  void (async () => {
    try {
      await apiFetch('/api/events', {
        method: 'POST',
        body: {
          name,
          properties: input.properties ?? {},
          sessionId: input.sessionId ?? null,
          platform: 'mobile',
        },
        timeoutMs: 3000,
      });
    } catch {
      /* swallow */
    }
  })();
}
