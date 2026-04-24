import { type NextRequest, NextResponse } from 'next/server';
import { mockRoutes } from '@/lib/data/mock';

/**
 * GET /api/routes
 *
 * Public, read-only listing of curated routes.
 *
 * Query params:
 *   difficulty – 'facil' | 'moderada' | 'avanzada'
 *   state      – filter by state slug (matches when state is in statesSlugs)
 *   search     – text search (name / origin / destination / description)
 *   limit      – page size (default 20, max 100)
 *   offset     – default 0
 *
 * Cached at the edge for 5 minutes — routes are editorial, they change rarely.
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const difficulty = params.get('difficulty');
    const state = params.get('state');
    const search = params.get('search');
    const limit = Math.min(
      Math.max(parseInt(params.get('limit') ?? '20', 10) || 20, 1),
      100,
    );
    const offset = Math.max(
      parseInt(params.get('offset') ?? '0', 10) || 0,
      0,
    );

    let filtered = [...mockRoutes];

    if (difficulty && ['facil', 'moderada', 'avanzada'].includes(difficulty)) {
      filtered = filtered.filter((r) => r.difficulty === difficulty);
    }
    if (state) {
      filtered = filtered.filter((r) => r.statesSlugs.includes(state));
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.origin.toLowerCase().includes(q) ||
          r.destination.toLowerCase().includes(q),
      );
    }

    const total = filtered.length;
    const routes = filtered.slice(offset, offset + limit);

    return NextResponse.json(
      { routes, total, limit, offset },
      {
        headers: {
          'Cache-Control':
            'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
        },
      },
    );
  } catch (error) {
    console.error('Error en GET /api/routes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
