import { type NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { z } from 'zod';

import { db, savedPlaces } from '@/db';
import { getSession } from '@/lib/auth/session';
import { getPlaceBySlug } from '@/lib/data/mock';

/**
 * GET /api/favorites
 * POST /api/favorites   — body: { placeSlug: string, notes?: string }
 * DELETE /api/favorites — query: ?slug=xxx
 *
 * Favorites are keyed by `(userId, placeSlug)` because the place catalog is
 * editorial static content (pueblos mágicos, museos, zonas arqueológicas,
 * etc. — see `src/lib/data/mock.ts`) rather than a DB table. We store the
 * stable slug and look up the rest of the metadata at read time.
 *
 * The legacy `placeId` column (FK to `places`) is kept nullable so rows
 * created before this refactor still work.
 */

const postSchema = z.object({
  placeSlug: z.string().min(1).max(300),
  notes: z.string().max(2000).optional(),
});

export async function GET(_request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const rows = await db
    .select({
      id: savedPlaces.id,
      placeSlug: savedPlaces.placeSlug,
      notes: savedPlaces.notes,
      createdAt: savedPlaces.createdAt,
    })
    .from(savedPlaces)
    .where(
      and(
        eq(savedPlaces.userId, session.userId),
        isNotNull(savedPlaces.placeSlug),
      ),
    )
    .orderBy(desc(savedPlaces.createdAt));

  const favorites = rows
    .map((row) => {
      const place = row.placeSlug ? getPlaceBySlug(row.placeSlug) : null;
      if (!place) return null; // slug no longer in catalog — soft-hide
      return {
        id: row.id,
        slug: place.slug,
        name: place.name,
        category: place.category,
        categoryName: place.categoryName,
        stateName: place.stateName,
        image: place.image,
        description: place.description,
        notes: row.notes,
        addedAt: row.createdAt.toISOString(),
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  return NextResponse.json({ favorites, total: favorites.length });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const place = getPlaceBySlug(parsed.data.placeSlug);
  if (!place) {
    return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 });
  }

  // Dedup by unique index (userId, placeSlug).
  const [existing] = await db
    .select({ id: savedPlaces.id })
    .from(savedPlaces)
    .where(
      and(
        eq(savedPlaces.userId, session.userId),
        eq(savedPlaces.placeSlug, parsed.data.placeSlug),
      ),
    )
    .limit(1);

  if (existing) {
    if (parsed.data.notes !== undefined) {
      await db
        .update(savedPlaces)
        .set({ notes: parsed.data.notes })
        .where(eq(savedPlaces.id, existing.id));
    }
    return NextResponse.json(
      { ok: true, alreadyFavorite: true, id: existing.id },
      { status: 200 },
    );
  }

  const [inserted] = await db
    .insert(savedPlaces)
    .values({
      userId: session.userId,
      placeSlug: parsed.data.placeSlug,
      notes: parsed.data.notes ?? null,
    })
    .returning({ id: savedPlaces.id });

  return NextResponse.json(
    {
      ok: true,
      id: inserted.id,
      favorite: {
        placeSlug: place.slug,
        placeName: place.name,
        addedAt: new Date().toISOString(),
      },
    },
    { status: 201 },
  );
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const slug = new URL(request.url).searchParams.get('slug')?.trim();
  if (!slug) {
    return NextResponse.json({ error: 'slug requerido' }, { status: 400 });
  }

  await db
    .delete(savedPlaces)
    .where(
      and(
        eq(savedPlaces.userId, session.userId),
        eq(savedPlaces.placeSlug, slug),
      ),
    );

  return NextResponse.json({ ok: true });
}
