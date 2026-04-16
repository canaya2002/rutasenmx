'use client';

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type mapboxgl from 'mapbox-gl';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface MapContextValue {
  map: mapboxgl.Map | null;
  setMap: (instance: mapboxgl.Map | null) => void;
  isReady: boolean;
}

const MapContext = createContext<MapContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */
export function useMap() {
  const ctx = useContext(MapContext);
  if (!ctx) {
    throw new Error('useMap must be used within a <MapProvider>');
  }
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */
export function MapProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isReady, setIsReady] = useState(false);

  const setMap = useCallback((instance: mapboxgl.Map | null) => {
    mapRef.current = instance;
    setIsReady(instance !== null);
  }, []);

  /* Cleanup when the provider unmounts */
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setIsReady(false);
      }
    };
  }, []);

  return (
    <MapContext.Provider value={{ map: mapRef.current, setMap, isReady }}>
      {children}
    </MapContext.Provider>
  );
}
