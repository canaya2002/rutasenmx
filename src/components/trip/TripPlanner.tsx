'use client';

import { useState, useCallback } from 'react';
import {
  MapPin,
  Plus,
  Car,
  Bike,
  Truck,
  Navigation,
  Fuel,
  DollarSign,
  Clock,
  Route,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatDistance, formatDuration, formatCurrency } from '@/lib/utils';
import StopCard, { type TripStop } from './StopCard';
import { useLocale } from '@/components/providers/LocaleProvider';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface GeocodedPlace {
  name: string;
  lat: number;
  lng: number;
}

export interface RouteOptions {
  avoidTolls: boolean;
  avoidHighways: boolean;
  avoidDirtRoads: boolean;
  vehicleType: 'car' | 'motorcycle' | 'campervan' | 'rv';
}

export interface RouteSummary {
  distanceKm: number;
  durationMinutes: number;
  tollEstimateCents: number;
  fuelEstimateCents: number;
}

export interface TripPlannerProps {
  /** Called when the user requests route calculation */
  onCalculateRoute?: (data: {
    origin: GeocodedPlace | null;
    destination: GeocodedPlace | null;
    stops: TripStop[];
    options: RouteOptions;
  }) => void;
  /** Current route summary if calculated */
  routeSummary?: RouteSummary | null;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function TripPlanner({
  onCalculateRoute,
  routeSummary,
  className,
}: TripPlannerProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const L = {
    origin: isEn ? 'Origin' : 'Origen',
    originPh: isEn ? 'Departure city or place' : 'Ciudad o lugar de salida',
    destination: isEn ? 'Destination' : 'Destino',
    destinationPh: isEn ? 'Arrival city or place' : 'Ciudad o lugar de llegada',
    intermediateStops: isEn ? 'Intermediate stops' : 'Paradas intermedias',
    addStop: isEn ? 'Add stop' : 'Agregar parada',
    routeOptions: isEn ? 'Route options' : 'Opciones de ruta',
    avoidTolls: isEn ? 'Avoid tolls' : 'Evitar casetas',
    avoidHighways: isEn ? 'Avoid highways' : 'Evitar autopistas',
    avoidDirtRoads: isEn ? 'Avoid dirt roads' : 'Evitar terracería',
    vehicle: isEn ? 'Vehicle' : 'Vehículo',
    calculateRoute: isEn ? 'Calculate route' : 'Calcular ruta',
    distance: isEn ? 'Distance' : 'Distancia',
    time: isEn ? 'Time' : 'Tiempo',
    tollsEst: isEn ? 'Tolls (est.)' : 'Casetas (est.)',
    fuelEst: isEn ? 'Fuel (est.)' : 'Gasolina (est.)',
    car: isEn ? 'Car' : 'Auto',
    motorcycle: isEn ? 'Motorcycle' : 'Moto',
  };
  const VEHICLES: { value: RouteOptions['vehicleType']; label: string; Icon: typeof Car }[] = [
    { value: 'car', label: L.car, Icon: Car },
    { value: 'motorcycle', label: L.motorcycle, Icon: Bike },
    { value: 'campervan', label: 'Campervan', Icon: Truck },
    { value: 'rv', label: 'RV / Motorhome', Icon: Truck },
  ];
  /* Origin / destination (simple text for now; geocoding autocomplete
     would be wired to the Mapbox Geocoding API in production) */
  const [originQuery, setOriginQuery] = useState('');
  const [origin, setOrigin] = useState<GeocodedPlace | null>(null);
  const [destQuery, setDestQuery] = useState('');
  const [destination, setDestination] = useState<GeocodedPlace | null>(null);

  /* Intermediate stops */
  const [stops, setStops] = useState<TripStop[]>([]);

  /* Route options */
  const [options, setOptions] = useState<RouteOptions>({
    avoidTolls: false,
    avoidHighways: false,
    avoidDirtRoads: false,
    vehicleType: 'car',
  });

  /* Geocode helper (stub — in production call Mapbox Geocoding API) */
  const geocode = useCallback(async (query: string): Promise<GeocodedPlace | null> => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !query.trim()) return null;
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=mx&language=es&limit=1&access_token=${token}`,
      );
      const data = await res.json();
      const feat = data.features?.[0];
      if (!feat) return null;
      return {
        name: feat.place_name ?? query,
        lng: feat.center[0],
        lat: feat.center[1],
      };
    } catch {
      return null;
    }
  }, []);

  /* Handlers */
  const handleOriginBlur = useCallback(async () => {
    if (!originQuery.trim()) return;
    const result = await geocode(originQuery);
    if (result) {
      setOrigin(result);
      setOriginQuery(result.name);
    }
  }, [originQuery, geocode]);

  const handleDestBlur = useCallback(async () => {
    if (!destQuery.trim()) return;
    const result = await geocode(destQuery);
    if (result) {
      setDestination(result);
      setDestQuery(result.name);
    }
  }, [destQuery, geocode]);

  const addStop = useCallback(() => {
    setStops((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        sortOrder: prev.length,
        durationMinutes: 60,
        notes: '',
        day: 1,
        budgetCents: 0,
      },
    ]);
  }, []);

  const updateStop = useCallback((id: string, patch: Partial<TripStop>) => {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const removeStop = useCallback((id: string) => {
    setStops((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, sortOrder: i })));
  }, []);

  const reorderStops = useCallback((fromIndex: number, toIndex: number) => {
    setStops((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((s, i) => ({ ...s, sortOrder: i }));
    });
  }, []);

  const calculate = useCallback(() => {
    onCalculateRoute?.({ origin, destination, stops, options });
  }, [onCalculateRoute, origin, destination, stops, options]);

  const toggleOption = useCallback(
    (key: keyof Pick<RouteOptions, 'avoidTolls' | 'avoidHighways' | 'avoidDirtRoads'>) =>
      setOptions((prev) => ({ ...prev, [key]: !prev[key] })),
    [],
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* ── Origin ────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {L.origin}
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
          <Input
            placeholder={L.originPh}
            value={originQuery}
            onChange={(e) => setOriginQuery(e.target.value)}
            onBlur={handleOriginBlur}
            className="pl-9"
          />
        </div>
      </div>

      {/* ── Stops ─────────────────────────────────────────────── */}
      {stops.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {L.intermediateStops}
          </h4>
          {stops.map((stop, idx) => (
            <StopCard
              key={stop.id}
              stop={stop}
              index={idx}
              total={stops.length}
              onChange={(patch: Partial<TripStop>) => updateStop(stop.id, patch)}
              onRemove={() => removeStop(stop.id)}
              onMoveUp={idx > 0 ? () => reorderStops(idx, idx - 1) : undefined}
              onMoveDown={idx < stops.length - 1 ? () => reorderStops(idx, idx + 1) : undefined}
            />
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={addStop} className="w-full gap-1.5">
        <Plus className="h-4 w-4" />
        {L.addStop}
      </Button>

      {/* ── Destination ───────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {L.destination}
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-terracotta" />
          <Input
            placeholder={L.destinationPh}
            value={destQuery}
            onChange={(e) => setDestQuery(e.target.value)}
            onBlur={handleDestBlur}
            className="pl-9"
          />
        </div>
      </div>

      {/* ── Route options ─────────────────────────────────────── */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {L.routeOptions}
        </h4>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ['avoidTolls', L.avoidTolls],
              ['avoidHighways', L.avoidHighways],
              ['avoidDirtRoads', L.avoidDirtRoads],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleOption(key)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                options[key]
                  ? 'bg-terracotta text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Vehicle selector */}
        <div>
          <span className="mb-1.5 block text-xs text-muted-foreground">{L.vehicle}</span>
          <div className="flex gap-2">
            {VEHICLES.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setOptions((p) => ({ ...p, vehicleType: value }))}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                  options.vehicleType === value
                    ? 'border-terracotta bg-terracotta/10 text-terracotta'
                    : 'border-border text-muted-foreground hover:border-foreground/30',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Calculate button ──────────────────────────────────── */}
      <Button className="w-full gap-2" size="lg" onClick={calculate}>
        <Navigation className="h-4 w-4" />
        {L.calculateRoute}
      </Button>

      {/* ── Route summary ─────────────────────────────────────── */}
      {routeSummary && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/50 p-4">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{L.distance}</p>
              <p className="text-sm font-semibold">{formatDistance(routeSummary.distanceKm)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{L.time}</p>
              <p className="text-sm font-semibold">{formatDuration(routeSummary.durationMinutes)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{L.tollsEst}</p>
              <p className="text-sm font-semibold">
                {formatCurrency(routeSummary.tollEstimateCents)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{L.fuelEst}</p>
              <p className="text-sm font-semibold">
                {formatCurrency(routeSummary.fuelEstimateCents)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
