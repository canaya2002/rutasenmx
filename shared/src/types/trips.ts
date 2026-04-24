/**
 * Trip / Autopilot types shared between web and mobile.
 * Mirror of src/lib/ai/types.ts (public surface only).
 */

export type AutopilotStyle =
  | 'cultural'
  | 'foodie'
  | 'familiar'
  | 'naturaleza'
  | 'express'
  | 'premium';

export type AutopilotPace = 'relajado' | 'moderado' | 'intenso';
export type AutopilotBudget = 'economico' | 'moderado' | 'premium' | 'lujo';

export interface AutopilotInput {
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  dates?: { start: string; end: string };
  pace: AutopilotPace;
  travelers: {
    type: 'solo' | 'pareja' | 'familia' | 'amigos' | 'grupo';
    count: number;
    hasChildren: boolean;
    hasPets: boolean;
  };
  budget: AutopilotBudget;
  interests: string[];
  restrictions: {
    avoidTolls: boolean;
    avoidHighways: boolean;
    avoidDirtRoads: boolean;
    avoidFerries: boolean;
    maxDrivingHoursPerDay: number;
  };
  mustVisit: Array<{ name: string; lat: number; lng: number }>;
  style: AutopilotStyle;
}

export interface AutopilotStop {
  placeId: string;
  placeName: string;
  placeSlug: string;
  category: string;
  lat: number;
  lng: number;
  reason: string;
  suggestedDuration: number;
  suggestedArrival?: string;
  confidence: number;
  detourKm: number;
  highlights: string[];
}

export interface AutopilotDay {
  dayNumber: number;
  date?: string;
  title: string;
  description: string;
  stops: AutopilotStop[];
  drivingMinutes: number;
  drivingKm: number;
}

export interface AutopilotAlternative {
  style: string;
  description: string;
  replacements: Array<{
    dayNumber: number;
    remove: string[];
    add: AutopilotStop[];
  }>;
}

export interface AutopilotOutput {
  tripTitle: string;
  tripDescription: string;
  days: AutopilotDay[];
  totalDistance: number;
  totalDuration: number;
  estimatedCost: { min: number; max: number; currency: string };
  alternatives: AutopilotAlternative[];
  confidence: number;
  warnings: string[];
  /** 'llm' if real AI ran, 'heuristic' if fallback was used. Never lie. */
  source: 'llm' | 'heuristic';
}

export interface TripSummary {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description: string | null;
  originName: string | null;
  originLat: number | null;
  originLng: number | null;
  destinationName: string | null;
  destinationLat: number | null;
  destinationLng: number | null;
  status: 'draft' | 'planning' | 'active' | 'completed' | 'archived';
  isPublic: boolean;
  totalDistanceKm: number | null;
  totalDurationMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}
