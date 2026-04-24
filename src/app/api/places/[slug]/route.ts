import { NextResponse } from 'next/server';
import { mockPlaces } from '@/lib/data/mock';

/**
 * GET /api/places/[slug]
 *
 * Returns full place data for a given slug. Backed by the static editorial
 * catalog in `src/lib/data/mock.ts` (merged with `real-places.ts`). This is
 * intentional — catalog content is editorial + stable, so static is faster
 * (edge-cacheable) and cheaper (no DB hit) than Postgres. If you ever
 * migrate to DB, swap the `mockPlaces.find(...)` call for a Drizzle query
 * with `eq(places.slug, slug)`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const place = mockPlaces.find((p) => p.slug === slug);

    if (!place) {
      return NextResponse.json(
        { error: 'Lugar no encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json({ place });
  } catch (error) {
    console.error('Error en GET /api/places/[slug]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
