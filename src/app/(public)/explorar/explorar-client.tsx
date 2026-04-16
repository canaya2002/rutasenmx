'use client';

import { useState, useCallback } from 'react';
import { MapProvider } from '@/components/map/MapProvider';
import MapView from '@/components/map/MapView';
import MapSidebar, { type SidebarPlace } from '@/components/map/MapSidebar';
import MapFilters, {
  defaultFilterValues,
  type MapFilterValues,
} from '@/components/map/MapFilters';
import BottomSheet from '@/components/map/BottomSheet';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PLACE_CATEGORIES } from '@/lib/constants';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface ExplorarClientProps {
  initialCategory: string;
  initialEstado: string;
  initialBudget: string;
  initialTraveler: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function ExplorarClient({
  initialCategory,
  initialEstado,
  initialBudget,
  initialTraveler,
}: ExplorarClientProps) {
  /* Filters — seeded from URL search params */
  const [filters, setFilters] = useState<MapFilterValues>({
    ...defaultFilterValues,
    categories: initialCategory ? [initialCategory] : [],
    estado: initialEstado,
    budget: initialBudget,
    travelerType: initialTraveler,
  });

  /* Sidebar places (would be fetched in a real app) */
  const [places] = useState<SidebarPlace[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* Bottom sheet query (mobile) */
  const [mobileQuery, setMobileQuery] = useState('');

  const handleSelectPlace = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  /* Update URL search params without a full navigation */
  const handleFiltersChange = useCallback((next: MapFilterValues) => {
    setFilters(next);

    /* Shallow-update the URL so the user can share / bookmark */
    const url = new URL(window.location.href);
    if (next.categories.length)
      url.searchParams.set('category', next.categories.join(','));
    else url.searchParams.delete('category');
    if (next.estado) url.searchParams.set('estado', next.estado);
    else url.searchParams.delete('estado');
    if (next.budget) url.searchParams.set('budget', next.budget);
    else url.searchParams.delete('budget');
    if (next.travelerType) url.searchParams.set('viajero', next.travelerType);
    else url.searchParams.delete('viajero');

    window.history.replaceState(null, '', url.toString());
  }, []);

  return (
    <MapProvider>
      <div className="flex h-[calc(100dvh-4rem)] w-full overflow-hidden">
        {/* Desktop sidebar */}
        <MapSidebar
          places={places}
          selectedId={selectedId}
          onSelect={handleSelectPlace}
        />

        {/* Map area + filter overlay */}
        <div className="relative flex-1">
          <MapView className="h-full w-full" />

          {/* Desktop filters overlay */}
          <div className="absolute left-0 top-0 z-10 h-full">
            <MapFilters values={filters} onChange={handleFiltersChange} />
          </div>
        </div>

        {/* Mobile bottom sheet */}
        <BottomSheet
          header={
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar lugar..."
                  value={mobileQuery}
                  onChange={(e) => setMobileQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
                {PLACE_CATEGORIES.slice(0, 6).map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() =>
                      handleFiltersChange({
                        ...filters,
                        categories: filters.categories.includes(cat.slug)
                          ? filters.categories.filter((c) => c !== cat.slug)
                          : [...filters.categories, cat.slug],
                      })
                    }
                    className="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors"
                    style={
                      filters.categories.includes(cat.slug)
                        ? { backgroundColor: cat.color, color: '#fff' }
                        : { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }
                    }
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          {/* Mobile place list */}
          {places.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Mueve el mapa para descubrir lugares.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {places.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => handleSelectPlace(place.id)}
                  className="flex w-full gap-3 py-3 text-left"
                >
                  {place.imageUrl ? (
                    <div
                      className="h-12 w-12 shrink-0 rounded-md bg-cover bg-center"
                      style={{ backgroundImage: `url(${place.imageUrl})` }}
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground">
                      Sin foto
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{place.name}</p>
                    {place.shortDescription && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {place.shortDescription}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </BottomSheet>
      </div>
    </MapProvider>
  );
}
