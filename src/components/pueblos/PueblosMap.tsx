'use client';

import { useEffect, useRef, useState } from 'react';
import type maplibregl from 'maplibre-gl';
import Link from 'next/link';
import { MAP_STYLE_URL } from '@/lib/map-config';
import { MEXICO_CENTER, MEXICO_ZOOM, MEXICO_BOUNDS } from '@/lib/constants';

export interface PuebloPin {
  id: string;
  slug: string;
  estadoSlug: string;
  name: string;
  estado: string;
  macroregion: string;
  lat: number;
  lng: number;
  coordPrecision: 'exact' | 'approximate';
  experiences: string[];
}

interface Props {
  pins: PuebloPin[];
  className?: string;
}

export function PueblosMap({ pins, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selected, setSelected] = useState<PuebloPin | null>(null);

  const pinsRef = useRef(pins);
  pinsRef.current = pins;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const maplibreglLib = (await import('maplibre-gl')).default;
      await import('maplibre-gl/dist/maplibre-gl.css');

      if (cancelled || !containerRef.current) return;

      const map = new maplibreglLib.Map({
        container: containerRef.current,
        style: MAP_STYLE_URL,
        center: [MEXICO_CENTER.lng, MEXICO_CENTER.lat],
        zoom: MEXICO_ZOOM,
        attributionControl: { compact: true },
        maxBounds: [
          [MEXICO_BOUNDS.west - 2, MEXICO_BOUNDS.south - 2],
          [MEXICO_BOUNDS.east + 2, MEXICO_BOUNDS.north + 2],
        ],
      });

      map.addControl(
        new maplibreglLib.NavigationControl({ showCompass: false }),
        'top-right',
      );

      map.on('load', () => {
        map.addSource('pueblos', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: pinsRef.current.map((p) => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
              properties: {
                slug: p.slug,
                name: p.name,
                estado: p.estado,
                precision: p.coordPrecision,
              },
            })),
          },
          cluster: true,
          clusterMaxZoom: 9,
          clusterRadius: 45,
        });

        map.addLayer({
          id: 'pueblos-clusters',
          type: 'circle',
          source: 'pueblos',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#06C167',
            'circle-opacity': 0.85,
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              18,
              10,
              24,
              30,
              30,
            ],
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
          },
        });

        map.addLayer({
          id: 'pueblos-cluster-count',
          type: 'symbol',
          source: 'pueblos',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-size': 13,
            'text-font': ['Noto Sans Regular'],
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        map.addLayer({
          id: 'pueblos-points',
          type: 'circle',
          source: 'pueblos',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'case',
              ['==', ['get', 'precision'], 'exact'],
              '#06C167',
              '#94a3b8',
            ],
            'circle-radius': 7,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });

        map.on('click', 'pueblos-clusters', (e) => {
          const feats = map.queryRenderedFeatures(e.point, {
            layers: ['pueblos-clusters'],
          });
          const clusterId = feats[0]?.properties?.cluster_id as
            | number
            | undefined;
          if (clusterId == null) return;
          const src = map.getSource('pueblos') as maplibregl.GeoJSONSource;
          src
            .getClusterExpansionZoom(clusterId)
            .then((zoom: number) => {
              const coords = (feats[0].geometry as GeoJSON.Point).coordinates;
              map.flyTo({ center: [coords[0], coords[1]], zoom, duration: 600 });
            })
            .catch(() => {});
        });

        map.on('click', 'pueblos-points', (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const slug = f.properties?.slug as string;
          const found = pinsRef.current.find((p) => p.slug === slug);
          if (found) {
            setSelected(found);
            map.flyTo({
              center: [found.lng, found.lat],
              zoom: 10,
              duration: 500,
            });
          }
        });

        map.on('mouseenter', 'pueblos-points', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'pueblos-points', () => {
          map.getCanvas().style.cursor = '';
        });
        map.on('mouseenter', 'pueblos-clusters', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'pueblos-clusters', () => {
          map.getCanvas().style.cursor = '';
        });
      });

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {}
        mapRef.current = null;
      }
    };
  }, []);

  // Update source when `pins` prop changes (filter changes)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      const src = map.getSource('pueblos') as
        | maplibregl.GeoJSONSource
        | undefined;
      if (!src) return;
      src.setData({
        type: 'FeatureCollection',
        features: pins.map((p) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
          properties: {
            slug: p.slug,
            name: p.name,
            estado: p.estado,
            precision: p.coordPrecision,
          },
        })),
      });
    };

    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [pins]);

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-slate-200 shadow-md ${className}`}>
      <div ref={containerRef} className="h-[60vh] min-h-[480px] w-full" />
      <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
        {pins.length} Pueblos Mágicos
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 flex gap-3 text-[11px] text-slate-600">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 shadow-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-[#06C167]" />
          Ubicación exacta
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 shadow-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
          Aproximada
        </span>
      </div>

      {selected && (
        <div className="absolute right-4 top-4 w-72 max-w-[calc(100%-2rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {selected.name}
              </h3>
              <p className="text-xs text-slate-500">{selected.estado}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-slate-400 hover:text-slate-700"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {selected.experiences.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium capitalize text-emerald-700"
              >
                {tag}
              </span>
            ))}
          </div>
          <Link
            href={`/pueblos-magicos/${selected.estadoSlug}/${selected.slug}`}
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#06C167] px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Ver ficha completa
          </Link>
        </div>
      )}
    </div>
  );
}
