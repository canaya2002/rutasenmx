'use client';

import { useState, useCallback } from 'react';
import { Search, Star, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PLACE_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface SidebarPlace {
  id: string;
  name: string;
  slug: string;
  category?: string;
  state?: string;
  imageUrl?: string;
  rating?: number;
  shortDescription?: string;
  distanceKm?: number;
}

type SortMode = 'relevance' | 'distance' | 'rating';

export interface MapSidebarProps {
  places: SidebarPlace[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function categoryColor(slug?: string) {
  return PLACE_CATEGORIES.find((c) => c.slug === slug)?.color ?? '#6B7280';
}

function categoryName(slug?: string) {
  return PLACE_CATEGORIES.find((c) => c.slug === slug)?.name ?? '';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function MapSidebar({
  places,
  selectedId,
  onSelect,
  onLoadMore,
  hasMore = false,
  loading = false,
  className,
}: MapSidebarProps) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('relevance');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  /* Local filter + sort */
  const toggleCat = useCallback(
    (slug: string) =>
      setActiveCategories((prev) =>
        prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug],
      ),
    [],
  );

  const filtered = places
    .filter((p) => {
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (activeCategories.length && p.category && !activeCategories.includes(p.category))
        return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
      if (sort === 'distance') return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
      return 0; // relevance: keep server order
    });

  const cycleSortLabel: Record<SortMode, string> = {
    relevance: 'Relevancia',
    distance: 'Distancia',
    rating: 'Calificacion',
  };

  const cycleSort = useCallback(() => {
    setSort((prev) => {
      if (prev === 'relevance') return 'distance';
      if (prev === 'distance') return 'rating';
      return 'relevance';
    });
  }, []);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col w-96 shrink-0 border-r border-slate-200 bg-white',
        className,
      )}
    >
      {/* Search */}
      <div className="border-b border-slate-200 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Buscar lugar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category quick-filters */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 p-3">
        {PLACE_CATEGORIES.slice(0, 8).map((cat) => {
          const active = activeCategories.includes(cat.slug);
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => toggleCat(cat.slug)}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors',
                active ? 'text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100',
              )}
              style={active ? { backgroundColor: cat.color } : undefined}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Sort toggle */}
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <span className="text-xs text-slate-500">
          {filtered.length} lugar{filtered.length !== 1 ? 'es' : ''}
        </span>
        <button
          type="button"
          onClick={cycleSort}
          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowUpDown className="h-3 w-3" />
          {cycleSortLabel[sort]}
        </button>
      </div>

      {/* Place list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((place) => (
          <button
            key={place.id}
            type="button"
            onClick={() => onSelect(place.id)}
            className={cn(
              'flex w-full gap-3 border-b border-slate-200 px-3 py-3 text-left transition-colors hover:bg-slate-50',
              selectedId === place.id && 'bg-slate-50',
            )}
          >
            {/* Thumbnail */}
            {place.imageUrl ? (
              <div
                className="h-14 w-14 shrink-0 rounded-md bg-cover bg-center"
                style={{ backgroundImage: `url(${place.imageUrl})` }}
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-500 text-xs">
                Sin foto
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {place.category && (
                  <Badge
                    className="text-[10px] px-1.5 py-0"
                    style={{ backgroundColor: categoryColor(place.category), color: '#fff' }}
                  >
                    {categoryName(place.category)}
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 truncate text-sm font-semibold">{place.name}</p>
              {place.shortDescription && (
                <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                  {place.shortDescription}
                </p>
              )}
              <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                {place.rating != null && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {place.rating.toFixed(1)}
                  </span>
                )}
                {place.distanceKm != null && (
                  <span>{place.distanceKm < 1 ? `${Math.round(place.distanceKm * 1000)} m` : `${place.distanceKm.toFixed(1)} km`}</span>
                )}
                {place.state && <span>{place.state}</span>}
              </div>
            </div>
          </button>
        ))}

        {/* Load more */}
        {hasMore && (
          <div className="p-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={loading}
              onClick={onLoadMore}
            >
              {loading ? 'Cargando...' : 'Cargar mas'}
            </Button>
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div className="px-3 py-8 text-center text-sm text-slate-500">
            No se encontraron lugares con estos filtros.
          </div>
        )}
      </div>
    </aside>
  );
}
