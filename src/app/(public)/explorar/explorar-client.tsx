'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';
import Link from 'next/link';
import { MapProvider, useMap } from '@/components/map/MapProvider';
import MapView from '@/components/map/MapView';
import { Search, SlidersHorizontal, X, ChevronDown, MapPin } from 'lucide-react';
import Image from 'next/image';
import { mockPlaces, type MockPlace } from '@/lib/data/mock';
import { PLACE_CATEGORIES, ESTADOS_MEXICO } from '@/lib/constants';
import { useLocale } from '@/components/providers/LocaleProvider';
import { registerCategoryIcons, categoryImageId } from '@/components/map/categoryIcons';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ExplorarClientProps {
  initialCategory: string;
  initialEstado: string;
  initialSearch: string;
}

/* ------------------------------------------------------------------ */
/*  Emoji mapping for map symbols & UI                                 */
/* ------------------------------------------------------------------ */
const CATEGORY_EMOJI: Record<string, string> = {
  'pueblos-magicos': '\u2728',
  'museos': '\uD83C\uDFDB\uFE0F',
  'zonas-arqueologicas': '\uD83C\uDFFA',
  'playas': '\uD83C\uDFD6\uFE0F',
  'cenotes': '\uD83D\uDCA7',
  'cascadas': '\uD83C\uDF0A',
  'haciendas': '\uD83C\uDFE1',
  'centros-historicos': '\u26EA',
};

const DEFAULT_EMOJI = '\uD83D\uDCCD';

function getCategoryEmoji(slug: string): string {
  return CATEGORY_EMOJI[slug] ?? PLACE_CATEGORIES.find((c) => c.slug === slug)?.emoji ?? DEFAULT_EMOJI;
}

function getCategoryIconSvg(slug: string): string | null {
  const cat = PLACE_CATEGORIES.find((c) => c.slug === slug);
  return (cat && 'iconSvg' in cat ? (cat.iconSvg as string | undefined) : undefined) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function catColor(slug: string) {
  return PLACE_CATEGORIES.find((c) => c.slug === slug)?.color ?? '#6B7280';
}
function catName(slug: string) {
  return PLACE_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

/* ------------------------------------------------------------------ */
/*  MapMarkers                                                         */
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
    const clusterLayerId = 'places-clusters';
    const clusterCountId = 'places-cluster-count';
    const symbolLayerId = 'places-symbols';
    const emojiFallbackLayerId = 'places-emoji-fallback';
    const selectedLayerId = 'places-selected';

    // Clean up previous layers/source
    for (const id of [selectedLayerId, emojiFallbackLayerId, symbolLayerId, clusterCountId, clusterLayerId]) {
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

    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 12,
      clusterRadius: 50,
    });

    // Kick off SVG icon registration. We do NOT await — layers referencing the
    // icons rely on the `styleimagemissing` handler (wired inside
    // registerCategoryIcons) to lazy-load on demand. But to avoid the initial
    // flash we also prime the browser cache for every category SVG synchronously.
    for (const c of PLACE_CATEGORIES) {
      const svg = (c as { iconSvg?: string }).iconSvg;
      if (!svg) continue;
      const img = new window.Image();
      img.src = svg;
    }
    registerCategoryIcons(
      map as unknown as Parameters<typeof registerCategoryIcons>[0],
    ).catch(() => {});

    /* ---- Cluster circles ---- */
    map.addLayer({
      id: clusterLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#1a1a1a',
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20, // default
          10, 26,
          50, 34,
          100, 40,
        ],
        'circle-stroke-width': 3,
        'circle-stroke-color': 'rgba(255,255,255,0.9)',
        'circle-opacity': 0.92,
      },
    });

    /* ---- Cluster count text ---- */
    map.addLayer({
      id: clusterCountId,
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 15,
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#ffffff',
      },
    });

    /* ---- Individual place SVG icons (for mapped categories) ---- */
    map.addLayer({
      id: symbolLayerId,
      type: 'symbol',
      source: sourceId,
      filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'hasIcon'], 1]],
      layout: {
        'icon-image': ['concat', 'cat-', ['get', 'category']],
        // Scale with zoom (base image ≈ 80px @ pixelRatio 2, so 1.0 = 80px).
        'icon-size': [
          'interpolate', ['linear'], ['zoom'],
          4, 0.65,
          7, 0.9,
          11, 1.1,
          15, 1.3,
        ],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-anchor': 'bottom',
      },
    } as maplibregl.LayerSpecification);

    /* ---- Emoji fallback for categories without an SVG icon ---- */
    map.addLayer({
      id: emojiFallbackLayerId,
      type: 'symbol',
      source: sourceId,
      filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'hasIcon'], 0]],
      layout: {
        'text-field': ['match', ['get', 'category'],
          'cascadas', '\uD83C\uDF0A',
          'bosques-sierras', '\uD83C\uDF32',
          'vinedos', '\uD83C\uDF47',
          'grutas', '\uD83E\uDEA8',
          'miradores', '\uD83D\uDC41\uFE0F',
          '\uD83D\uDCCD',
        ],
        'text-size': [
          'interpolate', ['linear'], ['zoom'],
          4, 22,
          7, 28,
          11, 34,
          15, 40,
        ],
        'text-allow-overlap': true,
        'icon-allow-overlap': true,
      },
    } as maplibregl.LayerSpecification);

    /* ---- Selected point highlight ring ---- */
    map.addLayer({
      id: selectedLayerId,
      type: 'circle',
      source: sourceId,
      filter: selectedId ? ['==', ['get', 'id'], selectedId] : ['==', ['get', 'id'], ''],
      paint: {
        'circle-color': 'transparent',
        'circle-radius': 20,
        'circle-stroke-width': 3,
        'circle-stroke-color': '#06C167',
        'circle-stroke-opacity': 0.8,
      },
    });

    /* ---- Click cluster to zoom ---- */
    const onClusterClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [clusterLayerId] });
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

    /* ---- Click marker to select ---- */
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

    // Cursor hints
    const ptrEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
    const ptrLeave = () => { map.getCanvas().style.cursor = ''; };

    map.on('mouseenter', symbolLayerId, ptrEnter);
    map.on('mouseleave', symbolLayerId, ptrLeave);
    map.on('mouseenter', emojiFallbackLayerId, ptrEnter);
    map.on('mouseleave', emojiFallbackLayerId, ptrLeave);
    map.on('mouseenter', clusterLayerId, ptrEnter);
    map.on('mouseleave', clusterLayerId, ptrLeave);

    return () => {
      // Guard: after map.remove() fires (e.g. on navigation) maplibre-gl zeros out
      // `map.style`, so any subsequent getLayer/getSource would throw
      // `Cannot read properties of undefined (reading 'getOwnLayer')`.
      const isAlive = (() => {
        try {
          return typeof map.getStyle === 'function' && !!map.getStyle();
        } catch {
          return false;
        }
      })();
      if (!isAlive) return;

      const safe = (fn: () => void) => {
        try { fn(); } catch { /* map may have been removed already */ }
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

      for (const id of [selectedLayerId, emojiFallbackLayerId, symbolLayerId, clusterCountId, clusterLayerId]) {
        safe(() => { if (map.getLayer(id)) map.removeLayer(id); });
      }
      safe(() => { if (map.getSource(sourceId)) map.removeSource(sourceId); });
    };
  }, [map, isReady, places, onSelect, selectedId]);

  // Update selected filter when selectedId changes (without rebuilding layers)
  useEffect(() => {
    if (!map || !isReady) return;
    const selectedLayerId = 'places-selected';
    try {
      if (map.getLayer(selectedLayerId)) {
        map.setFilter(
          selectedLayerId,
          selectedId ? ['==', ['get', 'id'], selectedId] : ['==', ['get', 'id'], ''],
        );
      }
    } catch {
      /* map was removed between render and effect */
    }
  }, [map, isReady, selectedId]);

  return null;
}

/* ------------------------------------------------------------------ */
/*  Sidebar FlyTo helper                                               */
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
/*  Primary top-level categories used in the explorer sidebar          */
/* ------------------------------------------------------------------ */
const EXPLORER_CATEGORIES = PLACE_CATEGORIES.slice(0, 8);

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function ExplorarClient({
  initialCategory,
  initialEstado,
  initialSearch,
}: ExplorarClientProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const L = {
    searchPlaceholder: isEn ? 'Search place, state…' : 'Buscar lugar, estado...',
    searchShort: isEn ? 'Search…' : 'Buscar...',
    allStates: isEn ? 'All states' : 'Todos los estados',
    placesCount: (n: number) => isEn ? `${n} places` : `${n} lugares`,
    placesFound: (n: number) => isEn ? `${n} places found` : `${n} lugares encontrados`,
    clear: isEn ? 'Clear' : 'Limpiar',
    clearFilters: isEn ? 'Clear filters' : 'Limpiar filtros',
    noPlacesFound: isEn ? 'No places found' : 'No se encontraron lugares',
    tryOtherFilters: isEn ? 'Try other filters or search terms' : 'Intenta con otros filtros o términos de búsqueda',
    filters: isEn ? 'Filters' : 'Filtros',
    viewDetail: isEn ? 'View detail' : 'Ver detalle',
    addToRoute: isEn ? 'Add to route' : 'Agregar a ruta',
  };
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : [],
  );
  const [selectedEstado, setSelectedEstado] = useState(initialEstado);
  const [selectedPlace, setSelectedPlace] = useState<MockPlace | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  /* ---------- Filter ---------- */
  const filteredPlaces = useMemo(() => {
    let result = [...mockPlaces];

    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }
    if (selectedEstado) {
      result = result.filter((p) => p.stateSlug === selectedEstado);
    }
    if (searchQuery.trim()) {
      const q = searchQuery
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      result = result.filter((p) => {
        const name = p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const desc = p.description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const state = p.stateName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return name.includes(q) || desc.includes(q) || state.includes(q);
      });
    }

    return result;
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

  /* Scroll sidebar to selected item */
  useEffect(() => {
    if (!selectedPlace || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-place-id="${selectedPlace.id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedPlace]);

  const activeFilterCount = selectedCategories.length + (selectedEstado ? 1 : 0);

  return (
    <MapProvider>
      <div className="flex h-[calc(100dvh-4rem)] w-full">
        {/* =============================== LEFT SIDEBAR =============================== */}
        <aside className="relative hidden w-[26rem] shrink-0 flex-col overflow-hidden border-r border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50 md:flex">
          {/* Decorative blur blobs */}
          <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-300/30 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -left-8 bottom-1/4 h-48 w-48 rounded-full bg-sky-300/20 blur-3xl" />

          {/* -- Glass search -- */}
          <div className="relative z-10 px-4 pb-3 pt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder={L.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-white/70 bg-white/70 py-3 pl-11 pr-4 text-sm text-slate-900 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.15)] ring-1 ring-slate-200/60 backdrop-blur-xl transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              />
            </div>
          </div>

          {/* -- Premium category chips -- */}
          <div className="relative z-10 px-4 pb-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {isEn ? 'Categories' : 'Categorías'}
            </p>
            <div className="flex flex-wrap gap-2">
              {EXPLORER_CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat.slug);
                const iconSvg = getCategoryIconSvg(cat.slug);
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => toggleCategory(cat.slug)}
                    aria-pressed={active}
                    className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-all duration-200 ${
                      active
                        ? 'border-transparent text-white shadow-lg shadow-emerald-500/10'
                        : 'border-slate-200/80 bg-white/70 text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md'
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
                        active ? 'bg-white/25' : ''
                      }`}
                      style={!active ? { backgroundColor: `${cat.color}18` } : undefined}
                    >
                      {iconSvg ? (
                        <Image
                          src={iconSvg}
                          alt=""
                          width={14}
                          height={14}
                          className={`h-3.5 w-3.5 object-contain ${active ? 'brightness-0 invert' : ''}`}
                          aria-hidden
                        />
                      ) : (
                        <span className="text-[11px] leading-none" aria-hidden>{getCategoryEmoji(cat.slug)}</span>
                      )}
                    </span>
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* -- Glass state selector + count -- */}
          <div className="relative z-10 flex items-center gap-2 border-t border-slate-100/80 px-4 py-3">
            <div className="relative flex-1">
              <select
                value={selectedEstado}
                onChange={(e) => setSelectedEstado(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200/70 bg-white/80 py-2 pl-3 pr-8 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm transition focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
              >
                <option value="">{L.allStates}</option>
                {ESTADOS_MEXICO.map((e) => (
                  <option key={e.slug} value={e.slug}>
                    {e.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            </div>
            <span className="whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              {L.placesCount(filteredPlaces.length)}
            </span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="whitespace-nowrap rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-slate-700"
              >
                {L.clear}
              </button>
            )}
          </div>

          {/* -- Place list -- */}
          <div ref={listRef} className="flex-1 overflow-y-auto">
            {filteredPlaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <MapPin className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500">
                  {L.noPlacesFound}
                </p>
                <p className="mt-1 text-xs text-slate-400">
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
                    className={`group flex w-full gap-3 border-b border-slate-50 px-3 py-3 text-left transition-all duration-200 ${
                      isSelected
                        ? 'bg-slate-50 ring-inset ring-1 ring-slate-200'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {/* SVG icon avatar (fallback to emoji) */}
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl transition-transform duration-200 group-hover:scale-105"
                      style={{ backgroundColor: `${color}18` }}
                    >
                      {getCategoryIconSvg(place.category) ? (
                        <Image
                          src={getCategoryIconSvg(place.category) as string}
                          alt=""
                          width={28}
                          height={28}
                          className="h-7 w-7 object-contain"
                          aria-hidden
                        />
                      ) : (
                        getCategoryEmoji(place.category)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{place.name}</p>
                      <p className="truncate text-xs text-slate-500">{place.stateName}</p>
                      <span
                        className="mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: `${color}14`, color }}
                      >
                        {catName(place.category)}
                      </span>
                    </div>
                    {/* Selection indicator dot */}
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
        </aside>

        {/* =============================== MAP AREA =============================== */}
        <div className="relative flex-1">
          <MapView className="h-full w-full" />
          <MapMarkers
            places={filteredPlaces}
            onSelect={setSelectedPlace}
            selectedId={selectedPlace?.id ?? null}
          />

          {/* FlyTo when place selected */}
          {selectedPlace && (
            <MapFlyTo lat={selectedPlace.lat} lng={selectedPlace.lng} />
          )}

          {/* -- Floating category chips over the map (desktop + mobile) -- */}
          <div className="pointer-events-none absolute left-0 right-0 top-3 z-10 flex justify-center px-3">
            <div className="scrollbar-none pointer-events-auto flex max-w-full gap-1.5 overflow-x-auto rounded-full border border-white/60 bg-white/70 p-1.5 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.25)] ring-1 ring-black/5 backdrop-blur-xl">
              {EXPLORER_CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat.slug);
                const iconSvg = getCategoryIconSvg(cat.slug);
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => toggleCategory(cat.slug)}
                    className={`group inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? 'text-white shadow-md'
                        : 'text-slate-700 hover:bg-white/80'
                    }`}
                    style={
                      active
                        ? {
                            backgroundImage: `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)`,
                            boxShadow: `0 6px 16px -6px ${cat.color}80`,
                          }
                        : undefined
                    }
                    aria-pressed={active}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full transition ${
                        active ? 'bg-white/25' : 'group-hover:scale-110'
                      }`}
                      style={!active ? { backgroundColor: `${cat.color}1c` } : undefined}
                    >
                      {iconSvg ? (
                        <Image
                          src={iconSvg}
                          alt=""
                          width={14}
                          height={14}
                          className={`h-3.5 w-3.5 object-contain ${active ? 'brightness-0 invert' : ''}`}
                          aria-hidden
                        />
                      ) : (
                        <span className="text-[11px] leading-none" aria-hidden>{getCategoryEmoji(cat.slug)}</span>
                      )}
                    </span>
                    <span className="hidden sm:inline">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* -- Mobile search bar (glass) -- */}
          <div className="absolute left-3 right-3 top-16 z-10 flex gap-2 md:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder={L.searchShort}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-white/60 bg-white/75 py-2.5 pl-10 pr-3 text-sm shadow-[0_8px_24px_-8px_rgba(15,23,42,0.25)] ring-1 ring-black/5 backdrop-blur-xl placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/75 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.25)] ring-1 ring-black/5 backdrop-blur-xl transition hover:bg-white"
            >
              <SlidersHorizontal className="h-4 w-4 text-slate-700" />
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white ring-2 ring-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* -- Mobile filters dropdown (glass) -- */}
          {showFilters && (
            <div className="absolute left-3 right-3 top-28 z-20 rounded-3xl border border-white/60 bg-white/80 p-4 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.35)] ring-1 ring-black/5 backdrop-blur-xl md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">{L.filters}</span>
                <button type="button" onClick={() => setShowFilters(false)} className="rounded-full p-1 hover:bg-slate-100">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
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
                          : 'border-slate-200 bg-white/80 text-slate-700 hover:bg-white'
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
                        className={`flex h-5 w-5 items-center justify-center rounded-full ${active ? 'bg-white/25' : ''}`}
                        style={!active ? { backgroundColor: `${cat.color}1c` } : undefined}
                      >
                        {iconSvg ? (
                          <Image
                            src={iconSvg}
                            alt=""
                            width={14}
                            height={14}
                            className={`h-3.5 w-3.5 object-contain ${active ? 'brightness-0 invert' : ''}`}
                            aria-hidden
                          />
                        ) : (
                          <span className="text-[11px] leading-none" aria-hidden>{getCategoryEmoji(cat.slug)}</span>
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
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-8 text-sm font-medium text-slate-700 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                >
                  <option value="">{L.allStates}</option>
                  {ESTADOS_MEXICO.map((e) => (
                    <option key={e.slug} value={e.slug}>
                      {e.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {L.placesFound(filteredPlaces.length)}
                </span>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-700"
                  >
                    {L.clearFilters}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* =============================== SELECTED PLACE POPUP =============================== */}
          {selectedPlace && (
            <div
              key={selectedPlace.id}
              className="animate-popup-fade-in absolute bottom-4 left-4 right-4 z-20 mx-auto max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white/85 shadow-[0_24px_80px_-20px_rgba(15,23,42,0.4)] ring-1 ring-black/5 backdrop-blur-2xl md:left-auto md:right-4 md:w-96"
            >
              {/* Category color accent bar */}
              <div
                className="h-1.5"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${catColor(selectedPlace.category)}, ${catColor(selectedPlace.category)}99)`,
                }}
              />

              <div className="p-4">
                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setSelectedPlace(null)}
                  className="absolute right-3 top-4 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Category badge with SVG icon (fallback to emoji) */}
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
                      className="h-3.5 w-3.5 object-contain brightness-0 invert"
                      aria-hidden
                    />
                  ) : (
                    <span className="text-sm leading-none">{getCategoryEmoji(selectedPlace.category)}</span>
                  )}
                  {catName(selectedPlace.category)}
                </span>

                {/* Name + state */}
                <h3 className="text-lg font-bold leading-tight text-slate-900">
                  {selectedPlace.name}
                </h3>
                <p className="mt-0.5 text-sm text-slate-500">{selectedPlace.stateName}</p>

                {/* Description (2 lines max) */}
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600 line-clamp-2">
                  {selectedPlace.description}
                </p>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/lugares/${selectedPlace.slug}`}
                    className="flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110"
                    style={{ backgroundColor: catColor(selectedPlace.category) }}
                  >
                    {L.viewDetail}
                  </Link>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    {L.addToRoute}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </MapProvider>
  );
}
