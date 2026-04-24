import { NextResponse } from 'next/server';
import { mockRoutes, mockPlaces } from '@/lib/data/mock';

/**
 * GET /api/routes/[slug]
 *
 * Returns a single curated route with its stops joined to their underlying
 * place records (image, state, etc.) so clients can render the stop list
 * without a separate round-trip per stop.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const route = mockRoutes.find((r) => r.slug === slug);

    if (!route) {
      return NextResponse.json(
        { error: 'Ruta no encontrada' },
        { status: 404 },
      );
    }

    // Enrich each stop with the place metadata we already know about, so the
    // mobile app only needs this one call to render the full route detail.
    const enrichedStops = route.stops.map((stop) => {
      const place = mockPlaces.find((p) => p.slug === stop.placeSlug);
      return {
        ...stop,
        lat: stop.lat ?? place?.lat ?? null,
        lng: stop.lng ?? place?.lng ?? null,
        image: place?.image ?? null,
        stateName: place?.stateName ?? null,
        category: place?.category ?? null,
      };
    });

    return NextResponse.json(
      { route: { ...route, stops: enrichedStops } },
      {
        headers: {
          'Cache-Control':
            'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
        },
      },
    );
  } catch (error) {
    console.error('Error en GET /api/routes/[slug]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
