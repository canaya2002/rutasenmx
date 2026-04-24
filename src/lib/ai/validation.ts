import { db } from '@/db';
import { places } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import type { AutopilotOutput, AutopilotDay, AutopilotInput } from './types';

// ── Constants ───────────────────────────────────────────────────────────────

const MAX_DETOUR_KM = 100;
const MAX_STOPS_PER_DAY = 8;
const MIN_STOP_DURATION_MINUTES = 10;
const MAX_STOP_DURATION_MINUTES = 480; // 8 hours

const BUDGET_COST_RANGES_MXN: Record<string, { minPerDay: number; maxPerDay: number }> = {
  economico: { minPerDay: 300, maxPerDay: 1200 },
  moderado: { minPerDay: 800, maxPerDay: 3500 },
  premium: { minPerDay: 2500, maxPerDay: 8000 },
  lujo: { minPerDay: 5000, maxPerDay: 25000 },
};

// ── Validation result types ─────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  dayNumber?: number;
  placeId?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  dayNumber?: number;
}

// ── Master validator ────────────────────────────────────────────────────────

/**
 * Runs all validation checks on an AutopilotOutput and returns a combined result.
 * If critical errors are found, the itinerary should not be shown to the user.
 */
export async function validateOutput(
  output: AutopilotOutput,
  input: AutopilotInput,
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. Structural validation
  const structureResult = validateItinerary(output);
  errors.push(...structureResult.errors);
  warnings.push(...structureResult.warnings);

  // 2. Verify stops exist in DB
  const existResult = await validateStopsExist(output.days);
  errors.push(...existResult.errors);
  warnings.push(...existResult.warnings);

  // 3. No duplicate places
  const dupResult = validateNoDuplicates(output.days);
  errors.push(...dupResult.errors);
  warnings.push(...dupResult.warnings);

  // 4. Driving times within limits
  const drivingResult = validateDrivingTimes(output.days, input.restrictions.maxDrivingHoursPerDay);
  errors.push(...drivingResult.errors);
  warnings.push(...drivingResult.warnings);

  // 5. No absurd detours
  const detourResult = validateDetours(output.days, input.origin, input.destination);
  errors.push(...detourResult.errors);
  warnings.push(...detourResult.warnings);

  // 6. Budget alignment
  const budgetResult = validateBudget(output, input.budget);
  errors.push(...budgetResult.errors);
  warnings.push(...budgetResult.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ── Individual validators ───────────────────────────────────────────────────

/**
 * Validates the structural integrity of the output.
 */
export function validateItinerary(output: AutopilotOutput): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!output.tripTitle || output.tripTitle.trim().length === 0) {
    errors.push({ code: 'MISSING_TITLE', message: 'El itinerario no tiene titulo.' });
  }

  if (!output.tripDescription || output.tripDescription.trim().length === 0) {
    warnings.push({ code: 'MISSING_DESCRIPTION', message: 'El itinerario no tiene descripcion.' });
  }

  if (!output.days || output.days.length === 0) {
    errors.push({ code: 'NO_DAYS', message: 'El itinerario no tiene dias.' });
    return { valid: false, errors, warnings };
  }

  // Check day numbering is sequential
  for (let i = 0; i < output.days.length; i++) {
    const day = output.days[i];

    if (day.dayNumber !== i + 1) {
      warnings.push({
        code: 'DAY_NUMBERING',
        message: `Dia ${i + 1} tiene dayNumber=${day.dayNumber}, se espera ${i + 1}.`,
        dayNumber: i + 1,
      });
    }

    if (!day.title || day.title.trim().length === 0) {
      warnings.push({
        code: 'DAY_MISSING_TITLE',
        message: `Dia ${day.dayNumber} no tiene titulo.`,
        dayNumber: day.dayNumber,
      });
    }

    if (!day.stops || day.stops.length === 0) {
      errors.push({
        code: 'DAY_NO_STOPS',
        message: `Dia ${day.dayNumber} no tiene paradas.`,
        dayNumber: day.dayNumber,
      });
    }

    if (day.stops && day.stops.length > MAX_STOPS_PER_DAY) {
      warnings.push({
        code: 'TOO_MANY_STOPS',
        message: `Dia ${day.dayNumber} tiene ${day.stops.length} paradas (maximo recomendado: ${MAX_STOPS_PER_DAY}).`,
        dayNumber: day.dayNumber,
      });
    }

    // Validate individual stops
    for (const stop of day.stops ?? []) {
      if (!stop.placeId) {
        errors.push({
          code: 'STOP_NO_ID',
          message: `Una parada en dia ${day.dayNumber} no tiene placeId.`,
          dayNumber: day.dayNumber,
        });
      }

      if (stop.suggestedDuration < MIN_STOP_DURATION_MINUTES) {
        warnings.push({
          code: 'SHORT_DURATION',
          message: `${stop.placeName} en dia ${day.dayNumber} tiene duracion de ${stop.suggestedDuration} min (muy corta).`,
          dayNumber: day.dayNumber,
        });
      }

      if (stop.suggestedDuration > MAX_STOP_DURATION_MINUTES) {
        warnings.push({
          code: 'LONG_DURATION',
          message: `${stop.placeName} en dia ${day.dayNumber} tiene duracion de ${stop.suggestedDuration} min (muy larga).`,
          dayNumber: day.dayNumber,
        });
      }
    }
  }

  // Check confidence
  if (output.confidence < 30) {
    warnings.push({
      code: 'LOW_CONFIDENCE',
      message: `La confianza del itinerario es baja (${output.confidence}%). Puede necesitar ajustes.`,
    });
  }

  // Check total distance is reasonable
  if (output.totalDistance <= 0) {
    warnings.push({
      code: 'INVALID_DISTANCE',
      message: 'La distancia total calculada es 0 o negativa.',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Verifies all place IDs in the itinerary actually exist in the database.
 */
export async function validateStopsExist(
  days: AutopilotDay[],
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const allPlaceIds = days
    .flatMap((d) => d.stops)
    .map((s) => s.placeId)
    .filter(Boolean);

  if (allPlaceIds.length === 0) {
    return { valid: true, errors, warnings };
  }

  // Deduplicate
  const uniqueIds = [...new Set(allPlaceIds)];

  const existingPlaces = await db
    .select({ id: places.id })
    .from(places)
    .where(inArray(places.id, uniqueIds));

  const existingIds = new Set(existingPlaces.map((p) => p.id));

  for (const day of days) {
    for (const stop of day.stops) {
      if (stop.placeId && !existingIds.has(stop.placeId)) {
        errors.push({
          code: 'PLACE_NOT_FOUND',
          message: `Lugar "${stop.placeName}" (${stop.placeId}) no existe en la base de datos.`,
          dayNumber: day.dayNumber,
          placeId: stop.placeId,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Ensures no place appears more than once across all days.
 */
export function validateNoDuplicates(days: AutopilotDay[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const seen = new Map<string, number>();

  for (const day of days) {
    for (const stop of day.stops) {
      if (!stop.placeId) continue;

      const previousDay = seen.get(stop.placeId);
      if (previousDay !== undefined) {
        errors.push({
          code: 'DUPLICATE_PLACE',
          message: `"${stop.placeName}" aparece en dia ${previousDay} y dia ${day.dayNumber}.`,
          dayNumber: day.dayNumber,
          placeId: stop.placeId,
        });
      } else {
        seen.set(stop.placeId, day.dayNumber);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates that no day exceeds the maximum driving hours.
 */
export function validateDrivingTimes(
  days: AutopilotDay[],
  maxHoursPerDay: number,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const maxMinutes = maxHoursPerDay * 60;

  for (const day of days) {
    if (day.drivingMinutes > maxMinutes) {
      const hours = (day.drivingMinutes / 60).toFixed(1);
      errors.push({
        code: 'EXCEEDS_MAX_DRIVING',
        message: `Dia ${day.dayNumber}: ${hours}h de manejo excede el maximo de ${maxHoursPerDay}h.`,
        dayNumber: day.dayNumber,
      });
    }

    // Warn if close to the limit (>80%)
    if (day.drivingMinutes > maxMinutes * 0.8 && day.drivingMinutes <= maxMinutes) {
      const hours = (day.drivingMinutes / 60).toFixed(1);
      warnings.push({
        code: 'HIGH_DRIVING_TIME',
        message: `Dia ${day.dayNumber}: ${hours}h de manejo, cerca del limite de ${maxHoursPerDay}h.`,
        dayNumber: day.dayNumber,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates that no stop is absurdly far from the route corridor.
 */
export function validateDetours(
  days: AutopilotDay[],
  _origin: { lat: number; lng: number },
  _destination: { lat: number; lng: number },
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const day of days) {
    for (const stop of day.stops) {
      if (stop.detourKm > MAX_DETOUR_KM) {
        errors.push({
          code: 'ABSURD_DETOUR',
          message: `"${stop.placeName}" en dia ${day.dayNumber} requiere un desvio de ${stop.detourKm.toFixed(0)} km (maximo: ${MAX_DETOUR_KM} km).`,
          dayNumber: day.dayNumber,
          placeId: stop.placeId,
        });
      }

      if (stop.detourKm > MAX_DETOUR_KM * 0.6 && stop.detourKm <= MAX_DETOUR_KM) {
        warnings.push({
          code: 'LARGE_DETOUR',
          message: `"${stop.placeName}" en dia ${day.dayNumber} tiene un desvio considerable de ${stop.detourKm.toFixed(0)} km.`,
          dayNumber: day.dayNumber,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates that the estimated costs are reasonable for the selected budget level.
 */
export function validateBudget(
  output: AutopilotOutput,
  budget: string,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const ranges = BUDGET_COST_RANGES_MXN[budget];
  if (!ranges) return { valid: true, errors, warnings };

  const daysCount = output.days.length;
  const expectedMin = ranges.minPerDay * daysCount;
  const expectedMax = ranges.maxPerDay * daysCount;

  if (output.estimatedCost.max < expectedMin * 0.5) {
    warnings.push({
      code: 'BUDGET_TOO_LOW',
      message: `El costo estimado ($${output.estimatedCost.max} MXN) parece bajo para presupuesto "${budget}" (${daysCount} dias).`,
    });
  }

  if (output.estimatedCost.min > expectedMax * 1.5) {
    warnings.push({
      code: 'BUDGET_TOO_HIGH',
      message: `El costo estimado ($${output.estimatedCost.min} MXN minimo) excede lo esperado para presupuesto "${budget}".`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
