'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, MapPin, Sparkles } from 'lucide-react';
import { mockPlaces, type MockPlace } from '@/lib/data/mock';
import { ESTADOS_MEXICO, PLACE_CATEGORIES } from '@/lib/constants';
import { useTranslation, useLocale } from '@/components/providers/LocaleProvider';

/* ------------------------------------------------------------------ */
/*  Normalisation                                                      */
/* ------------------------------------------------------------------ */
function fold(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

interface Suggestion {
  kind: 'place' | 'state' | 'category';
  label: string;
  sub?: string;
  href: string;
  iconSvg?: string | null;
}

function buildIndex(): Suggestion[] {
  const places: Suggestion[] = mockPlaces.slice(0, 600).map((p: MockPlace) => ({
    kind: 'place',
    label: p.name,
    sub: p.stateName,
    href: `/lugares/${p.slug}`,
    iconSvg:
      (PLACE_CATEGORIES.find((c) => c.slug === p.category) as { iconSvg?: string } | undefined)?.iconSvg ?? null,
  }));
  const states: Suggestion[] = ESTADOS_MEXICO.map((s) => ({
    kind: 'state',
    label: s.name,
    sub: 'Estado',
    href: `/estados/${s.slug}`,
  }));
  const cats: Suggestion[] = PLACE_CATEGORIES.slice(0, 14).map((c) => ({
    kind: 'category',
    label: c.name,
    sub: 'Categoría',
    href: c.slug === 'pueblos-magicos' || c.slug === 'museos' || c.slug === 'zonas-arqueologicas'
      ? `/${c.slug}`
      : `/lugares?tipo=${c.slug}`,
    iconSvg: (c as { iconSvg?: string }).iconSvg ?? null,
  }));
  return [...states, ...cats, ...places];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function SmartHeroSearch() {
  const router = useRouter();
  const t = useTranslation();
  const { locale } = useLocale();
  const isEn = locale === 'en';

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const index = useMemo(() => buildIndex(), []);

  const results = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return [] as Suggestion[];
    const hits: Array<{ s: Suggestion; score: number }> = [];
    for (const s of index) {
      const label = fold(s.label);
      let score = 0;
      if (label === q) score = 100;
      else if (label.startsWith(q)) score = 80;
      else if (label.includes(q)) score = 40;
      else if (s.sub && fold(s.sub).includes(q)) score = 15;
      if (score > 0) {
        if (s.kind === 'state') score += 20;
        if (s.kind === 'category') score += 10;
        hits.push({ s, score });
      }
    }
    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, 8).map((h) => h.s);
  }, [query, index]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const submit = useCallback(() => {
    if (open && results[active]) {
      router.push(results[active].href);
      setOpen(false);
      return;
    }
    const q = query.trim();
    if (!q) {
      router.push('/explorar');
      return;
    }
    router.push(`/explorar?search=${encodeURIComponent(q)}`);
  }, [active, open, query, results, router]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const quickChips = useMemo(
    () => [
      { label: 'Pueblos Mágicos', href: '/pueblos-magicos' },
      { label: isEn ? 'Museums' : 'Museos', href: '/museos' },
      { label: isEn ? 'Archaeology' : 'Arqueología', href: '/zonas-arqueologicas' },
      { label: isEn ? 'Beaches' : 'Playas', href: '/lugares?tipo=playas' },
      { label: 'Cenotes', href: '/lugares?tipo=cenotes' },
    ],
    [isEn],
  );

  return (
    <div ref={boxRef} className="relative mx-auto mt-10 w-full max-w-2xl">
      <div className="hero-3d">
        <div className="hero-3d-inner relative rounded-[28px] bg-white/10 p-1.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] ring-1 ring-white/20 backdrop-blur-md">
          <div className="flex items-center rounded-[22px] bg-white px-2 py-1.5 shadow-inner">
            <Search className="ml-3 h-5 w-5 shrink-0 text-slate-400" aria-hidden />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
                setActive(0);
              }}
              onFocus={() => query && setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder={t.hero.searchPlaceholder}
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls="hero-search-suggestions"
              className="flex-1 bg-transparent px-3 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={submit}
              className="ml-1 hidden shrink-0 items-center gap-1.5 rounded-full bg-[#06C167] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600 sm:inline-flex"
            >
              <Sparkles className="h-4 w-4" />
              {t.common.search}
            </button>
          </div>

          {open && results.length > 0 && (
            <div
              id="hero-search-suggestions"
              role="listbox"
              className="animate-popup-fade-in absolute left-0 right-0 top-full z-30 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-white/40 bg-white p-2 text-left shadow-2xl"
            >
              {results.map((s, i) => (
                <Link
                  key={`${s.kind}-${s.href}-${i}`}
                  href={s.href}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                    i === active ? 'bg-emerald-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    {s.iconSvg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.iconSvg} alt="" className="h-5 w-5" aria-hidden />
                    ) : (
                      <MapPin className="h-4 w-4 text-slate-500" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{s.label}</span>
                    {s.sub && <span className="block truncate text-xs text-slate-500">{s.sub}</span>}
                  </span>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    {s.kind === 'place' ? (isEn ? 'Place' : 'Lugar') : s.kind === 'state' ? (isEn ? 'State' : 'Estado') : (isEn ? 'Category' : 'Categoría')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick chips */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {quickChips.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm transition hover:bg-white/20"
          >
            {c.label}
          </Link>
        ))}
      </div>

      {/* Mobile submit */}
      <button
        type="button"
        onClick={submit}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#06C167] px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600 sm:hidden"
      >
        <Sparkles className="h-4 w-4" />
        {t.common.search}
      </button>
    </div>
  );
}
