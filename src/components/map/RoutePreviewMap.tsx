'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type maplibregl from 'maplibre-gl';
import Link from 'next/link';
import { ExternalLink, Navigation, Copy, Check } from 'lucide-react';
import { useTranslation, useLocale } from '@/components/providers/LocaleProvider';
import { MEXICO_CENTER, MEXICO_ZOOM } from '@/lib/constants';
import { MAP_STYLE_URL } from '@/lib/map-config';
import { registerCategoryIcons } from '@/components/map/categoryIcons';
import {
  googleMapsRouteUrl,
  appleMapsRouteUrl,
  wazeRouteUrl,
  googleMapsPlaceUrl,
  type Coord,
} from '@/lib/maps/deeplinks';

export interface RoutePreviewStop extends Coord {
  id: string;
  name: string;
  category?: string;
  order?: number;
  slug?: string;
}

interface Props {
  stops: RoutePreviewStop[];
  /** Draw a line through the stops in order */
  trace?: boolean;
  /** Primary label for the directions button */
  title?: string;
  /** Extra classes for the map container */
  className?: string;
  /** Height in CSS units */
  height?: string;
  /** Primary colour for the trace line */
  color?: string;
}

/**
 * Client-side mini map: renders all stops, optionally connects them with a
 * polyline, fits bounds, and offers deep-link buttons to open the route in
 * Google / Apple Maps / Waze.
 */
export function RoutePreviewMap({
  stops,
  trace = true,
  title,
  className = '',
  height = 'h-[360px]',
  color = '#06C167',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const t = useTranslation();
  const { locale } = useLocale();
  const isEn = locale === 'en';

  const stopsRef = useRef(stops);
  stopsRef.current = stops;

  const init = useCallback(async () => {
    if (!containerRef.current || mapRef.current) return;
    try {
      const maplibreglLib = (await import('maplibre-gl')).default;
      await import('maplibre-gl/dist/maplibre-gl.css');

      const map = new maplibreglLib.Map({
        container: containerRef.current,
        style: MAP_STYLE_URL,
        center: [MEXICO_CENTER.lng, MEXICO_CENTER.lat],
        zoom: MEXICO_ZOOM,
        attributionControl: { compact: true },
        interactive: true,
        cooperativeGestures: true,
      });

      map.addControl(
        new maplibreglLib.NavigationControl({ showCompass: false }),
        'top-right',
      );

      map.on('load', async () => {
        mapRef.current = map;
        await registerCategoryIcons(
          map as unknown as Parameters<typeof registerCategoryIcons>[0],
        ).catch(() => {});
        setReady(true);
      });
      map.on('error', (e: { error?: { message?: string } }) => console.warn('[RoutePreviewMap]', e.error?.message));
    } catch (err) {
      console.error('RoutePreviewMap init failed', err);
      setError('init-failed');
    }
  }, []);

  // Lazy-init when on screen (saves Mapbox sessions when the map is below the fold)
  useEffect(() => {
    if (!containerRef.current) return;
    if (typeof IntersectionObserver === 'undefined') {
      init();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          init();
          io.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(containerRef.current);
    return () => io.disconnect();
  }, [init]);

  // Render stops whenever they change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    // Map may have been removed between ready-toggle and this effect.
    let alive = true;
    try {
      alive = typeof map.getStyle === 'function' && !!map.getStyle();
    } catch {
      alive = false;
    }
    if (!alive) return;

    const sourceId = 'preview-route-source';
    const lineId = 'preview-route-line';
    const lineCasingId = 'preview-route-line-casing';
    const pointSourceId = 'preview-route-points';
    const iconLayerId = 'preview-route-icons';
    const numberLayerId = 'preview-route-numbers';

    const safe = (fn: () => void) => {
      try { fn(); } catch { /* map removed mid-update */ }
    };

    for (const id of [numberLayerId, iconLayerId, lineId, lineCasingId]) {
      safe(() => { if (map.getLayer(id)) map.removeLayer(id); });
    }
    safe(() => { if (map.getSource(sourceId)) map.removeSource(sourceId); });
    safe(() => { if (map.getSource(pointSourceId)) map.removeSource(pointSourceId); });

    if (stops.length === 0) return;

    // Line
    if (trace && stops.length > 1) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: stops.map((s) => [s.lng, s.lat]),
          },
        },
      });
      map.addLayer({
        id: lineCasingId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#ffffff',
          'line-width': 7,
          'line-opacity': 0.9,
        },
      });
      map.addLayer({
        id: lineId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': color,
          'line-width': 4,
          'line-dasharray': [0.5, 1.5],
        },
      });
    }

    // Points
    map.addSource(pointSourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: stops.map((s, i) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
          properties: {
            id: s.id,
            name: s.name,
            order: s.order ?? i + 1,
            category: s.category ?? '',
          },
        })),
      },
    });

    // Category icon (falls back to number-only circle if icon not registered)
    map.addLayer({
      id: iconLayerId,
      type: 'symbol',
      source: pointSourceId,
      layout: {
        'icon-image': [
          'case',
          ['!=', ['get', 'category'], ''],
          ['concat', 'cat-', ['get', 'category']],
          '',
        ],
        'icon-size': [
          'interpolate', ['linear'], ['zoom'],
          4, 0.75,
          9, 1.0,
          13, 1.2,
        ],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-anchor': 'bottom',
      } as maplibregl.LayerSpecification['layout'],
    });

    // Number badge
    map.addLayer({
      id: numberLayerId,
      type: 'symbol',
      source: pointSourceId,
      layout: {
        'text-field': ['to-string', ['get', 'order']],
        'text-font': ['Noto Sans Bold'],
        'text-size': 15,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
        'text-offset': [0, -3.2],
      } as maplibregl.LayerSpecification['layout'],
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': color,
        'text-halo-width': 3.5,
      },
    });

    // Fit bounds
    if (stops.length === 1) {
      map.easeTo({ center: [stops[0].lng, stops[0].lat], zoom: 12, duration: 400 });
    } else {
      const lats = stops.map((s) => s.lat);
      const lngs = stops.map((s) => s.lng);
      const sw: [number, number] = [Math.min(...lngs), Math.min(...lats)];
      const ne: [number, number] = [Math.max(...lngs), Math.max(...lats)];
      try {
        map.fitBounds([sw, ne], { padding: 48, duration: 400, maxZoom: 10 });
      } catch {
        map.easeTo({ center: [lngs[0], lats[0]], zoom: 6, duration: 200 });
      }
    }
  }, [ready, stops, trace, color]);

  // Teardown
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch {}
        mapRef.current = null;
      }
    };
  }, []);

  const gmapsUrl =
    stops.length <= 1 ? (stops[0] ? googleMapsPlaceUrl(stops[0]) : '#') : googleMapsRouteUrl(stops);
  const appleUrl =
    stops.length <= 1
      ? stops[0]
        ? `https://maps.apple.com/?ll=${stops[0].lat.toFixed(6)},${stops[0].lng.toFixed(6)}&q=${encodeURIComponent(stops[0].name ?? 'Destino')}`
        : '#'
      : appleMapsRouteUrl(stops);
  const wazeUrl = stops[stops.length - 1] ? wazeRouteUrl(stops[stops.length - 1]) : '#';

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(gmapsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt(isEn ? 'Copy URL' : 'Copiar URL', gmapsUrl);
    }
  };

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {/* Header with title + stop count */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {isEn ? 'Route preview' : 'Vista previa de la ruta'}
          </p>
          <p className="text-sm font-semibold text-slate-800">
            {title ?? (stops.length > 0 ? stops[0].name : (isEn ? 'Map' : 'Mapa'))}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
          {stops.length} {stops.length === 1 ? (isEn ? 'stop' : 'parada') : (isEn ? 'stops' : 'paradas')}
        </span>
      </div>

      {/* Map canvas */}
      <div className="relative">
        {error ? (
          <div className={`${height} flex w-full items-center justify-center bg-slate-50 p-6 text-center`}>
            <p className="text-sm text-slate-500">
              {t.map.loadError}
            </p>
          </div>
        ) : (
          <div ref={containerRef} className={`${height} w-full`} aria-label={t.map.interactive} />
        )}

        {/* Floating legend */}
        {stops.length > 0 && !error && (
          <div className="pointer-events-none absolute left-3 top-3 max-w-[60%] rounded-xl bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-md ring-1 ring-black/5 backdrop-blur-sm">
            <span className="font-semibold text-slate-900">
              {stops[0].name}
            </span>
            {stops.length > 1 && (
              <>
                <span className="text-slate-400"> → </span>
                <span className="font-semibold text-slate-900">
                  {stops[stops.length - 1].name}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 p-3">
        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#06C167] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
        >
          <Navigation className="h-4 w-4" />
          {isEn ? 'Open in Google Maps' : 'Abrir en Google Maps'}
        </a>
        <a
          href={appleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <ExternalLink className="h-4 w-4" />
          {isEn ? 'Apple Maps' : 'Apple Maps'}
        </a>
        <a
          href={wazeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <ExternalLink className="h-4 w-4" />
          Waze
        </a>
        <button
          type="button"
          onClick={copyUrl}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          {copied ? (isEn ? 'Copied' : 'Copiado') : (isEn ? 'Copy link' : 'Copiar enlace')}
        </button>
      </div>

      {/* Mini stop list (max 12) */}
      {stops.length > 1 && (
        <ol className="divide-y divide-slate-100 border-t border-slate-100 text-sm">
          {stops.slice(0, 12).map((s, i) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-2">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {s.order ?? i + 1}
              </span>
              {s.slug ? (
                <Link href={`/lugares/${s.slug}`} className="flex-1 truncate text-slate-800 hover:text-[#06C167]">
                  {s.name}
                </Link>
              ) : (
                <span className="flex-1 truncate text-slate-800">{s.name}</span>
              )}
              <a
                href={googleMapsPlaceUrl(s)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#06C167] hover:underline"
                aria-label={isEn ? `Open ${s.name} in Google Maps` : `Abrir ${s.name} en Google Maps`}
              >
                {isEn ? 'Open →' : 'Abrir →'}
              </a>
            </li>
          ))}
          {stops.length > 12 && (
            <li className="px-4 py-2 text-xs text-slate-500">
              +{stops.length - 12} {isEn ? 'more stops' : 'paradas más'}
            </li>
          )}
        </ol>
      )}
    </div>
  );
}

