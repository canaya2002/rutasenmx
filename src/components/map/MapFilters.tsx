'use client';

import { useState, useCallback } from 'react';
import {
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  PLACE_CATEGORIES,
  ESTADOS_MEXICO,
  BUDGET_LEVELS,
  TRAVELER_TYPES,
  DISCOVERY_RADII,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface MapFilterValues {
  categories: string[];
  estado: string;
  budget: string;
  travelerType: string;
  nearRoute: boolean;
  nearRouteRadius: number;
}

export interface MapFiltersProps {
  values: MapFilterValues;
  onChange: (values: MapFilterValues) => void;
  className?: string;
}

export const defaultFilterValues: MapFilterValues = {
  categories: [],
  estado: '',
  budget: '',
  travelerType: '',
  nearRoute: false,
  nearRouteRadius: 10,
};

/* ------------------------------------------------------------------ */
/*  Friendly labels                                                    */
/* ------------------------------------------------------------------ */
const budgetLabels: Record<string, string> = {
  economico: 'Economico',
  moderado: 'Moderado',
  premium: 'Premium',
  lujo: 'Lujo',
};

const travelerLabels: Record<string, string> = {
  familia: 'Familia',
  pareja: 'Pareja',
  solo: 'Solo',
  'con-mascotas': 'Con mascotas',
  accesible: 'Accesible',
  'bajo-presupuesto': 'Bajo presupuesto',
  premium: 'Premium',
  foodie: 'Foodie',
  cultural: 'Cultural',
  naturaleza: 'Naturaleza',
  aventura: 'Aventura',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function MapFilters({ values, onChange, className }: MapFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const update = useCallback(
    (patch: Partial<MapFilterValues>) => onChange({ ...values, ...patch }),
    [values, onChange],
  );

  const toggleCategory = useCallback(
    (slug: string) => {
      const cats = values.categories.includes(slug)
        ? values.categories.filter((c) => c !== slug)
        : [...values.categories, slug];
      update({ categories: cats });
    },
    [values.categories, update],
  );

  const clearAll = useCallback(() => {
    onChange(defaultFilterValues);
  }, [onChange]);

  const hasActiveFilters =
    values.categories.length > 0 ||
    values.estado !== '' ||
    values.budget !== '' ||
    values.travelerType !== '' ||
    values.nearRoute;

  /* ---------------------------------------------------------------- */
  /*  Inner filter body (shared between mobile & desktop)             */
  /* ---------------------------------------------------------------- */
  const filterBody = (
    <div className="space-y-5">
      {/* Category chips */}
      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Categorias
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {PLACE_CATEGORIES.map((cat) => {
            const active = values.categories.includes(cat.slug);
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => toggleCategory(cat.slug)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'text-white shadow-sm'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100',
                )}
                style={active ? { backgroundColor: cat.color } : undefined}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Estado dropdown */}
      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Estado
        </h4>
        <select
          value={values.estado}
          onChange={(e) => update({ estado: e.target.value })}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_MEXICO.map((e) => (
            <option key={e.slug} value={e.slug}>
              {e.name}
            </option>
          ))}
        </select>
      </section>

      {/* Budget */}
      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Presupuesto
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {BUDGET_LEVELS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => update({ budget: values.budget === b ? '' : b })}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                values.budget === b
                  ? 'bg-terracotta text-white'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100',
              )}
            >
              {budgetLabels[b] ?? b}
            </button>
          ))}
        </div>
      </section>

      {/* Traveler type */}
      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Tipo de viajero
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {TRAVELER_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
                update({ travelerType: values.travelerType === t ? '' : t })
              }
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                values.travelerType === t
                  ? 'bg-jade text-white'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100',
              )}
            >
              {travelerLabels[t] ?? t}
            </button>
          ))}
        </div>
      </section>

      {/* Near my route toggle */}
      <section>
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={values.nearRoute}
            onClick={() => update({ nearRoute: !values.nearRoute })}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
              values.nearRoute ? 'bg-terracotta' : 'bg-slate-200',
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform',
                values.nearRoute ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </button>
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <MapPin className="h-4 w-4" />
            Cerca de mi ruta
          </span>
        </div>

        {values.nearRoute && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-slate-500">Radio:</span>
            {DISCOVERY_RADII.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => update({ nearRouteRadius: r })}
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                  values.nearRouteRadius === r
                    ? 'bg-terracotta text-white'
                    : 'bg-slate-50 text-slate-500',
                )}
              >
                {r} km
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Clear all */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="w-full gap-1.5">
          <X className="h-3.5 w-3.5" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* ── Desktop: sidebar overlay ───────────────────────────── */}
      <aside
        className={cn(
          'hidden md:flex md:flex-col w-80 shrink-0 border-r border-slate-200 bg-white',
          className,
        )}
      >
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold p-4 pb-0">
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
        </h3>
        <div className="flex-1 overflow-y-auto p-4 pt-0">
          {filterBody}
        </div>
      </aside>

      {/* ── Mobile: collapsible bottom bar ─────────────────────── */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-40">
        {/* Toggle bar */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="flex w-full items-center justify-between bg-white/95 backdrop-blur-sm border-t border-slate-200 px-4 py-2.5"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-terracotta text-[10px] text-white">
                {values.categories.length +
                  (values.estado ? 1 : 0) +
                  (values.budget ? 1 : 0) +
                  (values.travelerType ? 1 : 0) +
                  (values.nearRoute ? 1 : 0)}
              </span>
            )}
          </span>
          {mobileOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>

        {/* Panel */}
        <div
          className={cn(
            'overflow-y-auto bg-white border-t border-slate-200 px-4 transition-all duration-300',
            mobileOpen ? 'max-h-[60vh] py-4' : 'max-h-0 py-0 overflow-hidden',
          )}
        >
          {filterBody}
        </div>
      </div>
    </>
  );
}
