import { type NextRequest, NextResponse } from 'next/server';
import { mockPlaces } from '@/lib/data/mock';

/**
 * GET /api/places
 *
 * Query params:
 *   category  – filter by category slug (e.g. "pueblos-magicos")
 *   state     – filter by state slug
 *   search    – text search on name / description
 *   lat, lng, radius – geo filter (km)
 *   limit     – page size  (default 20, max 100)
 *   offset    – pagination offset (default 0)
 *
 * Currently uses in-memory mock data. When DATABASE_URL is configured
 * and the places table is seeded, swap to Drizzle queries by uncommenting
 * the DB block below.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const category = searchParams.get('category');
    const state = searchParams.get('state');
    const search = searchParams.get('search');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 1),
      100,
    );
    const offset = Math.max(
      parseInt(searchParams.get('offset') ?? '0', 10) || 0,
      0,
    );

    // ── DB query path (enable once DB is seeded) ──────────────────────────
    // import { db, places } from '@/db';
    // import { eq, ilike, and, sql } from 'drizzle-orm';
    // const conditions = [];
    // if (category) conditions.push(eq(places.categorySlug, category));
    // if (state) conditions.push(eq(places.stateSlug, state));
    // if (search) conditions.push(ilike(places.name, `%${search}%`));
    // const rows = await db.select().from(places).where(and(...conditions)).limit(limit).offset(offset);
    // return NextResponse.json({ places: rows, total: rows.length, limit, offset });

    // ── Mock data path ────────────────────────────────────────────────────
    let filtered = [...mockPlaces];

    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }

    if (state) {
      filtered = filtered.filter((p) => p.stateSlug === state);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }

    if (lat && lng && radius) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      if (!isNaN(latNum) && !isNaN(lngNum) && !isNaN(radiusKm)) {
        filtered = filtered.filter((p) => {
          const dist = haversine(latNum, lngNum, p.lat, p.lng);
          return dist <= radiusKm;
        });
      }
    }

    const total = filtered.length;
    const places = filtered.slice(offset, offset + limit);

    return NextResponse.json({ places, total, limit, offset });
  } catch (error) {
    console.error('Error en GET /api/places:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Simple haversine distance in km */
function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
