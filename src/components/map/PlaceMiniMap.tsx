'use client';

import { useRef, useEffect, useState } from 'react';

interface PlaceMiniMapProps {
  lat: number;
  lng: number;
  name: string;
  className?: string;
}

export function PlaceMiniMap({ lat, lng, name, className = '' }: PlaceMiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || token === 'your_mapbox_token') {
      setError(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;
        await import('mapbox-gl/dist/mapbox-gl.css');

        if (cancelled || !containerRef.current) return;

        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [lng, lat],
          zoom: 14,
          interactive: true,
          attributionControl: false,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

        // Add marker
        const el = document.createElement('div');
        el.style.cssText = 'font-size:28px;cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));';
        el.textContent = '📍';
        new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);

        map.on('error', () => {});
        mapRef.current = map;
      } catch {
        setError(true);
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch {}
        mapRef.current = null;
      }
    };
  }, [lat, lng]);

  if (error) {
    // Fallback: link to Google Maps
    return (
      <a
        href={`https://www.google.com/maps/@${lat},${lng},15z`}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500 hover:bg-slate-200 transition ${className}`}
      >
        📍 Ver ubicación en Google Maps
      </a>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      {/* Google Maps link overlay */}
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-md transition hover:shadow-lg"
      >
        🗺️ Abrir en Google Maps
      </a>
      {/* Place name label */}
      <div className="absolute bottom-3 left-3 z-10 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
        📍 {name}
      </div>
    </div>
  );
}
