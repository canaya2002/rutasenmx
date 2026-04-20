'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Loader2,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  formatDistance,
  formatDuration,
  formatCurrency,
  haversineDistance,
} from '@/lib/utils';
import StopCard, { type TripStop } from './StopCard';
import { useLocale } from '@/components/providers/LocaleProvider';

// ── Types ───────────────────────────────────────────────────────────────────
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
  onCalculateRoute?: (data: {
    origin: GeocodedPlace | null;
    destination: GeocodedPlace | null;
    stops: TripStop[];
    options: RouteOptions;
    summary: RouteSummary;
  }) => void;
  routeSummary?: RouteSummary | null;
  className?: string;
}

interface Suggestion extends GeocodedPlace {
  subtitle?: string;
  osmId?: string;
}

// ── Fuel & toll model ───────────────────────────────────────────────────────
const FUEL_COST_PER_LITER_CENTS = 2400; // $24 MXN / L (CRE avg. Magna 2025)
const KM_PER_LITER_BY_VEHICLE: Record<RouteOptions['vehicleType'], number> = {
  car: 14,
  motorcycle: 22,
  campervan: 9,
  rv: 6,
};
const TOLL_COST_PER_KM_CENTS = 180; // $1.80 MXN/km on autopistas (CAPUFE avg.)
const AVG_SPEED_KMH = 85;

function estimateSummary(
  origin: GeocodedPlace | null,
  destination: GeocodedPlace | null,
  stops: TripStop[],
  options: RouteOptions,
): RouteSummary {
  if (!origin || !destination) {
    return { distanceKm: 0, durationMinutes: 0, tollEstimateCents: 0, fuelEstimateCents: 0 };
  }
  const points: Array<{ lat: number; lng: number }> = [origin];
  for (const s of stops) {
    if (s.lat != null && s.lng != null) points.push({ lat: s.lat, lng: s.lng });
  }
  points.push(destination);
  let distanceKm = 0;
  for (let i = 1; i < points.length; i++) {
    distanceKm += haversineDistance(
      points[i - 1].lat,
      points[i - 1].lng,
      points[i].lat,
      points[i].lng,
    );
  }
  distanceKm = Math.round(distanceKm * 1.15); // road-factor vs. straight line
  const durationMinutes = Math.round((distanceKm / AVG_SPEED_KMH) * 60);
  const fuelLiters = distanceKm / KM_PER_LITER_BY_VEHICLE[options.vehicleType];
  const fuelEstimateCents = Math.round(fuelLiters * FUEL_COST_PER_LITER_CENTS);
  const tollEstimateCents = options.avoidTolls
    ? 0
    : Math.round(distanceKm * TOLL_COST_PER_KM_CENTS * 0.7); // ~70% of route on tollroads
  return { distanceKm, durationMinutes, tollEstimateCents, fuelEstimateCents };
}

// ── Geocoding (Photon, free OSM) ────────────────────────────────────────────
async function geocode(query: string, signal: AbortSignal): Promise<Suggestion[]> {
  if (query.trim().length < 2) return [];
  const base =
    process.env.NEXT_PUBLIC_GEOCODER_URL ?? 'https://photon.komoot.io/api/';
  const url = `${base}?q=${encodeURIComponent(query)}&limit=5`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const data = await res.json();
  const feats = data.features ?? [];
  return feats
    .map((f: { geometry?: { coordinates?: [number, number] }; properties?: Record<string, string> }): Suggestion | null => {
      const coords = f.geometry?.coordinates;
      if (!coords) return null;
      const p = f.properties ?? {};
      const name = p.name || p.street || query;
      const subtitle = [p.city, p.state, p.country].filter(Boolean).join(', ');
      return { name, subtitle, lng: coords[0], lat: coords[1] };
    })
    .filter((x: Suggestion | null): x is Suggestion => x != null);
}

// ── Autocomplete input ──────────────────────────────────────────────────────
interface AutocompleteProps {
  label: string;
  placeholder: string;
  pinClass: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (place: GeocodedPlace) => void;
  locale: 'es' | 'en';
}

function Autocomplete({
  label,
  placeholder,
  pinClass,
  value,
  onChange,
  onSelect,
  locale,
}: AutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length < 2) return;
    const ctrl = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- debounced async fetch; intentional.
    setLoading(true);
    const t = setTimeout(() => {
      geocode(value, ctrl.signal)
        .then((s) => {
          setSuggestions(s);
          setOpen(true);
          setHighlight(-1);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  // Clear suggestions as the user types below the minimum length.
  const visibleSuggestions = value.trim().length < 2 ? [] : suggestions;

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const pick = (s: Suggestion) => {
    onChange(
      s.subtitle ? `${s.name}, ${s.subtitle.split(',').pop()?.trim()}` : s.name,
    );
    onSelect(s);
    setOpen(false);
  };

  return (
    <div className="space-y-1.5" ref={wrapperRef}>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <MapPin className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', pinClass)} />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => visibleSuggestions.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, visibleSuggestions.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === 'Enter' && highlight >= 0) {
              e.preventDefault();
              pick(visibleSuggestions[highlight]);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          className="pl-9 pr-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {open && visibleSuggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {visibleSuggestions.map((s, i) => (
              <li key={`${s.lat}-${s.lng}-${i}`}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(s)}
                  className={cn(
                    'flex w-full items-start gap-2 px-3 py-2 text-left text-sm',
                    highlight === i ? 'bg-emerald-50' : 'hover:bg-slate-50',
                  )}
                >
                  <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-900">
                      {s.name}
                    </div>
                    {s.subtitle && (
                      <div className="truncate text-xs text-slate-500">
                        {s.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            ))}
            <li className="border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-400">
              {locale === 'en'
                ? 'Results from OpenStreetMap'
                : 'Resultados de OpenStreetMap'}
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function TripPlanner({
  onCalculateRoute,
  routeSummary: routeSummaryProp,
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
    needBoth: isEn
      ? 'Pick origin and destination from the list to calculate.'
      : 'Selecciona origen y destino desde la lista para calcular.',
  };
  const VEHICLES: { value: RouteOptions['vehicleType']; label: string; Icon: typeof Car }[] = [
    { value: 'car', label: L.car, Icon: Car },
    { value: 'motorcycle', label: L.motorcycle, Icon: Bike },
    { value: 'campervan', label: 'Campervan', Icon: Truck },
    { value: 'rv', label: 'RV', Icon: Truck },
  ];

  const [originQuery, setOriginQuery] = useState('');
  const [origin, setOrigin] = useState<GeocodedPlace | null>(null);
  const [destQuery, setDestQuery] = useState('');
  const [destination, setDestination] = useState<GeocodedPlace | null>(null);
  const [stops, setStops] = useState<TripStop[]>([]);
  const [options, setOptions] = useState<RouteOptions>({
    avoidTolls: false,
    avoidHighways: false,
    avoidDirtRoads: false,
    vehicleType: 'car',
  });

  const summary = useMemo(
    () => estimateSummary(origin, destination, stops, options),
    [origin, destination, stops, options],
  );

  const canCalculate = !!origin && !!destination;

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
    setStops((prev) =>
      prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, sortOrder: i })),
    );
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
    if (!canCalculate) return;
    onCalculateRoute?.({ origin, destination, stops, options, summary });
  }, [canCalculate, onCalculateRoute, origin, destination, stops, options, summary]);

  const toggleOption = useCallback(
    (key: keyof Pick<RouteOptions, 'avoidTolls' | 'avoidHighways' | 'avoidDirtRoads'>) =>
      setOptions((prev) => ({ ...prev, [key]: !prev[key] })),
    [],
  );

  const displayedSummary = routeSummaryProp ?? (canCalculate ? summary : null);

  return (
    <div className={cn('space-y-5', className)}>
      <Autocomplete
        label={L.origin}
        placeholder={L.originPh}
        pinClass="text-emerald-500"
        value={originQuery}
        onChange={(v) => {
          setOriginQuery(v);
          setOrigin(null);
        }}
        onSelect={(p) => {
          setOrigin(p);
        }}
        locale={locale}
      />

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

      <Autocomplete
        label={L.destination}
        placeholder={L.destinationPh}
        pinClass="text-terracotta"
        value={destQuery}
        onChange={(v) => {
          setDestQuery(v);
          setDestination(null);
        }}
        onSelect={(p) => {
          setDestination(p);
        }}
        locale={locale}
      />

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
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                options[key]
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div>
          <span className="mb-1.5 block text-xs text-muted-foreground">{L.vehicle}</span>
          <div className="flex flex-wrap gap-2">
            {VEHICLES.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setOptions((p) => ({ ...p, vehicleType: value }))}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                  options.vehicleType === value
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-700 hover:border-slate-400',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        className="w-full gap-2"
        size="lg"
        onClick={calculate}
        disabled={!canCalculate}
      >
        <Navigation className="h-4 w-4" />
        {L.calculateRoute}
      </Button>
      {!canCalculate && (originQuery || destQuery) && (
        <p className="text-center text-xs text-slate-500">{L.needBoth}</p>
      )}

      {displayedSummary && displayedSummary.distanceKm > 0 && (
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">{L.distance}</p>
              <p className="text-sm font-bold">
                {formatDistance(displayedSummary.distanceKm)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">{L.time}</p>
              <p className="text-sm font-bold">
                {formatDuration(displayedSummary.durationMinutes)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">{L.tollsEst}</p>
              <p className="text-sm font-bold">
                {formatCurrency(displayedSummary.tollEstimateCents)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">{L.fuelEst}</p>
              <p className="text-sm font-bold">
                {formatCurrency(displayedSummary.fuelEstimateCents)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
