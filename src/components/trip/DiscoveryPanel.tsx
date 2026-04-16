'use client';

import { useState, useCallback } from 'react';
import { Compass, Plus, Star, Clock, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PLACE_CATEGORIES, DISCOVERY_RADII, TRAVELER_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { formatDistance, formatDuration } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface DiscoveryResult {
  id: string;
  name: string;
  category: string;
  distanceFromRouteKm: number;
  detourMinutes: number;
  rating?: number;
  relevanceScore: number; // 0-100
  imageUrl?: string;
}

export interface DiscoveryPanelProps {
  results: DiscoveryResult[];
  onAddToTrip: (id: string) => void;
  /** Whether data is being fetched */
  loading?: boolean;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function categoryColor(slug: string) {
  return PLACE_CATEGORIES.find((c) => c.slug === slug)?.color ?? '#6B7280';
}

function categoryName(slug: string) {
  return PLACE_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

const travelerLabels: Record<string, string> = {
  familia: 'Familia',
  pareja: 'Pareja',
  solo: 'Solo',
  'con-mascotas': 'Con mascotas',
  accesible: 'Accesible',
  'bajo-presupuesto': 'Bajo presupuesto',
  premium: 'Premium',
  foodie: 'Foodie',
  cultural: 'Cultural',
  naturaleza: 'Naturaleza',
  aventura: 'Aventura',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function DiscoveryPanel({
  results,
  onAddToTrip,
  loading = false,
  className,
}: DiscoveryPanelProps) {
  const [radius, setRadius] = useState<number>(10);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [travelerFilter, setTravelerFilter] = useState<string>('');

  /* Filter locally (server would use these params for the actual query) */
  const filtered = results
    .filter((r) => {
      if (categoryFilter && r.category !== categoryFilter) return false;
      if (r.distanceFromRouteKm > radius) return false;
      return true;
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  return (
    <div className={cn('space-y-5', className)}>
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <Compass className="h-4 w-4 text-terracotta" />
        Descubre cerca de tu ruta
      </h3>

      {/* Radius selector */}
      <div>
        <span className="mb-1.5 block text-xs text-muted-foreground">
          Radio de busqueda
        </span>
        <div className="flex gap-2">
          {DISCOVERY_RADII.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRadius(r)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                radius === r
                  ? 'bg-terracotta text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div>
        <span className="mb-1.5 block text-xs text-muted-foreground">Categoria</span>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Todas</option>
          {PLACE_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Traveler type filter */}
      <div>
        <span className="mb-1.5 block text-xs text-muted-foreground">
          Tipo de viajero
        </span>
        <div className="flex flex-wrap gap-1.5">
          {TRAVELER_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
                setTravelerFilter((prev) => (prev === t ? '' : t))
              }
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors',
                travelerFilter === t
                  ? 'bg-jade text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {travelerLabels[t] ?? t}
            </button>
          ))}
        </div>
      </div>

      {/* Results list */}
      <div className="space-y-2">
        {loading && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Buscando lugares...
          </p>
        )}

        {!loading && filtered.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No se encontraron lugares dentro de {radius} km de tu ruta.
          </p>
        )}

        {filtered.map((result) => (
          <div
            key={result.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
          >
            {/* Thumbnail */}
            {result.imageUrl ? (
              <div
                className="h-12 w-12 shrink-0 rounded-md bg-cover bg-center"
                style={{ backgroundImage: `url(${result.imageUrl})` }}
              />
            ) : (
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `${categoryColor(result.category)}20` }}
              >
                <Compass
                  className="h-5 w-5"
                  style={{ color: categoryColor(result.category) }}
                />
              </div>
            )}

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Badge
                  className="px-1.5 py-0 text-[10px]"
                  style={{
                    backgroundColor: categoryColor(result.category),
                    color: '#fff',
                  }}
                >
                  {categoryName(result.category)}
                </Badge>
                {/* Relevance score */}
                <span
                  className="rounded-full px-1.5 py-0 text-[10px] font-bold"
                  style={{
                    backgroundColor:
                      result.relevanceScore >= 80
                        ? '#dcfce7'
                        : result.relevanceScore >= 50
                          ? '#fef9c3'
                          : '#f3f4f6',
                    color:
                      result.relevanceScore >= 80
                        ? '#166534'
                        : result.relevanceScore >= 50
                          ? '#854d0e'
                          : '#6b7280',
                  }}
                >
                  {result.relevanceScore}%
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm font-semibold">{result.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                {result.rating != null && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {result.rating.toFixed(1)}
                  </span>
                )}
                <span className="flex items-center gap-0.5">
                  <Route className="h-3 w-3" />
                  {formatDistance(result.distanceFromRouteKm)} de la ruta
                </span>
                <span className="flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />+{formatDuration(result.detourMinutes)}
                </span>
              </div>
            </div>

            {/* Add button */}
            <Button
              size="sm"
              className="h-7 shrink-0 gap-1 px-2 text-[11px]"
              onClick={() => onAddToTrip(result.id)}
            >
              <Plus className="h-3 w-3" />
              Agregar
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
