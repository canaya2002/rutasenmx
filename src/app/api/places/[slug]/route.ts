import { NextResponse } from 'next/server';
import { mockPlaces } from '@/lib/data/mock';

// TODO: Switch to DB query once Drizzle connection is ready
// import { db, places } from '@/db';
// import { eq } from 'drizzle-orm';

/**
 * GET /api/places/[slug]
 *
 * Returns full place data for a given slug.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    // TODO: Replace with DB lookup – db.select().from(places).where(eq(places.slug, slug))
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
