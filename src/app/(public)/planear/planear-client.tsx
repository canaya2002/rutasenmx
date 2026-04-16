'use client';

import { useState, useCallback } from 'react';
import { MapProvider } from '@/components/map/MapProvider';
import MapView from '@/components/map/MapView';
import RoutePreview from '@/components/trip/RoutePreview';
import TripPlanner, { type RouteSummary } from '@/components/trip/TripPlanner';
import DiscoveryPanel from '@/components/trip/DiscoveryPanel';
import type { DiscoveryResult } from '@/components/trip/DiscoveryPanel';

export default function PlanearClient() {
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [discoveryResults] = useState<DiscoveryResult[]>([]);

  const handleCalculateRoute = useCallback(
    (data: Parameters<NonNullable<React.ComponentProps<typeof TripPlanner>['onCalculateRoute']>>[0]) => {
      /* In production this would call Mapbox Directions API and update
         routeCoords + routeSummary. For now we set a placeholder summary. */
      if (data.origin && data.destination) {
        setRouteCoords([
          [data.origin.lng, data.origin.lat],
          [data.destination.lng, data.destination.lat],
        ]);
        setRouteSummary({
          distanceKm: 0,
          durationMinutes: 0,
          tollEstimateCents: 0,
          fuelEstimateCents: 0,
        });
      }
    },
    [],
  );

  const handleAddToTrip = useCallback((id: string) => {
    /* Would add the discovery result as a stop in the planner */
  }, []);

  return (
    <MapProvider>
      <div className="flex h-[calc(100dvh-4rem)] flex-col lg:flex-row">
        {/* Planner panel */}
        <aside className="order-2 w-full shrink-0 overflow-y-auto border-t border-border bg-card p-4 lg:order-1 lg:w-[420px] lg:border-r lg:border-t-0">
          <h1 className="mb-4 text-lg font-bold font-display">
            Planear ruta por Mexico
          </h1>

          <TripPlanner
            onCalculateRoute={handleCalculateRoute}
            routeSummary={routeSummary}
          />

          {/* Discovery panel (shown after route is calculated) */}
          {routeCoords.length >= 2 && (
            <div className="mt-8 border-t border-border pt-6">
              <DiscoveryPanel
                results={discoveryResults}
                onAddToTrip={handleAddToTrip}
              />
            </div>
          )}
        </aside>

        {/* Map */}
        <div className="relative order-1 min-h-[40vh] flex-1 lg:order-2">
          <MapView className="h-full w-full" />
          {routeCoords.length >= 2 && (
            <RoutePreview routeCoordinates={routeCoords} />
          )}
        </div>
      </div>
    </MapProvider>
  );
}
