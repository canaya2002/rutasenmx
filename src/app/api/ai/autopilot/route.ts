import { type NextRequest, NextResponse } from 'next/server';
import { generateItinerary } from '@/lib/ai/pipeline';
import {
  findCachedItinerary,
  hashAutopilotInput,
  saveCachedItinerary,
  countRunsForUserThisMonth,
} from '@/lib/ai/cache';
import { getSession } from '@/lib/auth/session';
import { canAccess } from '@/lib/subscription/plans';
import type { AutopilotInput } from '@/lib/ai/types';
import type { PlanSlug } from '@/lib/subscription/plans';

const MONTHLY_LIMITS: Record<PlanSlug, number> = {
  free: 0,
  basic: 0,
  pro: 0,
  premium: 20,
};

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
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para usar Autopilot' },
        { status: 401 },
      );
    }

    if (!canAccess(session.plan, 'ai_autopilot')) {
      return NextResponse.json(
        {
          error: 'Autopilot está disponible solo en el plan Premium',
          upgradeRequired: 'premium',
        },
        { status: 403 },
      );
    }

    const monthlyLimit = MONTHLY_LIMITS[session.plan];
    const used = await countRunsForUserThisMonth(session.userId);
    if (used >= monthlyLimit) {
      return NextResponse.json(
        {
          error: `Alcanzaste el límite mensual de ${monthlyLimit} itinerarios de Autopilot`,
          limit: monthlyLimit,
          used,
        },
        { status: 429 },
      );
    }

    const body = await request.json();

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

    const inputHash = hashAutopilotInput(input);

    const cached = await findCachedItinerary(inputHash);
    if (cached) {
      return NextResponse.json({ itinerary: cached, cached: true });
    }

    const itinerary = await generateItinerary(input);

    await saveCachedItinerary({
      userId: session.userId,
      inputParams: input,
      inputHash,
      result: itinerary,
      modelUsed:
        process.env.AI_MODEL ?? 'claude-haiku-4-5-20251001',
    });

    return NextResponse.json({ itinerary, cached: false });
  } catch (error) {
    console.error('Error en POST /api/ai/autopilot:', error);

    const message =
      error instanceof Error && error.message.includes('API')
        ? 'Error al conectar con el servicio de IA. Intenta de nuevo.'
        : 'Error interno del servidor';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
