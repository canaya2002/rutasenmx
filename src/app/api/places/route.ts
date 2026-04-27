import { type NextRequest, NextResponse } from 'next/server';
import { and, eq, ilike, inArray, or, sql, asc, desc } from 'drizzle-orm';

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
 *   category  – filter by category slug (repeatable). Accepts one or many
 *               (?category=museos&category=haciendas) and also a CSV form
 *               (?category=museos,haciendas).
 *   state     – filter by state slug
 *   search    – text search on name / description
 *   lat, lng, radius – geo filter (km, haversine)
 *   limit     – page size  (default 20, max 5000 — the explorer map needs to
 *               render everything at once, so we keep room for the full catalog)
 *   offset    – pagination offset (default 0)
 *
 * Reads the real `places` table. Images come from `primary_image_url`; if that
 * column is null (some seed rows predate the backfill), we derive a stable
 * image at response time from `public/<State>/`.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Multi-category: accept ?category=a&category=b OR ?category=a,b
    const rawCategories = searchParams.getAll('category');
    const categories = rawCategories
      .flatMap((c) => c.split(','))
      .map((c) => c.trim())
      .filter((c) => c.length > 0) as PlaceCategorySlug[];
    const stateSlug = searchParams.get('state');
    const search = searchParams.get('search');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 1),
      5000,
    );
    const offset = Math.max(
      parseInt(searchParams.get('offset') ?? '0', 10) || 0,
      0,
    );

    // `fields=map` is the slim mode used by /explorar. Skips longDescription,
    // image lookup and badges so the payload for ~3k pins stays under ~250 KB
    // instead of multi-megabyte. Default mode keeps the full shape so other
    // callers (lugares pages, mobile detail etc.) don't break.
    const fieldsMode = searchParams.get('fields');
    const isMapMode = fieldsMode === 'map';

    // Resolve state slug → full state name (DB stores the display name).
    const stateRecord = stateSlug
      ? ESTADOS_MEXICO.find((s) => s.slug === stateSlug)
      : null;

    const whereParts = [eq(places.isPublished, true)];

    // Defensive bounding-box filter: never return rows with coordinates
    // outside Mexico (or with the lat==lng SIC bug that landed Xochipala in
    // Chad). The seed sweep also unpublishes these, but this guard ensures
    // they can't surface even if a fresh import slips bad coords in later.
    whereParts.push(
      sql`${places.latitude} IS NOT NULL AND ${places.longitude} IS NOT NULL`,
    );
    whereParts.push(sql`${places.latitude} BETWEEN 14 AND 33`);
    whereParts.push(sql`${places.longitude} BETWEEN -119 AND -86`);
    whereParts.push(sql`${places.latitude} <> ${places.longitude}`);

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
    // importers wire `category_id → place_categories.slug`. Support both, and
    // accept the union when several categories are requested.
    if (categories.length > 0) {
      const catRows = await db
        .select({ id: placeCategories.id, slug: placeCategories.slug })
        .from(placeCategories)
        .where(inArray(placeCategories.slug, categories));

      const categoryConditions = [] as typeof whereParts;
      if (catRows.length > 0) {
        categoryConditions.push(
          inArray(
            places.categoryId,
            catRows.map((c) => c.id),
          ),
        );
      }
      // `subcategory_ids` is a jsonb array of slugs. The `?|` operator returns
      // true if any of the supplied keys exist as top-level array elements,
      // which lets us match rows whose category slug lives in subcategory_ids
      // (legacy seed rows). Also tolerate the singular legacy slug
      // 'pueblo-magico' that older `scripts/seed.ts` wrote.
      const subcatTokens = Array.from(
        new Set(
          categories.flatMap((c) =>
            c === 'pueblos-magicos' ? [c, 'pueblo-magico'] : [c],
          ),
        ),
      );
      categoryConditions.push(
        sql`${places.subcategoryIds} ?| ${sql.raw(
          `ARRAY[${subcatTokens.map((t) => `'${t.replace(/'/g, "''")}'`).join(',')}]::text[]`,
        )}`,
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

    // In `map` mode skip the heavy long-description, primary image and badges
    // columns — the explorer only needs lightweight pin data.
    const rows = await db
      .select({
        id: places.id,
        slug: places.slug,
        name: places.name,
        shortDescription: places.shortDescription,
        longDescription: isMapMode
          ? sql<string | null>`NULL::text`
          : places.longDescription,
        latitude: places.latitude,
        longitude: places.longitude,
        state: places.state,
        primaryImageUrl: isMapMode
          ? sql<string | null>`NULL::text`
          : places.primaryImageUrl,
        subcategoryIds: places.subcategoryIds,
        badges: isMapMode
          ? sql<unknown>`'[]'::jsonb`
          : places.badges,
        categorySlug: placeCategories.slug,
        distanceKm: distanceExpr,
      })
      .from(places)
      .leftJoin(placeCategories, eq(placeCategories.id, places.categoryId))
      .where(baseWhere)
      .orderBy(
        ...(lat && lng && radius
          ? [asc(distanceExpr)]
          : [desc(places.richnessScore), asc(places.name)]),
      )
      .limit(limit)
      .offset(offset);

    // Skip the COUNT(*) round-trip in map mode — the client only uses it to
    // show "N lugares", which it can compute from the array length when the
    // page size is wide enough to hold everything (limit=5000 already does).
    const total = isMapMode
      ? rows.length
      : (
          await db
            .select({ n: sql<number>`COUNT(*)::int` })
            .from(places)
            .where(whereExpr)
        )[0].n;

    // The first non-null subcategoryId is the category for legacy seed rows.
    // Map known legacy/singular slugs back to canonical catalog slugs so the
    // client renders the right icon (Pueblo Mágico, Zona Arqueológica…).
    const LEGACY_SLUG_MAP: Record<string, PlaceCategorySlug> = {
      'pueblo-magico': 'pueblos-magicos',
      'pueblos-magicos': 'pueblos-magicos',
      'zona-arqueologica': 'zonas-arqueologicas',
      'zonas-arqueologicas': 'zonas-arqueologicas',
      // `scripts/seed.ts` puts the *culture* into subcategoryIds for zonas
      // arqueológicas (e.g. 'maya', 'azteca'). Resolve those to the proper
      // category instead of shipping the literal culture name.
      maya: 'zonas-arqueologicas',
      mexica: 'zonas-arqueologicas',
      azteca: 'zonas-arqueologicas',
      tolteca: 'zonas-arqueologicas',
      zapoteca: 'zonas-arqueologicas',
      mixteca: 'zonas-arqueologicas',
      olmeca: 'zonas-arqueologicas',
      huasteca: 'zonas-arqueologicas',
      purepecha: 'zonas-arqueologicas',
      totonaca: 'zonas-arqueologicas',
      teotihuacana: 'zonas-arqueologicas',
    };

    const KNOWN_SLUGS: Set<string> = new Set(
      PLACE_CATEGORY_CATALOG.map((c) => c.slug),
    );

    const shaped = rows.map((r) => {
      const subcatStrings = Array.isArray(r.subcategoryIds)
        ? r.subcategoryIds.filter((s): s is string => typeof s === 'string')
        : [];

      // Pick the first subcategory entry that maps to a known catalog slug, so
      // a row whose subcategoryIds is ['inah-oficial', 'maya'] still resolves
      // to zonas-arqueologicas rather than to a meaningless badge token.
      const catFromJson =
        subcatStrings
          .map((s) => LEGACY_SLUG_MAP[s] ?? (KNOWN_SLUGS.has(s) ? (s as PlaceCategorySlug) : null))
          .find((s): s is PlaceCategorySlug => s !== null) ?? null;

      const fromCategoryFk = r.categorySlug
        ? (LEGACY_SLUG_MAP[r.categorySlug] ?? (r.categorySlug as PlaceCategorySlug))
        : null;

      const catSlug = (fromCategoryFk ??
        catFromJson ??
        'pueblos-magicos') as PlaceCategorySlug;
      const catMeta = PLACE_CATEGORY_CATALOG.find((c) => c.slug === catSlug);

      const stateMeta = r.state
        ? ESTADOS_MEXICO.find((s) => s.name === r.state)
        : null;

      // In map mode we skip the per-row stateMeta lookup and image fallback
      // (the slowest parts of the shaping loop) since the explorer doesn't
      // render those fields.
      if (isMapMode) {
        return {
          id: r.id,
          slug: r.slug,
          name: r.name,
          stateSlug: '',
          stateName: r.state ?? '',
          category: catSlug,
          categoryName: catMeta?.name ?? catSlug,
          lat: r.latitude ?? 0,
          lng: r.longitude ?? 0,
          description: r.shortDescription ?? '',
          longDescription: '',
          badges: [],
          image: '',
        };
      }

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

    return NextResponse.json(
      { places: shaped, total, limit, offset },
      {
        headers: isMapMode
          ? {
              // Cache the slim map payload at the edge so rapid repeat hits
              // (filter toggling, debounced typing) are served instantly.
              'cache-control':
                'public, s-maxage=60, stale-while-revalidate=300',
            }
          : { 'cache-control': 'no-store' },
      },
    );
  } catch (error) {
    console.error('Error en GET /api/places:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
