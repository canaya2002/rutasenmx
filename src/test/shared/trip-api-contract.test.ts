/**
 * Contract test for the trip + autopilot paths in shared/api. Mobile's
 * `useTrips` / `useAutopilot` hooks depend on these exact strings — if
 * anyone renames a route, this test fires before the mobile build breaks.
 */
import { describe, it, expect } from 'vitest';
import { API } from '../../../shared/src/api';

describe('trip + autopilot API paths', () => {
  it('trips list + detail + autopilot save', () => {
    expect(API.trips).toBe('/api/trips');
    expect(API.trip('abc-123')).toBe('/api/trips/abc-123');
    expect(API.tripFromAutopilot).toBe('/api/trips/from-autopilot');
  });

  it('autopilot run path', () => {
    expect(API.autopilot).toBe('/api/ai/autopilot');
  });

  it('geocode path (used by wizard)', () => {
    expect(API.geocode).toBe('/api/geocode');
  });
});
