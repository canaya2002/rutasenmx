'use client';

import { useEffect, useRef, useCallback } from 'react';
import type maplibregl from 'maplibre-gl';
import { useMap } from '@/components/map/MapProvider';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface RouteWaypoint {
  lat: number;
  lng: number;
  name?: string;
  isToll?: boolean;
}

export interface RoutePreviewProps {
  /** Ordered list of route coordinates [[lng,lat], ...] */
  routeCoordinates: [number, number][];
  /** Stop markers along the route */
  stops?: RouteWaypoint[];
  /** Optional alternate route */
  alternateCoordinates?: [number, number][];
  /** Whether to show distance labels */
  showDistanceLabels?: boolean;
  /** Route line color */
  color?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const SOURCE_MAIN = 'route-main';
const SOURCE_ALT = 'route-alt';
const LAYER_MAIN = 'route-main-line';
const LAYER_ALT = 'route-alt-line';
const LAYER_MAIN_CASING = 'route-main-casing';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function RoutePreview({
  routeCoordinates,
  stops,
  alternateCoordinates,
  showDistanceLabels = false,
  color = '#C4532B',
}: RoutePreviewProps) {
  const { map, isReady } = useMap();
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const cleanup = useCallback(() => {
    if (!map) return;

    /* Remove markers */
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    /* Remove layers + sources (guard against missing) */
    [LAYER_MAIN, LAYER_MAIN_CASING, LAYER_ALT].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    [SOURCE_MAIN, SOURCE_ALT].forEach((id) => {
      if (map.getSource(id)) map.removeSource(id);
    });
  }, [map]);

  const draw = useCallback(async () => {
    if (!map || routeCoordinates.length < 2) return;

    const maplibreglLib = (await import('maplibre-gl')).default;

    cleanup();

    /* ── Main route source ─────────────────────────────────── */
    map.addSource(SOURCE_MAIN, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: routeCoordinates },
      },
    });

    /* Casing (wider line underneath for contrast) */
    map.addLayer({
      id: LAYER_MAIN_CASING,
      type: 'line',
      source: SOURCE_MAIN,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#ffffff',
        'line-width': 8,
        'line-opacity': 0.7,
      },
    });

    /* Main line */
    map.addLayer({
      id: LAYER_MAIN,
      type: 'line',
      source: SOURCE_MAIN,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': color,
        'line-width': 5,
      },
    });

    /* ── Alternate route ───────────────────────────────────── */
    if (alternateCoordinates && alternateCoordinates.length >= 2) {
      map.addSource(SOURCE_ALT, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: alternateCoordinates,
          },
        },
      });
      map.addLayer({
        id: LAYER_ALT,
        type: 'line',
        source: SOURCE_ALT,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#94a3b8',
          'line-width': 4,
          'line-dasharray': [2, 2],
          'line-opacity': 0.6,
        },
      });
    }

    /* ── Stop markers ──────────────────────────────────────── */
    if (stops?.length) {
      stops.forEach((stop, idx) => {
        const el = document.createElement('div');
        const isToll = stop.isToll === true;
        const bg = isToll ? '#475569' : color;
        const label = isToll ? '$' : String(idx + 1);

        el.innerHTML = `<div style="
          width:24px;height:24px;border-radius:50%;
          background:${bg};color:#fff;
          display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:700;
          border:2px solid #fff;
          box-shadow:0 1px 4px rgba(0,0,0,.3);
        ">${label}</div>`;

        const marker = new maplibreglLib.Marker({ element: el })
          .setLngLat([stop.lng, stop.lat])
          .addTo(map);

        if (stop.name) {
          marker.setPopup(
            new maplibreglLib.Popup({ offset: 20, closeButton: false }).setText(
              stop.name,
            ),
          );
        }

        markersRef.current.push(marker);
      });
    }

    /* ── Fit bounds to route ───────────────────────────────── */
    const allCoords = [
      ...routeCoordinates,
      ...(alternateCoordinates ?? []),
    ];
    const lngs = allCoords.map((c) => c[0]);
    const lats = allCoords.map((c) => c[1]);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 60 },
    );
  }, [map, routeCoordinates, alternateCoordinates, stops, color, cleanup]);

  /* Draw whenever map is ready or data changes */
  useEffect(() => {
    if (isReady) draw();
    return () => cleanup();
  }, [isReady, draw, cleanup]);

  /* This component renders nothing to the React tree */
  return null;
}
