// ── Autopilot AI System Types ───────────────────────────────────────────────

export interface AutopilotInput {
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  dates?: { start: string; end: string };
  pace: 'relajado' | 'moderado' | 'intenso';
  travelers: {
    type: 'solo' | 'pareja' | 'familia' | 'amigos' | 'grupo';
    count: number;
    hasChildren: boolean;
    hasPets: boolean;
  };
  budget: 'economico' | 'moderado' | 'premium' | 'lujo';
  interests: string[]; // from PLACE_CATEGORIES slugs
  restrictions: {
    avoidTolls: boolean;
    avoidHighways: boolean;
    avoidDirtRoads: boolean;
    avoidFerries: boolean;
    maxDrivingHoursPerDay: number;
  };
  mustVisit: Array<{ name: string; lat: number; lng: number }>;
  style: 'cultural' | 'foodie' | 'familiar' | 'naturaleza' | 'express' | 'premium';
}

export interface AutopilotOutput {
  tripTitle: string;
  tripDescription: string;
  days: AutopilotDay[];
  totalDistance: number;
  totalDuration: number;
  estimatedCost: { min: number; max: number; currency: string };
  alternatives: AutopilotAlternative[];
  confidence: number; // 0-100
  warnings: string[];
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

export interface AutopilotStop {
  placeId: string;
  placeName: string;
  placeSlug: string;
  category: string;
  lat: number;
  lng: number;
  reason: string; // Why this stop was chosen
  suggestedDuration: number; // minutes
  suggestedArrival?: string;
  confidence: number;
  detourKm: number;
  highlights: string[];
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

export interface AutopilotFeedback {
  runId: string;
  type: 'thumbs_up' | 'thumbs_down' | 'adjust';
  message?: string;
  adjustments?: {
    removeCategories?: string[];
    addCategories?: string[];
    lessOfType?: string;
    moreOfType?: string;
    regenerateDay?: number;
  };
}

// ── Internal pipeline types ─────────────────────────────────────────────────

export interface CandidatePlace {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  latitude: number;
  longitude: number;
  state: string | null;
  categorySlug: string;
  categoryName: string;
  badges: string[] | null;
  budgetLevel: string | null;
  isFeatured: boolean;
  isSponsored: boolean;
  petFriendly: boolean | null;
  familyFriendly: boolean | null;
  richnessScore: number;
  confidenceScore: number;
  openingHours: unknown;
  primaryImageUrl: string | null;
  updatedAt: Date;
  // Computed during scoring
  score?: number;
  distanceFromRoute?: number;
}

export interface ScoringWeights {
  preferenceMatch: number;   // max 30
  qualityScore: number;      // max 25
  popularityScore: number;   // max 15
  detourPenalty: number;     // -20 to 0
  stalePenalty: number;      // -10 to 0
}

export type StyleKey = 'cultural' | 'foodie' | 'familiar' | 'naturaleza' | 'express' | 'premium';

export interface LLMItineraryResponse {
  tripTitle: string;
  tripDescription: string;
  days: Array<{
    dayNumber: number;
    title: string;
    description: string;
    stops: Array<{
      placeId: string;
      reason: string;
      suggestedDuration: number;
      suggestedArrival?: string;
      highlights: string[];
    }>;
  }>;
  estimatedCost: { min: number; max: number; currency: string };
  confidence: number;
  warnings: string[];
}
