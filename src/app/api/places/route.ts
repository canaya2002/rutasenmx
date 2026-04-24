import { type NextRequest, NextResponse } from 'next/server';
import { and, eq, ilike, or, sql, asc, desc } from 'drizzle-orm';

import { db, places, placeCategories } from '@/db';
import { ESTADOS_MEXICO } from '@/lib/constants';
import { pickPlaceImage } from '@/lib/data/place-images';
import {
  PLACE_CATEGORY_CATALOG,
  type PlaceCategorySlug,
} from '@shared/types/places';

/**
 * GET /api/places
 *
 * Query params:
 *   category  – filter by category slug (pueblos-magicos | zonas-arqueologicas | …)
 *   state     – filter by state slug
 *   search    – text search on name / description
 *   lat, lng, radius – geo filter (km, haversine)
 *   limit     – page size  (default 20, max 100)
 *   offset    – pagination offset (default 0)
 *
 * Reads the real `places` table. Images come from `primary_image_url`; if that
 * column is null (some seed rows predate the backfill), we derive a stable
 * image at response time from `public/<State>/`.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const category = searchParams.get('category') as PlaceCategorySlug | null;
    const stateSlug = searchParams.get('state');
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

    // Resolve state slug → full state name (DB stores the display name).
    const stateRecord = stateSlug
      ? ESTADOS_MEXICO.find((s) => s.slug === stateSlug)
      : null;

    const whereParts = [eq(places.isPublished, true)];

    if (stateRecord) {
      whereParts.push(eq(places.state, stateRecord.name));
    }

    if (search) {
      const like = `%${search}%`;
      whereParts.push(
        or(
          ilike(places.name, like),
          ilike(places.shortDescription, like),
          ilike(places.longDescription, like),
        )!,
      );
    }

    // Category: the seed writes category slugs into `subcategoryIds` and the
    // importers wire `category_id → place_categories.slug`. Support both.
    if (category) {
      const [cat] = await db
        .select({ id: placeCategories.id })
        .from(placeCategories)
        .where(eq(placeCategories.slug, category))
        .limit(1);

      const categoryConditions = [] as typeof whereParts;
      if (cat) categoryConditions.push(eq(places.categoryId, cat.id));
      // `subcategory_ids` is a jsonb array of slugs.
      categoryConditions.push(
        sql`${places.subcategoryIds} @> ${JSON.stringify([category])}::jsonb`,
      );
      whereParts.push(or(...categoryConditions)!);
    }

    const whereExpr = and(...whereParts);

    // Geo filter — done in SQL via a haversine expression so we don't pull the
    // whole table into memory. Cheap enough for ~hundreds of rows; if places
    // ever grows past low thousands, switch to PostGIS `ST_DWithin`.
    let distanceExpr = sql<number>`NULL::double precision`;
    if (lat && lng && radius) {
      const latN = parseFloat(lat);
      const lngN = parseFloat(lng);
      const rN = parseFloat(radius);
      if (!isNaN(latN) && !isNaN(lngN) && !isNaN(rN)) {
        distanceExpr = sql<number>`
          6371 * acos(
            cos(radians(${latN})) * cos(radians(${places.latitude}))
            * cos(radians(${places.longitude}) - radians(${lngN}))
            + sin(radians(${latN})) * sin(radians(${places.latitude}))
          )
        `;
        whereParts.push(
          sql`
            6371 * acos(
              cos(radians(${latN})) * cos(radians(${places.latitude}))
              * cos(radians(${places.longitude}) - radians(${lngN}))
              + sin(radians(${latN})) * sin(radians(${places.latitude}))
            ) <= ${rN}
          `,
        );
      }
    }

    const baseWhere = and(...whereParts);

    const rows = await db
      .select({
        id: places.id,
        slug: places.slug,
        name: places.name,
        shortDescription: places.shortDescription,
        longDescription: places.longDescription,
        latitude: places.latitude,
        longitude: places.longitude,
        state: places.state,
        primaryImageUrl: places.primaryImageUrl,
        subcategoryIds: places.subcategoryIds,
        badges: places.badges,
        categorySlug: placeCategories.slug,
        distanceKm: distanceExpr,
      })
      .from(places)
      .leftJoin(placeCategories, eq(placeCategories.id, places.categoryId))
      .where(baseWhere)
      .orderBy(
        lat && lng && radius
          ? asc(distanceExpr)
          : desc(places.richnessScore),
      )
      .limit(limit)
      .offset(offset);

    const [{ n: total }] = await db
      .select({ n: sql<number>`COUNT(*)::int` })
      .from(places)
      .where(whereExpr);

    const shaped = rows.map((r) => {
      const catFromJson =
        Array.isArray(r.subcategoryIds) && r.subcategoryIds.length > 0
          ? r.subcategoryIds[0]
          : null;
      const catSlug = (r.categorySlug ??
        catFromJson ??
        'pueblos-magicos') as PlaceCategorySlug;
      const catMeta = PLACE_CATEGORY_CATALOG.find((c) => c.slug === catSlug);

      const stateMeta = r.state
        ? ESTADOS_MEXICO.find((s) => s.name === r.state)
        : null;

      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        stateSlug: stateMeta?.slug ?? '',
        stateName: r.state ?? '',
        category: catSlug,
        categoryName: catMeta?.name ?? catSlug,
        lat: r.latitude ?? 0,
        lng: r.longitude ?? 0,
        description: r.shortDescription ?? '',
        longDescription: r.longDescription ?? r.shortDescription ?? '',
        badges: Array.isArray(r.badges) ? r.badges : [],
        image:
          (r.primaryImageUrl && r.primaryImageUrl.trim() !== ''
            ? r.primaryImageUrl
            : pickPlaceImage(r.state, r.slug)) ?? '',
      };
    });

    return NextResponse.json({
      places: shaped,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error en GET /api/places:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
