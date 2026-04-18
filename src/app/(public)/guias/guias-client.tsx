'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Sparkles, X, MapPin, Tag } from 'lucide-react';
import type { MockArticle, MockState } from '@/lib/data/mock';
import { useTranslation, useLocale } from '@/components/providers/LocaleProvider';

interface GuideWithState extends MockArticle {
  stateSlug: string | null;
  stateName: string | null;
  cover: string | null;
}

function fold(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

interface GuiasClientProps {
  guides: GuideWithState[];
  states: MockState[];
}

export default function GuiasClient({ guides, states }: GuiasClientProps) {
  const t = useTranslation();
  const { locale } = useLocale();
  const [query, setQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');

  // Agrupamos estados que sí tienen guías
  const statesWithGuides = useMemo(() => {
    const counts = new Map<string, number>();
    guides.forEach((g) => {
      if (g.stateSlug) {
        counts.set(g.stateSlug, (counts.get(g.stateSlug) ?? 0) + 1);
      }
    });
    return states
      .filter((s) => counts.has(s.slug))
      .map((s) => ({ ...s, guideCount: counts.get(s.slug) ?? 0 }));
  }, [guides, states]);

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Top 10 most frequent tags for quick filtering
  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of guides) {
      for (const tag of g.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [guides]);

  const filtered = useMemo(() => {
    const q = fold(query.trim());
    return guides.filter((g) => {
      if (selectedState !== 'all' && g.stateSlug !== selectedState) return false;
      if (selectedTag && !g.tags.includes(selectedTag)) return false;
      if (!q) return true;
      const haystack = fold([g.title, g.description, g.stateName ?? '', ...g.tags].join(' '));
      return haystack.includes(q);
    });
  }, [guides, query, selectedState, selectedTag]);

  // Live suggestions as user types
  const suggestions = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return [];
    return guides
      .map((g) => {
        const title = fold(g.title);
        let score = 0;
        if (title.startsWith(q)) score = 80;
        else if (title.includes(q)) score = 50;
        else if (g.tags.some((t) => fold(t).includes(q))) score = 25;
        else if (g.stateName && fold(g.stateName).includes(q)) score = 15;
        return { g, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [guides, query]);

  // Close suggestions on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!searchBoxRef.current) return;
      if (!searchBoxRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const clearAll = useCallback(() => {
    setQuery('');
    setSelectedState('all');
    setSelectedTag(null);
  }, []);

  // Agrupar por estado para render cuando no hay búsqueda activa
  const groupedByState = useMemo(() => {
    const byState = new Map<string, { state: MockState | null; list: GuideWithState[] }>();
    const general: GuideWithState[] = [];

    filtered.forEach((g) => {
      if (g.stateSlug) {
        const state = states.find((s) => s.slug === g.stateSlug) ?? null;
        const key = g.stateSlug;
        if (!byState.has(key)) byState.set(key, { state, list: [] });
        byState.get(key)!.list.push(g);
      } else {
        general.push(g);
      }
    });

    return { byState, general };
  }, [filtered, states]);

  const hasActiveFilter = query.trim() !== '' || selectedState !== 'all' || selectedTag !== null;

  const dateFormatter = (date: string) =>
    new Date(date).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const labels = {
    search: locale === 'en' ? 'Search guides' : 'Buscar guías',
    searchPlaceholder: locale === 'en'
      ? 'Search by state, town, gastronomy, route…'
      : 'Busca por estado, pueblo, gastronomía, ruta…',
    allStates: locale === 'en' ? 'All states' : 'Todos los estados',
    filterByState: locale === 'en' ? 'Filter by state' : 'Filtrar por estado',
    resultsCount: (n: number) => locale === 'en'
      ? `${n} ${n === 1 ? 'guide' : 'guides'}`
      : `${n} ${n === 1 ? 'guía' : 'guías'}`,
    noResults: locale === 'en'
      ? 'No guides match your search. Try with another keyword or state.'
      : 'No encontramos guías que coincidan. Prueba con otra palabra clave o estado.',
    clear: locale === 'en' ? 'Clear filters' : 'Limpiar filtros',
    generalGuides: locale === 'en' ? 'Featured editorial guides' : 'Guías editoriales destacadas',
    guidesIn: (state: string) => locale === 'en' ? `Guides about ${state}` : `Guías sobre ${state}`,
  };

  return (
    <div>
      {/* Glass search hero */}
      <section
        ref={searchBoxRef}
        className="relative mb-10 overflow-hidden rounded-[32px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 p-6 shadow-[0_20px_50px_-20px_rgba(6,193,103,0.25)] sm:p-8"
      >
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-300/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-sky-200/30 blur-3xl" />

        <div className="relative">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-sm ring-1 ring-emerald-200 backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            {locale === 'en' ? 'Smart search' : 'Búsqueda inteligente'}
          </p>
          <h2 className="mt-4 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {locale === 'en' ? 'Find the right guide in seconds' : 'Encuentra la guía correcta en segundos'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {locale === 'en'
              ? 'Search across titles, tags, states and descriptions. Live suggestions appear as you type.'
              : 'Busca por título, etiqueta, estado o descripción. Las sugerencias aparecen mientras escribes.'}
          </p>

          {/* Search bar with live suggestions */}
          <div className="relative mt-6">
            <label htmlFor="guide-search" className="sr-only">{labels.search}</label>
            <div className="relative flex items-center overflow-hidden rounded-full border border-white/70 bg-white/85 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.15)] ring-1 ring-slate-200/70 backdrop-blur-xl focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-400/40">
              <Search className="ml-4 h-4 w-4 shrink-0 text-slate-400" />
              <input
                id="guide-search"
                type="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => query && setShowSuggestions(true)}
                placeholder={labels.searchPlaceholder}
                className="flex-1 bg-transparent px-3 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setShowSuggestions(false); }}
                  className="mr-2 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Clear"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl ring-1 ring-slate-200 backdrop-blur-xl">
                {suggestions.map(({ g }) => (
                  <Link
                    key={g.slug}
                    href={`/guias/${g.slug}`}
                    onClick={() => setShowSuggestions(false)}
                    className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-emerald-50 last:border-b-0"
                  >
                    {g.cover ? (
                      <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg">
                        <Image src={g.cover} alt="" fill sizes="80px" className="object-cover" />
                      </span>
                    ) : (
                      <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <Search className="h-4 w-4" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">{g.title}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {g.stateName ? `${g.stateName} · ` : ''}{g.tags.slice(0, 3).join(' · ')}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Tag chips */}
          {topTags.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <Tag className="mr-1 inline h-3 w-3" />
                Tags
              </span>
              {topTags.map((tag) => {
                const active = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(active ? null : tag)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                      active
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}

          {/* State dropdown + count + clear */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <MapPin className="h-3 w-3" />
              {labels.filterByState}
            </label>
            <select
              id="guide-state"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">{labels.allStates}</option>
              {statesWithGuides.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name} ({s.guideCount})
                </option>
              ))}
            </select>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              {labels.resultsCount(filtered.length)}
            </span>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={clearAll}
                className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-700"
              >
                {labels.clear}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Sin resultados */}
      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center text-sm text-zinc-500">
          {labels.noResults}
        </div>
      )}

      {/* Vista filtrada plana */}
      {filtered.length > 0 && hasActiveFilter && (
        <section aria-label={t.pages.guias.listLabel}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((article) => (
              <GuideCard key={article.slug} article={article} dateFormatter={dateFormatter} />
            ))}
          </div>
        </section>
      )}

      {/* Vista agrupada por estado (cuando no hay filtro activo) */}
      {filtered.length > 0 && !hasActiveFilter && (
        <>
          {groupedByState.general.length > 0 && (
            <section className="mb-14" aria-label={labels.generalGuides}>
              <h2 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900">
                {labels.generalGuides}
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {groupedByState.general.map((article) => (
                  <GuideCard key={article.slug} article={article} dateFormatter={dateFormatter} />
                ))}
              </div>
            </section>
          )}

          {[...groupedByState.byState.entries()].map(([stateSlug, group]) => (
            <section key={stateSlug} className="mb-14" aria-label={labels.guidesIn(group.state?.name ?? stateSlug)}>
              <div className="mb-6 flex items-baseline justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                  {labels.guidesIn(group.state?.name ?? stateSlug)}
                </h2>
                {group.state && (
                  <Link
                    href={`/estados/${group.state.slug}`}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    {locale === 'en' ? 'View state →' : 'Ver estado →'}
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {group.list.map((article) => (
                  <GuideCard key={article.slug} article={article} dateFormatter={dateFormatter} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

function GuideCard({
  article,
  dateFormatter,
}: {
  article: GuideWithState;
  dateFormatter: (date: string) => string;
}) {
  return (
    <Link
      href={`/guias/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-zinc-50">
        {article.cover ? (
          <>
            <Image
              src={article.cover}
              alt={article.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
              <p className="line-clamp-2 text-base font-bold leading-snug text-white drop-shadow-md">
                {article.title}
              </p>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm font-medium text-zinc-500">
            {article.title}
          </div>
        )}
        {article.stateName && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 shadow-sm backdrop-blur-sm">
            {article.stateName}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="mt-0 line-clamp-2 text-sm text-zinc-500">{article.description}</p>
        <div className="mt-auto pt-3 flex items-center gap-3 text-xs text-zinc-400">
          <span>{article.author}</span>
          <span>&middot;</span>
          <time dateTime={article.datePublished}>{dateFormatter(article.datePublished)}</time>
        </div>
        {article.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
