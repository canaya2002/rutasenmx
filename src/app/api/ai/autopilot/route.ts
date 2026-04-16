import { type NextRequest, NextResponse } from 'next/server';
import { generateItinerary } from '@/lib/ai/pipeline';
import type { AutopilotInput } from '@/lib/ai/types';

/**
 * POST /api/ai/autopilot
 *
 * Generates an AI-powered trip itinerary.
 *
 * Body (AutopilotInput):
 *   origin        – { name, lat, lng }
 *   destination   – { name, lat, lng }
 *   dates?        – { start, end } ISO date strings
 *   interests     – string[] of category slugs
 *   budget        – "economico" | "moderado" | "premium" | "lujo"
 *   style         – "cultural" | "foodie" | "familiar" | "naturaleza" | "express" | "premium"
 *   pace          – "relajado" | "moderado" | "intenso"
 *   travelers     – { type, count, hasChildren, hasPets }
 *   restrictions  – { avoidTolls, avoidHighways, avoidDirtRoads, avoidFerries, maxDrivingHoursPerDay }
 *   mustVisit     – Array<{ name, lat, lng }>
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.origin?.lat || !body.origin?.lng) {
      return NextResponse.json(
        { error: 'Se requiere un origen con coordenadas (lat, lng)' },
        { status: 400 },
      );
    }

    if (!body.destination?.lat || !body.destination?.lng) {
      return NextResponse.json(
        { error: 'Se requiere un destino con coordenadas (lat, lng)' },
        { status: 400 },
      );
    }

    // Build input with defaults
    const input: AutopilotInput = {
      origin: {
        name: body.origin.name ?? 'Origen',
        lat: body.origin.lat,
        lng: body.origin.lng,
      },
      destination: {
        name: body.destination.name ?? 'Destino',
        lat: body.destination.lat,
        lng: body.destination.lng,
      },
      dates: body.dates ?? undefined,
      pace: body.pace ?? 'moderado',
      travelers: {
        type: body.travelers?.type ?? 'pareja',
        count: body.travelers?.count ?? 2,
        hasChildren: body.travelers?.hasChildren ?? false,
        hasPets: body.travelers?.hasPets ?? false,
      },
      budget: body.budget ?? 'moderado',
      interests: body.interests ?? [],
      restrictions: {
        avoidTolls: body.avoidTolls ?? body.restrictions?.avoidTolls ?? false,
        avoidHighways: body.restrictions?.avoidHighways ?? false,
        avoidDirtRoads: body.restrictions?.avoidDirtRoads ?? false,
        avoidFerries: body.restrictions?.avoidFerries ?? false,
        maxDrivingHoursPerDay: body.restrictions?.maxDrivingHoursPerDay ?? 6,
      },
      mustVisit: body.mustVisit ?? [],
      style: body.travelStyle ?? body.style ?? 'cultural',
    };

    const itinerary = await generateItinerary(input);

    return NextResponse.json({ itinerary });
  } catch (error) {
    console.error('Error en POST /api/ai/autopilot:', error);

    // Return a more descriptive error if it's an AI provider issue
    const message =
      error instanceof Error && error.message.includes('API')
        ? 'Error al conectar con el servicio de IA. Intenta de nuevo.'
        : 'Error interno del servidor';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
