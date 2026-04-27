'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type maplibregl from 'maplibre-gl';
import Link from 'next/link';
import { MapProvider, useMap } from '@/components/map/MapProvider';
import MapView from '@/components/map/MapView';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  ListFilter,
} from 'lucide-react';
import Image from 'next/image';
import type { MockPlace } from '@/lib/data/mock';
import { PLACE_CATEGORIES, ESTADOS_MEXICO } from '@/lib/constants';
import { useLocale } from '@/components/providers/LocaleProvider';
import { registerCategoryIcons } from '@/components/map/categoryIcons';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ExplorarClientProps {
  initialCategory: string;
  initialEstado: string;
  initialSearch: string;
}

/* ------------------------------------------------------------------ */
/*  Emoji + icon helpers                                               */
/* ------------------------------------------------------------------ */
const CATEGORY_EMOJI: Record<string, string> = {
  'pueblos-magicos': '✨',
  museos: '🏛️',
  'zonas-arqueologicas': '🏺',
  playas: '🏖️',
  haciendas: '🏡',
  'centros-historicos': '⛪',
};

const DEFAULT_EMOJI = '📍';

function getCategoryEmoji(slug: string): string {
  return (
    CATEGORY_EMOJI[slug] ??
    PLACE_CATEGORIES.find((c) => c.slug === slug)?.emoji ??
    DEFAULT_EMOJI
  );
}

function getCategoryIconSvg(slug: string): string | null {
  const cat = PLACE_CATEGORIES.find((c) => c.slug === slug);
  return (
    (cat && 'iconSvg' in cat ? (cat.iconSvg as string | undefined) : undefined) ??
    null
  );
}

function catColor(slug: string) {
  return PLACE_CATEGORIES.find((c) => c.slug === slug)?.color ?? '#6B7280';
}
function catName(slug: string) {
  return PLACE_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

/* ------------------------------------------------------------------ */
/*  MapMarkers — clusters + symbols + selected ring                    */
/* ------------------------------------------------------------------ */
function MapMarkers({
  places,
  onSelect,
  selectedId,
}: {
  places: MockPlace[];
  onSelect: (p: MockPlace) => void;
  selectedId: string | null;
}) {
  const { map, isReady } = useMap();

  useEffect(() => {
    if (!map || !isReady) return;

    const sourceId = 'places-source';
    const clusterHaloId = 'places-cluster-halo';
    const clusterLayerId = 'places-clusters';
    const clusterCountId = 'places-cluster-count';
    const symbolLayerId = 'places-symbols';
    const emojiFallbackLayerId = 'places-emoji-fallback';
    const selectedLayerId = 'places-selected';

    for (const id of [
      selectedLayerId,
      emojiFallbackLayerId,
      symbolLayerId,
      clusterCountId,
      clusterLayerId,
      clusterHaloId,
    ]) {
      if (map.getLayer(id)) map.removeLayer(id);
    }
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: places.map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: {
          id: p.id,
          name: p.name,
          category: p.category,
          slug: p.slug,
          stateName: p.stateName,
          description: p.description,
          hasIcon: getCategoryIconSvg(p.category) ? 1 : 0,
        },
      })),
    };

    // Smaller clusterRadius + lower clusterMaxZoom = many more individual
    // category icons surface earlier (the user wanted icons "by majority"
    // and progressively more as they zoom in).
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 9,
      clusterRadius: 32,
    });

    for (const c of PLACE_CATEGORIES) {
      const svg = (c as { iconSvg?: string }).iconSvg;
      if (!svg) continue;
      const img = new window.Image();
      img.src = svg;
    }
    registerCategoryIcons(
      map as unknown as Parameters<typeof registerCategoryIcons>[0],
    ).catch(() => {});

    // ─── Cluster halo (soft glow ring, color = density) ──────────────────
    map.addLayer({
      id: clusterHaloId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#06C167', // <10  · emerald
          10,
          '#0EA5E9', // 10–49 · sky
          50,
          '#8B5CF6', // 50–99 · violet
          100,
          '#F59E0B', // 100–249 · amber
          250,
          '#E11D48', // 250+ · rose
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          26,
          10,
          32,
          50,
          40,
          100,
          48,
          250,
          56,
        ],
        'circle-blur': 0.45,
        'circle-opacity': 0.55,
      },
    });

    // ─── Cluster core (dark glass disc with thin colored ring) ───────────
    map.addLayer({
      id: clusterLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': 'rgba(15, 18, 22, 0.78)',
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          18,
          10,
          22,
          50,
          28,
          100,
          34,
          250,
          40,
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': [
          'step',
          ['get', 'point_count'],
          'rgba(6,193,103,0.9)',
          10,
          'rgba(14,165,233,0.9)',
          50,
          'rgba(139,92,246,0.9)',
          100,
          'rgba(245,158,11,0.95)',
          250,
          'rgba(225,29,72,0.95)',
        ],
      },
    });

    // ─── Cluster count text ──────────────────────────────────────────────
    map.addLayer({
      id: clusterCountId,
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['Noto Sans Regular'],
        'text-size': [
          'step',
          ['get', 'point_count'],
          13,
          10,
          14,
          50,
          15,
          100,
          16,
        ],
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': 'rgba(0,0,0,0.6)',
        'text-halo-width': 1,
      },
    });

    map.addLayer({
      id: symbolLayerId,
      type: 'symbol',
      source: sourceId,
      filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'hasIcon'], 1]],
      layout: {
        'icon-image': ['concat', 'cat-', ['get', 'category']],
        'icon-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          4,
          0.35,
          7,
          0.55,
          11,
          0.75,
          15,
          0.95,
        ],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-anchor': 'bottom',
      },
    } as maplibregl.LayerSpecification);

    map.addLayer({
      id: emojiFallbackLayerId,
      type: 'symbol',
      source: sourceId,
      filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'hasIcon'], 0]],
      layout: {
        'text-field': [
          'match',
          ['get', 'category'],
          'cascadas',
          '🌊',
          'bosques-sierras',
          '🌲',
          'vinedos',
          '🍇',
          'grutas',
          '🪨',
          'miradores',
          '👁️',
          '📍',
        ],
        'text-font': ['Noto Sans Regular'],
        'text-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          4,
          16,
          7,
          20,
          11,
          26,
          15,
          32,
        ],
        'text-allow-overlap': true,
      },
    } as maplibregl.LayerSpecification);

    map.addLayer({
      id: selectedLayerId,
      type: 'circle',
      source: sourceId,
      filter: selectedId
        ? ['==', ['get', 'id'], selectedId]
        : ['==', ['get', 'id'], ''],
      paint: {
        'circle-color': 'transparent',
        'circle-radius': 22,
        'circle-stroke-width': 3,
        'circle-stroke-color': '#06C167',
        'circle-stroke-opacity': 0.85,
      },
    });

    const onClusterClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [clusterLayerId],
      });
      if (!features.length) return;
      const clusterId = features[0].properties?.cluster_id as number | undefined;
      if (clusterId == null) return;
      const src = map.getSource(sourceId) as maplibregl.GeoJSONSource;
      src
        .getClusterExpansionZoom(clusterId)
        .then((zoom: number) => {
          const coords = (features[0].geometry as GeoJSON.Point).coordinates;
          map.flyTo({
            center: [coords[0], coords[1]],
            zoom: Math.min(zoom, 15),
            duration: 800,
            essential: true,
          });
        })
        .catch(() => {});
    };

    const onPointClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [symbolLayerId, emojiFallbackLayerId],
      });
      if (!features.length) return;
      const slug = features[0].properties?.slug;
      const place = places.find((p) => p.slug === slug);
      if (place) onSelect(place);
    };

    map.on('click', clusterLayerId, onClusterClick);
    map.on('click', symbolLayerId, onPointClick);
    map.on('click', emojiFallbackLayerId, onPointClick);

    const ptrEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const ptrLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('mouseenter', symbolLayerId, ptrEnter);
    map.on('mouseleave', symbolLayerId, ptrLeave);
    map.on('mouseenter', emojiFallbackLayerId, ptrEnter);
    map.on('mouseleave', emojiFallbackLayerId, ptrLeave);
    map.on('mouseenter', clusterLayerId, ptrEnter);
    map.on('mouseleave', clusterLayerId, ptrLeave);

    return () => {
      const isAlive = (() => {
        try {
          return typeof map.getStyle === 'function' && !!map.getStyle();
        } catch {
          return false;
        }
      })();
      if (!isAlive) return;

      const safe = (fn: () => void) => {
        try {
          fn();
        } catch {
          /* ignore */
        }
      };

      safe(() => map.off('click', clusterLayerId, onClusterClick));
      safe(() => map.off('click', symbolLayerId, onPointClick));
      safe(() => map.off('click', emojiFallbackLayerId, onPointClick));
      safe(() => map.off('mouseenter', symbolLayerId, ptrEnter));
      safe(() => map.off('mouseleave', symbolLayerId, ptrLeave));
      safe(() => map.off('mouseenter', emojiFallbackLayerId, ptrEnter));
      safe(() => map.off('mouseleave', emojiFallbackLayerId, ptrLeave));
      safe(() => map.off('mouseenter', clusterLayerId, ptrEnter));
      safe(() => map.off('mouseleave', clusterLayerId, ptrLeave));

      for (const id of [
        selectedLayerId,
        emojiFallbackLayerId,
        symbolLayerId,
        clusterCountId,
        clusterLayerId,
      ]) {
        safe(() => {
          if (map.getLayer(id)) map.removeLayer(id);
        });
      }
      safe(() => {
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      });
    };
  }, [map, isReady, places, onSelect, selectedId]);

  useEffect(() => {
    if (!map || !isReady) return;
    const selectedLayerId = 'places-selected';
    try {
      if (map.getLayer(selectedLayerId)) {
        map.setFilter(
          selectedLayerId,
          selectedId
            ? ['==', ['get', 'id'], selectedId]
            : ['==', ['get', 'id'], ''],
        );
      }
    } catch {
      /* ignore */
    }
  }, [map, isReady, selectedId]);

  return null;
}

/* ------------------------------------------------------------------ */
/*  FlyTo helper                                                       */
/* ------------------------------------------------------------------ */
function MapFlyTo({ lat, lng }: { lat: number; lng: number }) {
  const { map, isReady } = useMap();

  useEffect(() => {
    if (!map || !isReady) return;
    map.flyTo({
      center: [lng, lat],
      zoom: Math.max(map.getZoom(), 11),
      duration: 1000,
      essential: true,
    });
  }, [map, isReady, lat, lng]);

  return null;
}

/* ------------------------------------------------------------------ */
/*  Categorías visibles en el explorer (las 6 oficiales)               */
/* ------------------------------------------------------------------ */
const EXPLORER_CATEGORIES = PLACE_CATEGORIES.slice(0, 6);

/* ------------------------------------------------------------------ */
/*  Glass primitives (estilo navbar dark glass)                        */
/* ------------------------------------------------------------------ */
const glassPanel =
  'rounded-3xl border border-white/15 bg-black/55 backdrop-blur-2xl shadow-[0_24px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/5';
const glassPill =
  'rounded-full border border-white/15 bg-black/50 text-white shadow-lg shadow-black/30 backdrop-blur-xl';

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export default function ExplorarClient({
  initialCategory,
  initialEstado,
  initialSearch,
}: ExplorarClientProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const L = useMemo(
    () => ({
      searchPlaceholder: isEn ? 'Search place, state…' : 'Buscar lugar, estado…',
      allStates: isEn ? 'All states' : 'Todos los estados',
      placesCount: (n: number) =>
        isEn ? `${n} places` : `${n} lugares`,
      placesFound: (n: number) =>
        isEn ? `${n} places found` : `${n} lugares encontrados`,
      clear: isEn ? 'Clear' : 'Limpiar',
      clearFilters: isEn ? 'Clear filters' : 'Limpiar filtros',
      noPlacesFound: isEn ? 'No places found' : 'No se encontraron lugares',
      tryOtherFilters: isEn
        ? 'Try other filters or search terms'
        : 'Intenta con otros filtros',
      filters: isEn ? 'Filters' : 'Filtros',
      categories: isEn ? 'Categories' : 'Categorías',
      viewDetail: isEn ? 'View detail' : 'Ver detalle',
      addToRoute: isEn ? 'Add to route' : 'Agregar a ruta',
      seeList: isEn ? 'See list' : 'Ver lista',
      hideList: isEn ? 'Hide list' : 'Ocultar',
    }),
    [isEn],
  );

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : [],
  );
  const [selectedEstado, setSelectedEstado] = useState(initialEstado);
  const [selectedPlace, setSelectedPlace] = useState<MockPlace | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  const [filteredPlaces, setFilteredPlaces] = useState<MockPlace[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  // Trip draft (persisted in localStorage so /planear can pick it up).
  const [tripDraftCount, setTripDraftCount] = useState(0);
  const [toast, setToast] = useState<{ msg: string; tone: 'ok' | 'warn' } | null>(
    null,
  );

  // Hydrate count once on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('tripDraft.stops');
      const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
      if (Array.isArray(parsed)) setTripDraftCount(parsed.length);
    } catch {
      /* ignore corrupt blob */
    }
  }, []);

  // Auto-dismiss toast after 2.4s.
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  const addPlaceToTrip = useCallback((place: MockPlace) => {
    if (typeof window === 'undefined') return;
    type DraftStop = {
      slug: string;
      name: string;
      lat: number;
      lng: number;
      stateName: string;
      category: string;
      addedAt: number;
    };
    let stops: DraftStop[] = [];
    try {
      const raw = window.localStorage.getItem('tripDraft.stops');
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      if (Array.isArray(parsed)) stops = parsed as DraftStop[];
    } catch {
      stops = [];
    }
    if (stops.some((s) => s.slug === place.slug)) {
      setToast({
        msg: isEn
          ? `Already in your route (${stops.length})`
          : `Ya está en tu ruta (${stops.length})`,
        tone: 'warn',
      });
      return;
    }
    stops.push({
      slug: place.slug,
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      stateName: place.stateName,
      category: place.category,
      addedAt: Date.now(),
    });
    window.localStorage.setItem('tripDraft.stops', JSON.stringify(stops));
    setTripDraftCount(stops.length);
    setToast({
      msg: isEn
        ? `Added — ${stops.length} stop${stops.length === 1 ? '' : 's'}`
        : `Agregado — ${stops.length} parada${stops.length === 1 ? '' : 's'}`,
      tone: 'ok',
    });
  }, [isEn]);

  // Lock body scroll AND hide the footer while on explorar. The wrapper is
  // `fixed inset-0` and *should* paint over the footer via the stacking-
  // context rules, but Chromium occasionally shows a sub-pixel sliver of the
  // footer logo poking through (looks like a random `icon.png` floating in
  // the middle of the map). Hiding the footer outright is bulletproof.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const footer = document.querySelector('body > footer') as HTMLElement | null;
    const prevFooterDisplay = footer?.style.display ?? '';
    if (footer) footer.style.display = 'none';

    return () => {
      document.body.style.overflow = prevOverflow;
      if (footer) footer.style.display = prevFooterDisplay;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingPlaces(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        for (const slug of selectedCategories) {
          params.append('category', slug);
        }
        if (selectedEstado) params.set('state', selectedEstado);
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        params.set('limit', '5000');
        // Slim mode: drops descriptions/images/badges so the explorer ships
        // a ~250 KB payload for the full Mexico catalog instead of multi-MB.
        params.set('fields', 'map');
        const res = await fetch(`/api/places?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { places: MockPlace[] };
        setFilteredPlaces(data.places);
      } catch {
        /* AbortError on rapid typing is expected. */
      } finally {
        setLoadingPlaces(false);
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [selectedCategories, selectedEstado, searchQuery]);

  const toggleCategory = useCallback((slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedEstado('');
    setSearchQuery('');
  }, []);

  useEffect(() => {
    if (!selectedPlace || !listRef.current) return;
    const el = listRef.current.querySelector(
      `[data-place-id="${selectedPlace.id}"]`,
    );
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedPlace]);

  const activeFilterCount =
    selectedCategories.length + (selectedEstado ? 1 : 0);

  /* ============================================================== */
  /*  Render                                                         */
  /* ============================================================== */
  return (
    <MapProvider>
      {/* Wrapper: fixed full-viewport so the map runs end-to-end behind the
          dark glass nav pills. Using `fixed` (not `-mt-16`) avoids the
          phantom 64-px scrollband the negative margin produced under the
          footer, which surfaced as a white line at the top. */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-black">
        {/* ===================== MAP (full bleed) ===================== */}
        <div className="absolute inset-0">
          <MapView className="h-full w-full" />
          <MapMarkers
            places={filteredPlaces}
            onSelect={(p) => {
              setSelectedPlace(p);
              setMobileSheetOpen(false);
            }}
            selectedId={selectedPlace?.id ?? null}
          />
          {selectedPlace && (
            <MapFlyTo lat={selectedPlace.lat} lng={selectedPlace.lng} />
          )}
        </div>

        {/* ===================== DESKTOP LEFT RAIL ===================== */}
        <aside
          className={`pointer-events-none absolute left-4 top-20 bottom-4 z-20 hidden w-[24rem] flex-col gap-3 md:flex ${
            desktopSidebarOpen ? '' : 'pointer-events-none'
          }`}
        >
          {/* Search */}
          <div
            className={`pointer-events-auto ${glassPanel} flex items-center gap-2 px-4 py-3`}
          >
            <Search className="h-4 w-4 shrink-0 text-white/70" />
            <input
              type="search"
              placeholder={L.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label={L.clear}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Categories + state selector + count + collapse */}
          <div
            className={`pointer-events-auto ${glassPanel} flex flex-col gap-3 px-4 py-3`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                {L.categories}
              </p>
              <button
                type="button"
                onClick={() => setDesktopSidebarOpen((v) => !v)}
                className="rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label={desktopSidebarOpen ? L.hideList : L.seeList}
                title={desktopSidebarOpen ? L.hideList : L.seeList}
              >
                {desktopSidebarOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {EXPLORER_CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat.slug);
                const iconSvg = getCategoryIconSvg(cat.slug);
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => toggleCategory(cat.slug)}
                    aria-pressed={active}
                    className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      active
                        ? 'border-transparent text-white shadow-lg'
                        : 'border-white/15 bg-white/5 text-white/85 hover:bg-white/10 hover:text-white'
                    }`}
                    style={
                      active
                        ? {
                            backgroundImage: `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)`,
                            boxShadow: `0 8px 20px -8px ${cat.color}80`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        active ? 'bg-white/25' : 'bg-white/10'
                      }`}
                    >
                      {iconSvg ? (
                        <Image
                          src={iconSvg}
                          alt=""
                          width={14}
                          height={14}
                          className="h-3.5 w-3.5 object-contain"
                          aria-hidden
                        />
                      ) : (
                        <span className="text-[11px] leading-none" aria-hidden>
                          {getCategoryEmoji(cat.slug)}
                        </span>
                      )}
                    </span>
                    {cat.name}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={selectedEstado}
                  onChange={(e) => setSelectedEstado(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-white/15 bg-white/5 py-2 pl-3 pr-8 text-xs font-medium text-white backdrop-blur transition focus:border-emerald-300/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                >
                  <option value="" className="bg-zinc-900 text-white">
                    {L.allStates}
                  </option>
                  {ESTADOS_MEXICO.map((e) => (
                    <option
                      key={e.slug}
                      value={e.slug}
                      className="bg-zinc-900 text-white"
                    >
                      {e.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/60" />
              </div>
              <span className="whitespace-nowrap rounded-full border border-emerald-300/40 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                {loadingPlaces ? '…' : L.placesCount(filteredPlaces.length)}
              </span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="whitespace-nowrap rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-white/25"
                >
                  {L.clear}
                </button>
              )}
            </div>
          </div>

          {/* Place list (collapsible) */}
          {desktopSidebarOpen && (
            <div
              ref={listRef}
              className={`pointer-events-auto scrollbar-none ${glassPanel} flex-1 overflow-y-auto`}
            >
              {filteredPlaces.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-4 py-16 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                    <MapPin className="h-5 w-5 text-white/60" />
                  </div>
                  <p className="text-sm font-medium text-white/80">
                    {L.noPlacesFound}
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    {L.tryOtherFilters}
                  </p>
                </div>
              ) : (
                filteredPlaces.map((place) => {
                  const isSelected = selectedPlace?.id === place.id;
                  const color = catColor(place.category);
                  return (
                    <button
                      key={place.id}
                      type="button"
                      data-place-id={place.id}
                      onClick={() => setSelectedPlace(place)}
                      className={`group flex w-full gap-3 border-b border-white/5 px-3 py-3 text-left transition-all duration-200 ${
                        isSelected
                          ? 'bg-white/10'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ring-1 ring-white/10 transition-transform duration-200 group-hover:scale-105"
                        style={{ backgroundColor: `${color}33` }}
                      >
                        {getCategoryIconSvg(place.category) ? (
                          <Image
                            src={getCategoryIconSvg(place.category) as string}
                            alt=""
                            width={26}
                            height={26}
                            className="h-6 w-6 object-contain"
                            aria-hidden
                          />
                        ) : (
                          getCategoryEmoji(place.category)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {place.name}
                        </p>
                        <p className="truncate text-xs text-white/60">
                          {place.stateName}
                        </p>
                        <span
                          className="mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-white/15"
                          style={{
                            backgroundColor: `${color}22`,
                            color: '#fff',
                          }}
                        >
                          {catName(place.category)}
                        </span>
                      </div>
                      {isSelected && (
                        <div
                          className="mt-1 h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </aside>

        {/* Categorías solo en el sidebar (desktop) y dentro del filter
            dropdown (mobile) — quitamos las dos barras flotantes que
            chocaban con el navbar y se sentían como una segunda nav. */}

        {/* ============= MOBILE TOP BAR (search + filters btn) ============= */}
        <div className="absolute inset-x-3 top-20 z-20 flex gap-2 md:hidden">
          <div
            className={`flex h-12 flex-1 items-center gap-2.5 px-4 ${glassPill}`}
          >
            <Search className="h-4 w-4 shrink-0 text-white/70" />
            <input
              type="search"
              placeholder={L.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[15px] text-white placeholder:text-white/55 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
                aria-label={L.clear}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowMobileFilters((v) => !v)}
            className={`relative flex h-12 w-12 shrink-0 items-center justify-center transition ${glassPill} ${
              showMobileFilters
                ? 'bg-emerald-500/35 text-white'
                : 'text-white'
            }`}
            aria-label={L.filters}
          >
            <SlidersHorizontal className="h-5 w-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white ring-2 ring-black/70">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* ============= MOBILE FILTERS DROPDOWN (categorías + estado) ============= */}
        {showMobileFilters && (
          <div
            className={`absolute inset-x-3 top-[8rem] z-30 ${glassPanel} animate-in fade-in slide-in-from-top-2 p-4 duration-200 md:hidden`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">
                {L.filters}
              </span>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
                aria-label={L.clear}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
              {L.categories}
            </p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {EXPLORER_CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat.slug);
                const iconSvg = getCategoryIconSvg(cat.slug);
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => toggleCategory(cat.slug)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? 'border-transparent text-white shadow-md'
                        : 'border-white/15 bg-white/5 text-white/85 hover:bg-white/10 hover:text-white'
                    }`}
                    style={
                      active
                        ? {
                            backgroundImage: `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)`,
                            boxShadow: `0 6px 16px -6px ${cat.color}80`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        active ? 'bg-white/25' : 'bg-white/10'
                      }`}
                    >
                      {iconSvg ? (
                        <Image
                          src={iconSvg}
                          alt=""
                          width={14}
                          height={14}
                          className="h-3.5 w-3.5 object-contain"
                          aria-hidden
                        />
                      ) : (
                        <span className="text-[11px] leading-none" aria-hidden>
                          {getCategoryEmoji(cat.slug)}
                        </span>
                      )}
                    </span>
                    {cat.name}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <select
                value={selectedEstado}
                onChange={(e) => setSelectedEstado(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/15 bg-white/5 px-3 py-2 pr-8 text-sm font-medium text-white focus:border-emerald-300/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
              >
                <option value="" className="bg-zinc-900 text-white">
                  {L.allStates}
                </option>
                {ESTADOS_MEXICO.map((e) => (
                  <option
                    key={e.slug}
                    value={e.slug}
                    className="bg-zinc-900 text-white"
                  >
                    {e.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/60" />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-white/70">
                {L.placesFound(filteredPlaces.length)}
              </span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/25"
                >
                  {L.clearFilters}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ============= MOBILE BOTTOM TAB: open list =============
            Hidden when a place popup is shown (would otherwise overlap on
            mobile where they both live at the bottom of the viewport). */}
        {!selectedPlace && (
          <div
            className="absolute inset-x-0 bottom-5 z-20 flex justify-center md:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <button
              type="button"
              onClick={() => setMobileSheetOpen(true)}
              className={`flex items-center gap-2.5 px-5 py-3 text-sm font-semibold text-white ${glassPill}`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/30 ring-1 ring-emerald-300/40">
                <ListFilter className="h-3.5 w-3.5 text-emerald-100" />
              </span>
              {loadingPlaces ? '…' : L.placesCount(filteredPlaces.length)}
            </button>
          </div>
        )}

        {/* ============= MOBILE BOTTOM SHEET WITH PLACE LIST ============= */}
        {mobileSheetOpen && (
          <div className="absolute inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileSheetOpen(false)}
            />
            <div
              className={`absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-hidden ${glassPanel} animate-in slide-in-from-bottom duration-200`}
              style={{ borderRadius: '24px 24px 0 0' }}
            >
              <div className="flex items-center justify-between px-4 pt-3">
                <span className="text-sm font-semibold text-white">
                  {loadingPlaces
                    ? '…'
                    : L.placesFound(filteredPlaces.length)}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileSheetOpen(false)}
                  className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
                  aria-label={L.hideList}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div
                className="mx-auto my-2 h-1 w-10 rounded-full bg-white/30"
                aria-hidden
              />
              <div
                className="scrollbar-none overflow-y-auto pb-4"
                style={{ maxHeight: 'calc(80dvh - 3rem)' }}
              >
                {filteredPlaces.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                      <MapPin className="h-5 w-5 text-white/60" />
                    </div>
                    <p className="text-sm font-medium text-white/80">
                      {L.noPlacesFound}
                    </p>
                  </div>
                ) : (
                  filteredPlaces.map((place) => {
                    const color = catColor(place.category);
                    return (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlace(place);
                          setMobileSheetOpen(false);
                        }}
                        className="group flex w-full gap-3 border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-white/5"
                      >
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ring-1 ring-white/10"
                          style={{ backgroundColor: `${color}33` }}
                        >
                          {getCategoryIconSvg(place.category) ? (
                            <Image
                              src={getCategoryIconSvg(place.category) as string}
                              alt=""
                              width={26}
                              height={26}
                              className="h-6 w-6 object-contain"
                              aria-hidden
                            />
                          ) : (
                            getCategoryEmoji(place.category)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">
                            {place.name}
                          </p>
                          <p className="truncate text-xs text-white/60">
                            {place.stateName}
                          </p>
                          <span
                            className="mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white ring-1 ring-white/15"
                            style={{ backgroundColor: `${color}22` }}
                          >
                            {catName(place.category)}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============= SELECTED PLACE POPUP ============= */}
        {selectedPlace && (
          <div
            key={selectedPlace.id}
            className={`animate-popup-fade-in absolute bottom-5 left-1/2 z-30 w-[min(94vw,28rem)] -translate-x-1/2 overflow-hidden ${glassPanel} md:bottom-6 md:left-auto md:right-6 md:translate-x-0`}
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div
              className="h-1.5"
              style={{
                backgroundImage: `linear-gradient(90deg, ${catColor(selectedPlace.category)}, ${catColor(selectedPlace.category)}99)`,
              }}
            />
            <div className="p-4">
              <button
                type="button"
                onClick={() => setSelectedPlace(null)}
                className="absolute right-3 top-4 rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={L.clear}
              >
                <X className="h-4 w-4" />
              </button>

              <span
                className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
                style={{ backgroundColor: catColor(selectedPlace.category) }}
              >
                {getCategoryIconSvg(selectedPlace.category) ? (
                  <Image
                    src={getCategoryIconSvg(selectedPlace.category) as string}
                    alt=""
                    width={14}
                    height={14}
                    className="h-3.5 w-3.5 object-contain"
                    aria-hidden
                  />
                ) : (
                  <span className="text-sm leading-none">
                    {getCategoryEmoji(selectedPlace.category)}
                  </span>
                )}
                {catName(selectedPlace.category)}
              </span>

              <h3 className="text-lg font-bold leading-tight text-white">
                {selectedPlace.name}
              </h3>
              <p className="mt-0.5 text-sm text-white/65">
                {selectedPlace.stateName}
              </p>

              {selectedPlace.description && (
                <p className="mt-2.5 text-sm leading-relaxed text-white/80 line-clamp-2">
                  {selectedPlace.description}
                </p>
              )}

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/lugares/${selectedPlace.slug}`}
                  className="flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110"
                  style={{
                    backgroundColor: catColor(selectedPlace.category),
                  }}
                >
                  {L.viewDetail}
                </Link>
                <button
                  type="button"
                  onClick={() => addPlaceToTrip(selectedPlace)}
                  className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/15"
                >
                  {L.addToRoute}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============= TOAST (add-to-route confirmation) ============= */}
        {toast && (
          <div
            className="pointer-events-none absolute left-1/2 top-32 z-[60] -translate-x-1/2 md:top-24"
            role="status"
            aria-live="polite"
          >
            <div
              className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm font-semibold text-white shadow-[0_24px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-2xl ${
                toast.tone === 'ok'
                  ? 'border-emerald-300/40 bg-emerald-500/25'
                  : 'border-amber-300/40 bg-amber-500/25'
              }`}
            >
              <span>{toast.msg}</span>
              {tripDraftCount > 0 && (
                <Link
                  href="/planear"
                  className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold transition hover:bg-white/30"
                >
                  {isEn ? 'Open' : 'Abrir'}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </MapProvider>
  );
}
