'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { MapProvider } from '@/components/map/MapProvider';
import MapView from '@/components/map/MapView';
import RoutePreview from '@/components/trip/RoutePreview';
import TripPlanner, { type RouteSummary } from '@/components/trip/TripPlanner';
import DiscoveryPanel from '@/components/trip/DiscoveryPanel';
import type { DiscoveryResult } from '@/components/trip/DiscoveryPanel';
import { useLocale } from '@/components/providers/LocaleProvider';
import {
  Sparkles,
  MapPin,
  Navigation,
  Fuel,
  Coins,
  Clock,
  Compass,
} from 'lucide-react';

export default function PlanearClient() {
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [discoveryResults] = useState<DiscoveryResult[]>([]);

  const handleCalculateRoute = useCallback(
    (data: Parameters<NonNullable<React.ComponentProps<typeof TripPlanner>['onCalculateRoute']>>[0]) => {
      if (data.origin && data.destination) {
        const waypoints: [number, number][] = [
          [data.origin.lng, data.origin.lat],
        ];
        for (const s of data.stops) {
          if (s.lng != null && s.lat != null) waypoints.push([s.lng, s.lat]);
        }
        waypoints.push([data.destination.lng, data.destination.lat]);
        setRouteCoords(waypoints);
        setRouteSummary(data.summary);
      }
    },
    [],
  );

  const handleAddToTrip = useCallback((_id: string) => {
    /* Would add the discovery result as a stop in the planner */
  }, []);

  const t = {
    kicker: isEn ? 'Plan · Interactive' : 'Planea · Interactivo',
    title: isEn ? 'Plan a route through Mexico' : 'Planear ruta por México',
    subtitle: isEn
      ? 'Drag, filter and export. Add stops, compute tolls, estimate fuel and visualise your trip in real time.'
      : 'Arrastra, filtra y exporta. Agrega paradas, calcula casetas, estima combustible y visualiza tu viaje en tiempo real.',
    tip1: isEn ? 'Distance & time' : 'Distancia y tiempo',
    tip2: isEn ? 'Tolls (CAPUFE)' : 'Casetas (CAPUFE)',
    tip3: isEn ? 'Fuel (CRE avg.)' : 'Gasolina (prom. CRE)',
    tip4: isEn ? 'Stops & detours' : 'Paradas y desvíos',
    tryAi: isEn ? 'Prefer AI? Try Autopilot' : '¿Prefieres IA? Usa Autopilot',
    tryAiDesc: isEn
      ? 'Describe your trip in natural language and get a full itinerary.'
      : 'Describe tu viaje en lenguaje natural y recibe un itinerario completo.',
  };

  return (
    <MapProvider>
      <main className="relative flex min-h-[calc(100dvh-4rem)] flex-col">
        {/* ------------ Premium hero header ------------ */}
        <header className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-emerald-50/30 to-white">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-emerald-200/40 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  <Sparkles className="h-3 w-3" />
                  {t.kicker}
                </span>
                <h1 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                  {t.title}
                </h1>
                <p className="mt-2 max-w-2xl text-balance text-sm leading-6 text-slate-600 sm:text-base">
                  {t.subtitle}
                </p>
              </div>
              <Link
                href="/autopilot"
                className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition hover:border-emerald-200 hover:bg-white hover:text-emerald-700"
              >
                <Compass className="h-4 w-4" />
                <span>{t.tryAi}</span>
                <span className="text-emerald-600 transition group-hover:translate-x-0.5">→</span>
              </Link>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {[
                { icon: Navigation, label: t.tip1 },
                { icon: Coins,      label: t.tip2 },
                { icon: Fuel,       label: t.tip3 },
                { icon: MapPin,     label: t.tip4 },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-xl ring-1 ring-black/5"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {label}
                </div>
              ))}
            </dl>
          </div>
        </header>

        {/* ------------ Workbench: glass sidebar + map ------------ */}
        <div className="relative flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Decorative background blobs */}
          <div aria-hidden className="pointer-events-none absolute -left-40 top-1/3 -z-[1] h-80 w-80 rounded-full bg-emerald-200/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -right-40 bottom-0 -z-[1] h-80 w-80 rounded-full bg-sky-200/20 blur-3xl" />

          {/* Planner panel — glassmorphic */}
          <aside className="relative order-2 w-full shrink-0 overflow-y-auto border-t border-slate-200/60 bg-gradient-to-b from-white via-white to-slate-50/60 p-5 sm:p-6 lg:order-1 lg:w-[440px] lg:border-r lg:border-t-0">
            <div className="sticky top-0 -mx-5 -mt-5 mb-4 border-b border-slate-200/60 bg-white/60 px-5 pb-3 pt-5 backdrop-blur-xl sm:-mx-6 sm:-mt-6 sm:px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                {isEn ? 'Trip builder' : 'Constructor de viaje'}
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  {isEn ? 'Build your route' : 'Arma tu ruta'}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  {isEn ? 'Live' : 'En vivo'}
                </span>
              </div>
            </div>

            <div className="space-y-5 [&_input]:rounded-xl [&_input]:border-slate-200 [&_input]:bg-white [&_input]:shadow-sm [&_input]:transition [&_input:focus]:border-emerald-400 [&_input:focus]:ring-2 [&_input:focus]:ring-emerald-400/25 [&_select]:rounded-xl [&_select]:border-slate-200 [&_select]:bg-white [&_select]:shadow-sm [&_button]:rounded-full">
              <TripPlanner
                onCalculateRoute={handleCalculateRoute}
                routeSummary={routeSummary}
              />
            </div>

            {/* Discovery panel (appears once a route is calculated) */}
            {routeCoords.length >= 2 && (
              <div className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-sm font-semibold text-slate-900">
                    {isEn ? 'Places to add on the way' : 'Lugares para añadir en el camino'}
                  </p>
                </div>
                <DiscoveryPanel results={discoveryResults} onAddToTrip={handleAddToTrip} />
              </div>
            )}

            {/* Autopilot CTA card */}
            <div className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-5 text-white shadow-xl">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-300/30">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                    Autopilot
                  </p>
                  <p className="mt-0.5 text-sm font-semibold">{t.tryAi}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{t.tryAiDesc}</p>
                  <Link
                    href="/autopilot"
                    className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-900 transition hover:bg-emerald-300"
                  >
                    <Clock className="h-3 w-3" />
                    {isEn ? 'Try it now' : 'Probar ahora'}
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Map — full-bleed on the right */}
          <div className="relative order-1 min-h-[48vh] flex-1 lg:order-2">
            <MapView className="h-full w-full" />
            {routeCoords.length >= 2 && <RoutePreview routeCoordinates={routeCoords} />}

            {/* Floating helper card shown when there's no active route yet */}
            {routeCoords.length < 2 && (
              <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 flex justify-center sm:inset-x-auto sm:bottom-6 sm:left-6">
                <div className="pointer-events-auto max-w-sm rounded-3xl border border-white/70 bg-white/80 px-4 py-3 text-xs text-slate-700 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.3)] ring-1 ring-black/5 backdrop-blur-xl">
                  <p className="font-semibold text-slate-900">
                    {isEn ? 'Tip' : 'Tip'}
                  </p>
                  <p className="mt-0.5 leading-5">
                    {isEn
                      ? 'Enter an origin and destination on the left to draw the route on the map.'
                      : 'Ingresa origen y destino a la izquierda para dibujar la ruta en el mapa.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </MapProvider>
  );
}
