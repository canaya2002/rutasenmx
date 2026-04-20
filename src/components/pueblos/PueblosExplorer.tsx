'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin, Search, X } from 'lucide-react';
import { PueblosMap } from './PueblosMap';
import type {
  PuebloMagico,
  ExperienceType,
} from '@/lib/pueblos-magicos';
import { EXPERIENCE_LABELS, EXPERIENCE_EMOJIS } from '@/lib/pueblos-magicos';

interface Props {
  pueblos: PuebloMagico[];
  macroregions: string[];
  estados: Array<{ slug: string; name: string; count: number; macroregion: string }>;
  experienceCounts: Record<ExperienceType, number>;
}

const EXPERIENCE_KEYS: ExperienceType[] = [
  'cultura',
  'naturaleza',
  'gastronomia',
  'arqueologia',
  'artesania',
  'espiritualidad',
  'playa',
  'aventura',
];

export function PueblosExplorer({
  pueblos,
  macroregions,
  estados,
  experienceCounts,
}: Props) {
  const [q, setQ] = useState('');
  const [macroregion, setMacroregion] = useState<string | null>(null);
  const [estadoSlug, setEstadoSlug] = useState<string | null>(null);
  const [experience, setExperience] = useState<ExperienceType | null>(null);

  const filtered = useMemo(() => {
    const qn = q
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    return pueblos.filter((p) => {
      if (macroregion && p.macroregion !== macroregion) return false;
      if (estadoSlug && p.estadoSlug !== estadoSlug) return false;
      if (experience && !p.experiences.includes(experience)) return false;
      if (qn) {
        const hay =
          `${p.name} ${p.estado} ${p.resumen} ${p.datoCurioso}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
        if (!hay.includes(qn)) return false;
      }
      return true;
    });
  }, [pueblos, q, macroregion, estadoSlug, experience]);

  const visibleEstados = useMemo(() => {
    if (!macroregion) return estados;
    return estados.filter((e) => e.macroregion === macroregion);
  }, [estados, macroregion]);

  const clearFilters = () => {
    setQ('');
    setMacroregion(null);
    setEstadoSlug(null);
    setExperience(null);
  };

  const activeCount =
    (q ? 1 : 0) +
    (macroregion ? 1 : 0) +
    (estadoSlug ? 1 : 0) +
    (experience ? 1 : 0);

  const mapPins = useMemo(
    () =>
      filtered.map((p) => ({
        id: p.id,
        slug: p.slug,
        estadoSlug: p.estadoSlug,
        name: p.name,
        estado: p.estado,
        macroregion: p.macroregion,
        lat: p.lat,
        lng: p.lng,
        coordPrecision: p.coordPrecision,
        experiences: p.experiences,
      })),
    [filtered],
  );

  return (
    <div className="space-y-10">
      {/* Interactive map */}
      <PueblosMap pins={mapPins} />

      {/* Search + filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar pueblo, estado o tradición…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-[#06C167] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#06C167]/20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
              {filtered.length} / {pueblos.length}
            </span>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600 hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" />
                Limpiar {activeCount} filtro{activeCount === 1 ? '' : 's'}
              </button>
            )}
          </div>
        </div>

        {/* Experience chips */}
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Tipo de experiencia
          </p>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_KEYS.map((key) => {
              const active = experience === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setExperience(active ? null : key)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? 'bg-[#06C167] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{EXPERIENCE_EMOJIS[key]}</span>
                  {EXPERIENCE_LABELS[key]}
                  <span className="ml-1 text-[10px] opacity-80">
                    {experienceCounts[key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Macroregion chips */}
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Macrorregión
          </p>
          <div className="flex flex-wrap gap-2">
            {macroregions.map((region) => {
              const active = macroregion === region;
              return (
                <button
                  key={region}
                  type="button"
                  onClick={() => {
                    setMacroregion(active ? null : region);
                    setEstadoSlug(null);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {region}
                </button>
              );
            })}
          </div>
        </div>

        {/* State chips */}
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Estado ({visibleEstados.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {visibleEstados.map((e) => {
              const active = estadoSlug === e.slug;
              return (
                <button
                  key={e.slug}
                  type="button"
                  onClick={() => setEstadoSlug(active ? null : e.slug)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? 'bg-[#06C167] text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {e.name} <span className="opacity-60">({e.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-slate-600">
            Sin resultados para los filtros actuales.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/pueblos-magicos/${p.estadoSlug}/${p.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-br from-emerald-50 via-white to-white p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#06C167]">
                    ✨ Pueblo Mágico
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-slate-900 group-hover:text-[#06C167]">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {p.estado} · {p.macroregion}
                  </p>
                </div>
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    p.coordPrecision === 'exact'
                      ? 'bg-[#06C167]/10 text-[#06C167]'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                  title={
                    p.coordPrecision === 'exact'
                      ? 'Ubicación exacta'
                      : 'Ubicación aproximada'
                  }
                >
                  <MapPin className="h-4 w-4" />
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="line-clamp-3 text-sm text-slate-600">
                  {p.resumen}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.experiences.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                    >
                      <span>{EXPERIENCE_EMOJIS[tag]}</span>
                      {EXPERIENCE_LABELS[tag]}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
