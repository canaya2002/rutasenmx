'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import type maplibregl from 'maplibre-gl';
import { useMap } from './MapProvider';
import { MEXICO_CENTER, MEXICO_ZOOM } from '@/lib/constants';
import { MAP_STYLE_URL } from '@/lib/map-config';
import { useTranslation } from '@/components/providers/LocaleProvider';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  category?: string;
  name?: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapViewProps {
  /** Called once the map finishes loading */
  onMapLoad?: (map: unknown) => void;
  /** Markers to display */
  markers?: MapPin[];
  /** If supplied the map will fit these bounds on mount */
  bounds?: MapBounds;
  /** Tailwind classes for the wrapper div */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function MapView({
  onMapLoad,
  markers: _markers,
  bounds,
  className = '',
}: MapViewProps) {
  const t = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const { setMap } = useMap();
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* Stable callback so we can pass to the effect without re-running */
  const onMapLoadRef = useRef(onMapLoad);
  onMapLoadRef.current = onMapLoad;

  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;

  const initMap = useCallback(async () => {
    if (!containerRef.current || mapInstanceRef.current) return;

    try {
      /* Dynamically import maplibre-gl so the CSS is only loaded client-side */
      const maplibregl = (await import('maplibre-gl')).default;
      await import('maplibre-gl/dist/maplibre-gl.css');

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE_URL,
        center: [MEXICO_CENTER.lng, MEXICO_CENTER.lat],
        zoom: MEXICO_ZOOM,
        attributionControl: { compact: true },
      });

      /* Controls */
      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }),
        'top-right',
      );
      map.addControl(new maplibregl.ScaleControl({ maxWidth: 200 }), 'bottom-left');

      map.on('load', () => {
        mapInstanceRef.current = map;
        setMap(map);

        /* Fit bounds if provided */
        if (boundsRef.current) {
          const { west, south, east, north } = boundsRef.current;
          map.fitBounds(
            [
              [west, south],
              [east, north],
            ],
            { padding: 40 },
          );
        }

        onMapLoadRef.current?.(map);
      });

      map.on('error', (e: { error?: { message?: string } }) => {
        console.warn('Map error:', e.error?.message || e);
      });
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setError('init-failed');
    }
  }, [setMap]);

  /* Mount / cleanup */
  useEffect(() => {
    initMap();

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // Map may already be partially destroyed during navigation
        }
        mapInstanceRef.current = null;
        setMap(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Fallback when no token is configured */
  if (error) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-slate-50 ${className}`}
        aria-label={t.map.unavailable}
      >
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-900">
            {t.map.unavailable}
          </h3>
          <p className="text-sm text-slate-500">
            {t.map.loadError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`h-full w-full ${className}`}
      aria-label={t.map.interactive}
    />
  );
}
