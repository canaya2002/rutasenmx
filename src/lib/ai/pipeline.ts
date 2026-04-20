import { haversineDistance } from '@/lib/utils';
import { getAI } from '@/lib/providers/ai';
import { retrieveCandidates, filterByOpeningHours, ensureNoDuplicates } from './retrieval';
import { validateOutput } from './validation';
import { ITINERARY_SYSTEM_PROMPT, buildItineraryPrompt, REFINEMENT_PROMPT } from './prompts';
import type {
  AutopilotInput,
  AutopilotOutput,
  AutopilotDay,
  AutopilotStop,
  AutopilotAlternative,
  CandidatePlace,
  LLMItineraryResponse,
  StyleKey,
} from './types';

// ── Constants ───────────────────────────────────────────────────────────────

const AVG_SPEED_KM_H = 70; // Average speed on Mexican roads
const STOP_OVERHEAD_MINUTES = 15; // Time to park, walk, etc.

// Style definitions for alternatives
const STYLE_DEFINITIONS: Record<StyleKey, { label: string; description: string; preferredCategories: string[] }> = {
  cultural: {
    label: 'Cultural',
    description: 'Museos, zonas arqueologicas, centros historicos y patrimonio.',
    preferredCategories: ['museos', 'zonas-arqueologicas', 'sitios-inah', 'centros-historicos', 'haciendas'],
  },
  foodie: {
    label: 'Foodie',
    description: 'Mercados, comida regional, restaurantes y experiencias gastronomicas.',
    preferredCategories: ['mercados', 'restaurantes', 'cafeterias', 'comida-regional'],
  },
  familiar: {
    label: 'Familiar',
    description: 'Actividades para toda la familia, parques y balnearios.',
    preferredCategories: ['parques-tematicos', 'balnearios', 'playas', 'cenotes'],
  },
  naturaleza: {
    label: 'Naturaleza',
    description: 'Cascadas, bosques, cenotes, areas protegidas y senderismo.',
    preferredCategories: ['cascadas', 'bosques-sierras', 'areas-protegidas', 'cenotes', 'grutas', 'miradores'],
  },
  express: {
    label: 'Express',
    description: 'Lo esencial de la ruta, paradas rapidas y eficientes.',
    preferredCategories: ['pueblos-magicos', 'miradores', 'paradas-utiles'],
  },
  premium: {
    label: 'Premium',
    description: 'Experiencias exclusivas, vinedos, haciendas y tours privados.',
    preferredCategories: ['vinedos', 'haciendas', 'glamping', 'tours-guias'],
  },
};

// ── Main Pipeline ───────────────────────────────────────────────────────────

/**
 * Main AI pipeline orchestrator. Takes user input and produces a complete,
 * validated itinerary with alternatives.
 */
export async function generateItinerary(input: AutopilotInput): Promise<AutopilotOutput> {
  // Step 1: Retrieve candidates from DB
  const candidates = await retrieveCandidates(input);

  // Step 2: Pre-filter by constraints (opening hours, dates, etc.)
  const filtered = applyConstraints(candidates, input);

  // Step 3: Heuristic initial selection (greedy by day)
  const initial = buildInitialItinerary(filtered, input);

  // Step 4: LLM call to order, justify, and refine
  const refined = await llmRefine(initial, filtered, input);

  // Step 5: Deterministic validation
  const validated = await validateAndFix(refined, input);

  // Step 6: Generate alternatives
  const alternatives = generateAlternatives(validated, filtered, input);

  return { ...validated, alternatives };
}

// ── Step 2: Apply Constraints ───────────────────────────────────────────────

/**
 * Applies travel restrictions, date-based filtering, and accessibility constraints.
 */
function applyConstraints(
  candidates: CandidatePlace[],
  input: AutopilotInput,
): CandidatePlace[] {
  let filtered = [...candidates];

  // Filter by opening hours if dates are provided
  if (input.dates) {
    filtered = filterByOpeningHours(filtered, input.dates);
  }

  // If avoiding dirt roads, deprioritize remote natural areas
  if (input.restrictions.avoidDirtRoads) {
    filtered = filtered.map((p) => {
      const remoteCats = ['bosques-sierras', 'cascadas', 'grutas'];
      if (remoteCats.includes(p.categorySlug) && p.confidenceScore < 50) {
        return { ...p, score: (p.score ?? 0) * 0.5 };
      }
      return p;
    });
  }

  // If avoiding tolls, boost free/non-toll route places
  if (input.restrictions.avoidTolls) {
    filtered = filtered.filter((p) => p.categorySlug !== 'casetas');
  }

  // Re-sort after constraint adjustments
  filtered.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return filtered;
}

// ── Step 3: Heuristic Initial Itinerary ─────────────────────────────────────

/**
 * Greedy algorithm that assigns stops to days based on geographic proximity
 * and maximum driving hours. This is the "initial draft" before LLM refinement.
 */
function buildInitialItinerary(
  candidates: CandidatePlace[],
  input: AutopilotInput,
): AutopilotDay[] {
  const { origin, destination } = input;
  const maxDrivingMinutes = input.restrictions.maxDrivingHoursPerDay * 60;

  // Calculate number of days
  const daysCount = input.dates
    ? Math.ceil(
        (new Date(input.dates.end).getTime() - new Date(input.dates.start).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1
    : estimateDaysFromDistance(origin, destination, input);

  // Generate intermediate waypoints along the route for each day
  const dayWaypoints = generateDayWaypoints(origin, destination, daysCount);

  const days: AutopilotDay[] = [];
  const usedPlaceIds = new Set<string>();

  // Ensure must-visit places are included
  const mustVisitCandidates = findMustVisitCandidates(candidates, input.mustVisit);
  for (const mv of mustVisitCandidates) {
    usedPlaceIds.add(mv.id); // We'll assign these to appropriate days below
  }

  for (let dayIdx = 0; dayIdx < daysCount; dayIdx++) {
    const dayNumber = dayIdx + 1;
    const dayCenter = dayWaypoints[dayIdx];
    const nextCenter = dayIdx < daysCount - 1 ? dayWaypoints[dayIdx + 1] : destination;

    // Find candidates nearest to this day's segment
    const dayCandidates = candidates
      .filter((c) => !usedPlaceIds.has(c.id))
      .map((c) => ({
        ...c,
        dayDistance: haversineDistance(c.latitude, c.longitude, dayCenter.lat, dayCenter.lng),
      }))
      .sort((a, b) => a.dayDistance - b.dayDistance);

    // Assign must-visit places for this day segment
    const mustVisitsForDay = mustVisitCandidates.filter((mv) => {
      const distToDay = haversineDistance(mv.latitude, mv.longitude, dayCenter.lat, dayCenter.lng);
      const distToNext = haversineDistance(mv.latitude, mv.longitude, nextCenter.lat, nextCenter.lng);
      const segmentDist = haversineDistance(dayCenter.lat, dayCenter.lng, nextCenter.lat, nextCenter.lng);
      return distToDay < segmentDist * 0.8 && !days.some((d) => d.stops.some((s) => s.placeId === mv.id));
    });

    const stops: AutopilotStop[] = [];
    let totalDrivingMin = 0;
    let lastLat = dayCenter.lat;
    let lastLng = dayCenter.lng;

    // First add must-visit stops
    for (const mv of mustVisitsForDay) {
      const driveKm = haversineDistance(lastLat, lastLng, mv.latitude, mv.longitude);
      const driveMin = (driveKm / AVG_SPEED_KM_H) * 60;

      if (totalDrivingMin + driveMin <= maxDrivingMinutes) {
        stops.push(candidateToStop(mv, driveKm));
        totalDrivingMin += driveMin;
        lastLat = mv.latitude;
        lastLng = mv.longitude;
        usedPlaceIds.add(mv.id);
      }
    }

    // Then fill with scored candidates
    for (const candidate of dayCandidates) {
      if (usedPlaceIds.has(candidate.id)) continue;
      if (stops.length >= 5) break; // Max 5 stops per day in initial draft

      const driveKm = haversineDistance(lastLat, lastLng, candidate.latitude, candidate.longitude);
      const driveMin = (driveKm / AVG_SPEED_KM_H) * 60;

      if (totalDrivingMin + driveMin > maxDrivingMinutes) continue;

      stops.push(candidateToStop(candidate, driveKm));
      totalDrivingMin += driveMin;
      lastLat = candidate.latitude;
      lastLng = candidate.longitude;
      usedPlaceIds.add(candidate.id);
    }

    // Calculate driving to next day's start
    const driveToNextKm = haversineDistance(lastLat, lastLng, nextCenter.lat, nextCenter.lng);
    const driveToNextMin = (driveToNextKm / AVG_SPEED_KM_H) * 60;

    const date = input.dates
      ? new Date(new Date(input.dates.start).getTime() + dayIdx * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
      : undefined;

    days.push({
      dayNumber,
      date,
      title: `Dia ${dayNumber}`,
      description: '',
      stops,
      drivingMinutes: Math.round(totalDrivingMin + driveToNextMin),
      drivingKm: Math.round(
        stops.reduce((sum, s) => sum + s.detourKm, 0) + driveToNextKm,
      ),
    });
  }

  return days;
}

// ── Step 4: LLM Refinement ──────────────────────────────────────────────────

/**
 * Calls the AI provider to reorder stops, add justifications, write descriptions,
 * and refine the initial itinerary.
 */
async function llmRefine(
  initial: AutopilotDay[],
  candidates: CandidatePlace[],
  input: AutopilotInput,
): Promise<AutopilotOutput> {
  const prompt = buildItineraryPrompt(candidates, input);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.AI_MODEL ?? 'claude-haiku-4-5-20251001';
  const baseUrl = process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com';

  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: ITINERARY_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('LLM API error:', errorText);
    // Fallback to the heuristic itinerary
    return buildFallbackOutput(initial, input);
  }

  const data = await response.json();
  const content = data.content?.[0];

  if (!content || content.type !== 'text') {
    return buildFallbackOutput(initial, input);
  }

  try {
    const cleaned = content.text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const llmResponse: LLMItineraryResponse = JSON.parse(cleaned);
    return mapLLMResponseToOutput(llmResponse, initial, candidates, input);
  } catch (err) {
    console.error('Failed to parse LLM response:', err);
    return buildFallbackOutput(initial, input);
  }
}

// ── Step 5: Validation & Fix ────────────────────────────────────────────────

/**
 * Runs deterministic validation and attempts to fix minor issues.
 */
async function validateAndFix(
  output: AutopilotOutput,
  input: AutopilotInput,
): Promise<AutopilotOutput> {
  const result = await validateOutput(output, input);

  if (result.valid) {
    return {
      ...output,
      warnings: [...output.warnings, ...result.warnings.map((w) => w.message)],
    };
  }

  // Attempt to fix issues
  let fixed = { ...output };

  for (const error of result.errors) {
    switch (error.code) {
      case 'DUPLICATE_PLACE': {
        // Remove the duplicate from the later day
        fixed = removeDuplicateStop(fixed, error.placeId!, error.dayNumber!);
        break;
      }
      case 'PLACE_NOT_FOUND': {
        // Remove the non-existent stop
        fixed = removeStopById(fixed, error.placeId!);
        break;
      }
      case 'EXCEEDS_MAX_DRIVING': {
        // Remove the last stop of the offending day
        fixed = trimLastStop(fixed, error.dayNumber!);
        break;
      }
      case 'ABSURD_DETOUR': {
        // Remove the detoured stop
        fixed = removeStopById(fixed, error.placeId!);
        break;
      }
      default:
        // Can't auto-fix, add to warnings
        fixed.warnings.push(error.message);
    }
  }

  // Add validation warnings
  fixed.warnings = [
    ...fixed.warnings,
    ...result.warnings.map((w) => w.message),
  ];

  return fixed;
}

// ── Step 6: Generate Alternatives ───────────────────────────────────────────

/**
 * Creates alternative itinerary suggestions for different travel styles.
 */
function generateAlternatives(
  output: AutopilotOutput,
  candidates: CandidatePlace[],
  input: AutopilotInput,
): AutopilotAlternative[] {
  const alternatives: AutopilotAlternative[] = [];
  const usedPlaceIds = new Set(
    output.days.flatMap((d) => d.stops.map((s) => s.placeId)),
  );

  const styleKeys: StyleKey[] = ['cultural', 'foodie', 'familiar', 'naturaleza', 'express', 'premium'];

  for (const styleKey of styleKeys) {
    // Skip the style that was already used
    if (styleKey === input.style) continue;

    const styleDef = STYLE_DEFINITIONS[styleKey];
    const styleCategories = new Set(styleDef.preferredCategories);

    // Find unused candidates that match this style
    const styleCandidates = candidates
      .filter((c) => !usedPlaceIds.has(c.id) && styleCategories.has(c.categorySlug))
      .slice(0, 15);

    if (styleCandidates.length === 0) continue;

    const replacements: AutopilotAlternative['replacements'] = [];

    for (const day of output.days) {
      // Find stops in this day that don't match the alternative style
      const removable = day.stops.filter((s) => !styleCategories.has(s.category));
      if (removable.length === 0) continue;

      // Find style candidates near this day's stops
      const dayLat = day.stops[0]?.lat ?? 0;
      const dayLng = day.stops[0]?.lng ?? 0;

      const nearbyStylePlaces = styleCandidates
        .map((c) => ({
          ...c,
          dist: haversineDistance(c.latitude, c.longitude, dayLat, dayLng),
        }))
        .filter((c) => c.dist < 80)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 2);

      if (nearbyStylePlaces.length > 0) {
        replacements.push({
          dayNumber: day.dayNumber,
          remove: removable.slice(0, nearbyStylePlaces.length).map((s) => s.placeId),
          add: nearbyStylePlaces.map((c) => candidateToStop(c, c.dist)),
        });
      }
    }

    if (replacements.length > 0) {
      alternatives.push({
        style: styleDef.label,
        description: styleDef.description,
        replacements,
      });
    }
  }

  return alternatives;
}

// ── Helper functions ────────────────────────────────────────────────────────

function candidateToStop(candidate: CandidatePlace, detourKm: number): AutopilotStop {
  return {
    placeId: candidate.id,
    placeName: candidate.name,
    placeSlug: candidate.slug,
    category: candidate.categorySlug,
    lat: candidate.latitude,
    lng: candidate.longitude,
    reason: '',
    suggestedDuration: estimateStopDuration(candidate.categorySlug),
    confidence: Math.min(100, Math.round((candidate.score ?? 50) * 1.5)),
    detourKm: Math.round(detourKm * 10) / 10,
    highlights: [],
  };
}

function estimateStopDuration(categorySlug: string): number {
  const durations: Record<string, number> = {
    'pueblos-magicos': 120,
    'museos': 90,
    'zonas-arqueologicas': 150,
    'sitios-inah': 90,
    'centros-historicos': 90,
    'haciendas': 60,
    'playas': 180,
    'cenotes': 90,
    'cascadas': 60,
    'bosques-sierras': 120,
    'areas-protegidas': 120,
    'vinedos': 90,
    'turismo-comunitario': 90,
    'mercados': 60,
    'restaurantes': 75,
    'cafeterias': 30,
    'comida-regional': 60,
    'hoteles': 30,
    'cabanas': 30,
    'glamping': 30,
    'campings': 30,
    'balnearios': 180,
    'grutas': 60,
    'parques-tematicos': 240,
    'eventos-festivales': 120,
    'gasolineras': 15,
    'casetas': 5,
    'paradas-utiles': 20,
    'talleres-auxilio': 15,
    'tours-guias': 180,
    'miradores': 30,
  };

  return durations[categorySlug] ?? 60;
}

function estimateDaysFromDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  input: AutopilotInput,
): number {
  const distKm = haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
  const paceMultiplier = { relajado: 1.6, moderado: 1.3, intenso: 1.0 };
  const avgKmPerDay = input.restrictions.maxDrivingHoursPerDay * AVG_SPEED_KM_H;
  const rawDays = distKm / avgKmPerDay;

  return Math.max(2, Math.ceil(rawDays * paceMultiplier[input.pace]));
}

function generateDayWaypoints(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  daysCount: number,
): Array<{ lat: number; lng: number }> {
  const waypoints: Array<{ lat: number; lng: number }> = [];

  for (let i = 0; i < daysCount; i++) {
    const t = i / Math.max(1, daysCount - 1);
    waypoints.push({
      lat: origin.lat + t * (destination.lat - origin.lat),
      lng: origin.lng + t * (destination.lng - origin.lng),
    });
  }

  return waypoints;
}

function findMustVisitCandidates(
  candidates: CandidatePlace[],
  mustVisit: Array<{ name: string; lat: number; lng: number }>,
): CandidatePlace[] {
  const result: CandidatePlace[] = [];

  for (const mv of mustVisit) {
    // Find the closest candidate to the must-visit location
    let closest: CandidatePlace | null = null;
    let minDist = Infinity;

    for (const c of candidates) {
      const dist = haversineDistance(c.latitude, c.longitude, mv.lat, mv.lng);
      if (dist < minDist && dist < 10) {
        // Within 10 km
        closest = c;
        minDist = dist;
      }
    }

    if (closest) {
      result.push(closest);
    }
  }

  return result;
}

function mapLLMResponseToOutput(
  llm: LLMItineraryResponse,
  initial: AutopilotDay[],
  candidates: CandidatePlace[],
  input: AutopilotInput,
): AutopilotOutput {
  const candidateMap = new Map(candidates.map((c) => [c.id, c]));

  const days: AutopilotDay[] = llm.days.map((llmDay, idx) => {
    const initialDay = initial[idx];

    const stops: AutopilotStop[] = llmDay.stops.map((llmStop) => {
      const candidate = candidateMap.get(llmStop.placeId);

      if (!candidate) {
        // If the LLM referenced a place not in our candidates, try to find it
        const fallbackStop = initialDay?.stops.find((s) => s.placeId === llmStop.placeId);
        if (fallbackStop) {
          return {
            ...fallbackStop,
            reason: llmStop.reason ?? fallbackStop.reason,
            suggestedDuration: llmStop.suggestedDuration ?? fallbackStop.suggestedDuration,
            suggestedArrival: llmStop.suggestedArrival,
            highlights: llmStop.highlights ?? fallbackStop.highlights,
          };
        }

        // Last resort: create a minimal stop
        return {
          placeId: llmStop.placeId,
          placeName: 'Lugar desconocido',
          placeSlug: 'desconocido',
          category: 'desconocido',
          lat: 0,
          lng: 0,
          reason: llmStop.reason ?? '',
          suggestedDuration: llmStop.suggestedDuration ?? 60,
          suggestedArrival: llmStop.suggestedArrival,
          confidence: 20,
          detourKm: 0,
          highlights: llmStop.highlights ?? [],
        };
      }

      return {
        placeId: candidate.id,
        placeName: candidate.name,
        placeSlug: candidate.slug,
        category: candidate.categorySlug,
        lat: candidate.latitude,
        lng: candidate.longitude,
        reason: llmStop.reason ?? '',
        suggestedDuration: llmStop.suggestedDuration ?? estimateStopDuration(candidate.categorySlug),
        suggestedArrival: llmStop.suggestedArrival,
        confidence: Math.min(100, Math.round((candidate.score ?? 50) * 1.5)),
        detourKm: candidate.distanceFromRoute ?? 0,
        highlights: llmStop.highlights ?? [],
      };
    });

    // Calculate driving metrics from stops
    const drivingKm = calculateDayDrivingKm(stops, input);
    const drivingMinutes = Math.round((drivingKm / AVG_SPEED_KM_H) * 60);

    const date = input.dates
      ? new Date(new Date(input.dates.start).getTime() + idx * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
      : undefined;

    return {
      dayNumber: llmDay.dayNumber,
      date,
      title: llmDay.title,
      description: llmDay.description,
      stops,
      drivingMinutes,
      drivingKm: Math.round(drivingKm),
    };
  });

  const totalDistance = days.reduce((sum, d) => sum + d.drivingKm, 0);
  const totalDuration = days.reduce((sum, d) => sum + d.drivingMinutes, 0);

  return {
    tripTitle: llm.tripTitle,
    tripDescription: llm.tripDescription,
    days,
    totalDistance,
    totalDuration,
    estimatedCost: llm.estimatedCost ?? { min: 0, max: 0, currency: 'MXN' },
    alternatives: [],
    confidence: llm.confidence ?? 70,
    warnings: llm.warnings ?? [],
  };
}

function calculateDayDrivingKm(
  stops: AutopilotStop[],
  input: AutopilotInput,
): number {
  if (stops.length === 0) return 0;

  let totalKm = 0;

  for (let i = 1; i < stops.length; i++) {
    totalKm += haversineDistance(
      stops[i - 1].lat,
      stops[i - 1].lng,
      stops[i].lat,
      stops[i].lng,
    );
  }

  // Add distance from day start and to day end (approximate as 20% overhead)
  totalKm *= 1.2;

  return totalKm;
}

function buildFallbackOutput(
  initial: AutopilotDay[],
  input: AutopilotInput,
): AutopilotOutput {
  const totalDistance = initial.reduce((sum, d) => sum + d.drivingKm, 0);
  const totalDuration = initial.reduce((sum, d) => sum + d.drivingMinutes, 0);

  // Estimate costs based on budget
  const budgetPerDay: Record<string, { min: number; max: number }> = {
    economico: { min: 400, max: 800 },
    moderado: { min: 1000, max: 2500 },
    premium: { min: 3000, max: 6000 },
    lujo: { min: 6000, max: 15000 },
  };

  const perDay = budgetPerDay[input.budget] ?? budgetPerDay.moderado;
  const daysCount = initial.length;

  return {
    tripTitle: `Ruta de ${input.origin.name} a ${input.destination.name}`,
    tripDescription: `Itinerario de ${daysCount} dias recorriendo Mexico de ${input.origin.name} a ${input.destination.name}. Generado con nuestro sistema de recomendaciones.`,
    days: initial.map((day) => ({
      ...day,
      title: day.title || `Dia ${day.dayNumber}`,
      description: day.description || `Jornada ${day.dayNumber} de tu viaje.`,
    })),
    totalDistance,
    totalDuration,
    estimatedCost: {
      min: perDay.min * daysCount,
      max: perDay.max * daysCount,
      currency: 'MXN',
    },
    alternatives: [],
    confidence: 50,
    warnings: [
      'Este itinerario fue generado con nuestro algoritmo heuristico. Las descripciones y justificaciones se generaran cuando el servicio de IA este disponible.',
    ],
  };
}

// ── Fix helpers ─────────────────────────────────────────────────────────────

function removeDuplicateStop(output: AutopilotOutput, placeId: string, dayNumber: number): AutopilotOutput {
  return {
    ...output,
    days: output.days.map((day) => {
      if (day.dayNumber !== dayNumber) return day;
      return {
        ...day,
        stops: day.stops.filter((s) => s.placeId !== placeId),
      };
    }),
  };
}

function removeStopById(output: AutopilotOutput, placeId: string): AutopilotOutput {
  return {
    ...output,
    days: output.days.map((day) => ({
      ...day,
      stops: day.stops.filter((s) => s.placeId !== placeId),
    })),
  };
}

function trimLastStop(output: AutopilotOutput, dayNumber: number): AutopilotOutput {
  return {
    ...output,
    days: output.days.map((day) => {
      if (day.dayNumber !== dayNumber) return day;
      return {
        ...day,
        stops: day.stops.slice(0, -1),
      };
    }),
  };
}
