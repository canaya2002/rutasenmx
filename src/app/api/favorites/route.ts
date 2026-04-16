import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { mockPlaces } from '@/lib/data/mock';

// TODO: Switch to DB queries once Drizzle connection is ready
// import { db, favorites, places } from '@/db';
// import { eq, and } from 'drizzle-orm';

/**
 * GET /api/favorites
 *
 * Returns the authenticated user's favorite places.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 },
      );
    }

    // TODO: Replace with DB query joining favorites + places
    // const userFavorites = await db
    //   .select({ place: places })
    //   .from(favorites)
    //   .innerJoin(places, eq(favorites.placeId, places.id))
    //   .where(eq(favorites.userId, session.userId));

    // Mock: return a small subset of places as favorites
    const mockFavorites = mockPlaces.slice(0, 3).map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      categoryName: p.categoryName,
      stateName: p.stateName,
      image: p.image,
      description: p.description,
      addedAt: '2026-04-01T10:00:00Z',
    }));

    return NextResponse.json({
      favorites: mockFavorites,
      total: mockFavorites.length,
    });
  } catch (error) {
    console.error('Error en GET /api/favorites:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/favorites
 *
 * Adds a place to the user's favorites.
 *
 * Body:
 *   placeId – ID of the place to favorite
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 },
      );
    }

    const body = await request.json();

    if (!body.placeId) {
      return NextResponse.json(
        { error: 'Se requiere placeId' },
        { status: 400 },
      );
    }

    // Validate the place exists
    const place = mockPlaces.find((p) => p.id === body.placeId);
    if (!place) {
      return NextResponse.json(
        { error: 'Lugar no encontrado' },
        { status: 404 },
      );
    }

    // TODO: Check for duplicate and insert into DB
    // const [existing] = await db
    //   .select()
    //   .from(favorites)
    //   .where(
    //     and(
    //       eq(favorites.userId, session.userId),
    //       eq(favorites.placeId, body.placeId),
    //     ),
    //   )
    //   .limit(1);
    //
    // if (existing) {
    //   return NextResponse.json(
    //     { error: 'Este lugar ya esta en tus favoritos' },
    //     { status: 409 },
    //   );
    // }
    //
    // await db.insert(favorites).values({
    //   userId: session.userId,
    //   placeId: body.placeId,
    // });

    return NextResponse.json(
      {
        message: 'Lugar agregado a favoritos',
        favorite: {
          placeId: body.placeId,
          placeName: place.name,
          addedAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error en POST /api/favorites:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
