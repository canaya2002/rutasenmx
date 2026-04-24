import { type NextRequest, NextResponse } from 'next/server';

import { mockPlaces, mockRoutes, mockStates } from '@/lib/data/mock';
import { PLACE_CATEGORIES } from '@/lib/constants';

/**
 * GET /api/search/suggestions?q=...&limit=10
 *
 * Lightweight autocomplete endpoint. Returns up to `limit` suggestions that
 * match `q` across places, states, and categories.
 *
 * Built to replace the client-side `mockPlaces` import that was dragging the
 * full 30k-place catalog into every bundle (home page's `<SmartHeroSearch>`
 * and `/explorar`'s client component). By serving JSON here, the client
 * ships ~kb instead of ~500kb of source data.
 *
 * Edge-cached by query so repeated typing of the same prefix hits cache.
 */
export const revalidate = 300; // 5 min

function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export interface SuggestionItem {
  kind: 'place' | 'state' | 'category' | 'route';
  label: string;
  sub?: string;
  href: string;
  categorySlug?: string;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const q = url.searchParams.get('q')?.trim() ?? '';
  const rawLimit = Number(url.searchParams.get('limit') ?? '10');
  const limit = Math.max(1, Math.min(Number.isFinite(rawLimit) ? rawLimit : 10, 25));

  if (q.length < 2) {
    return NextResponse.json(
      { items: [] as SuggestionItem[] },
      {
        headers: {
          'cache-control': 'public, s-maxage=300, stale-while-revalidate=86400',
        },
      },
    );
  }

  const needle = fold(q);
  const items: SuggestionItem[] = [];

  // States — small set, always check first.
  for (const s of mockStates) {
    if (items.length >= limit) break;
    if (fold(s.name).includes(needle) || fold(s.description).includes(needle)) {
      items.push({
        kind: 'state',
        label: s.name,
        sub: 'Estado',
        href: `/estados/${s.slug}`,
      });
    }
  }

  // Curated routes — also a small set.
  for (const r of mockRoutes) {
    if (items.length >= limit) break;
    if (
      fold(r.name).includes(needle) ||
      fold(r.origin).includes(needle) ||
      fold(r.destination).includes(needle) ||
      fold(r.description).includes(needle)
    ) {
      items.push({
        kind: 'route',
        label: r.name,
        sub: `${r.origin} → ${r.destination}`,
        href: `/rutas/${r.slug}`,
      });
    }
  }

  // Categories — tiny fixed list.
  for (const c of PLACE_CATEGORIES) {
    if (items.length >= limit) break;
    if (fold(c.name).includes(needle) || fold(c.slug).includes(needle)) {
      items.push({
        kind: 'category',
        label: c.name,
        sub: 'Categoría',
        href: `/${c.slug}`,
        categorySlug: c.slug,
      });
    }
  }

  // Places — scan merged catalog. Prefix match on name first (faster), then
  // fall back to substring.
  for (const p of mockPlaces) {
    if (items.length >= limit) break;
    const n = fold(p.name);
    if (n.startsWith(needle)) {
      items.push({
        kind: 'place',
        label: p.name,
        sub: p.stateName,
        href: `/lugares/${p.slug}`,
        categorySlug: p.category,
      });
    }
  }
  // Second pass: substring if we still have room.
  if (items.length < limit) {
    for (const p of mockPlaces) {
      if (items.length >= limit) break;
      const n = fold(p.name);
      if (!n.startsWith(needle) && n.includes(needle)) {
        items.push({
          kind: 'place',
          label: p.name,
          sub: p.stateName,
          href: `/lugares/${p.slug}`,
          categorySlug: p.category,
        });
      }
    }
  }

  return NextResponse.json(
    { items },
    {
      headers: {
        'cache-control': 'public, s-maxage=300, stale-while-revalidate=86400',
      },
    },
  );
}
