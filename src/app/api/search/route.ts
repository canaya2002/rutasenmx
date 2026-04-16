import { type NextRequest, NextResponse } from 'next/server';
import { mockPlaces, mockStates, mockRoutes } from '@/lib/data/mock';

// TODO: Switch to DB-level full-text search once Drizzle connection is ready
// import { db, places } from '@/db';
// import { ilike, or } from 'drizzle-orm';

/**
 * GET /api/search?q=...
 *
 * Unified search across places, states, and routes.
 * Returns up to 20 results grouped by type.
 */
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json(
        { error: 'El parametro "q" es requerido (minimo 2 caracteres)' },
        { status: 400 },
      );
    }

    const query = q.toLowerCase();

    // Search places by name and description
    const placeResults = mockPlaces
      .filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.stateName.toLowerCase().includes(query),
      )
      .slice(0, 10)
      .map((p) => ({
        type: 'place' as const,
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        category: p.category,
        stateName: p.stateName,
        image: p.image,
      }));

    // Search states by name
    const stateResults = mockStates
      .filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query),
      )
      .slice(0, 5)
      .map((s) => ({
        type: 'state' as const,
        slug: s.slug,
        name: s.name,
        description: s.description,
        image: s.image,
      }));

    // Search routes by name
    const routeResults = mockRoutes
      .filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.origin.toLowerCase().includes(query) ||
          r.destination.toLowerCase().includes(query),
      )
      .slice(0, 5)
      .map((r) => ({
        type: 'route' as const,
        id: r.id,
        slug: r.slug,
        name: r.name,
        description: r.description,
        image: r.image,
      }));

    const results = [...placeResults, ...stateResults, ...routeResults];

    return NextResponse.json({
      results,
      total: results.length,
      query: q,
    });
  } catch (error) {
    console.error('Error en GET /api/search:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
