'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, X, MapPin, Building2, Route, Tag, Loader2 } from 'lucide-react';
import { useLocale } from '@/components/providers/LocaleProvider';

interface SuggestionItem {
  kind: 'place' | 'state' | 'category' | 'route';
  label: string;
  sub?: string;
  href: string;
  categorySlug?: string;
}

interface GlobalSearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const kindIcon = {
  place: MapPin,
  state: Building2,
  route: Route,
  category: Tag,
} as const;

export function GlobalSearchOverlay({ open, onClose }: GlobalSearchOverlayProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  /* Focus input when opening + reset state when closing. */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setQuery('');
      setItems([]);
      setActiveIdx(0);
    }
  }, [open]);

  /* Lock body scroll while open. */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* Debounced suggestions fetch. */
  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(query)}&limit=12`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { items: SuggestionItem[] };
        setItems(data.items ?? []);
        setActiveIdx(0);
      } catch {
        /* abort on rapid typing */
      } finally {
        setLoading(false);
      }
    }, 160);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  /* Keyboard nav */
  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(items.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        const it = items[activeIdx];
        if (it) {
          e.preventDefault();
          window.location.href = it.href;
        }
      }
    },
    [items, activeIdx, onClose],
  );

  if (!open) return null;

  const placeholder = isEn
    ? 'Search place, state, route…'
    : 'Buscar lugar, estado, ruta…';
  const emptyPrompt = isEn
    ? 'Type at least 2 characters to search'
    : 'Escribe al menos 2 letras para buscar';
  const noResults = isEn ? 'No results found' : 'No se encontraron resultados';
  const closeLabel = isEn ? 'Close' : 'Cerrar';
  const kindLabel = (kind: SuggestionItem['kind']) =>
    isEn
      ? kind === 'place'
        ? 'Place'
        : kind === 'state'
        ? 'State'
        : kind === 'route'
        ? 'Route'
        : 'Category'
      : kind === 'place'
      ? 'Lugar'
      : kind === 'state'
      ? 'Estado'
      : kind === 'route'
      ? 'Ruta'
      : 'Categoría';
  const footerHint = isEn
    ? '↑↓ navigate · ↵ open · esc close'
    : '↑↓ navegar · ↵ abrir · esc cerrar';
  const footerLabel = isEn ? 'Global search' : 'Búsqueda global';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-3 pt-16 backdrop-blur-md sm:pt-24"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-zinc-950/85 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/5 backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
          <Search className="h-5 w-5 shrink-0 text-white/70" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-base text-white placeholder:text-white/50 focus:outline-none sm:text-lg"
            aria-label={placeholder}
          />
          {loading && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/60" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label={closeLabel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto scrollbar-none">
          {query.trim().length < 2 ? (
            <div className="px-5 py-10 text-center text-sm text-white/55">
              {emptyPrompt}
            </div>
          ) : !loading && items.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-white/55">
              {noResults}
            </div>
          ) : (
            <ul role="listbox">
              {items.map((it, i) => {
                const Icon = kindIcon[it.kind];
                const active = i === activeIdx;
                return (
                  <li key={`${it.kind}-${it.href}-${i}`} role="option" aria-selected={active}>
                    <Link
                      href={it.href}
                      onClick={onClose}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={`flex items-center gap-3 px-4 py-3 transition sm:px-5 ${
                        active ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                        <Icon className="h-4 w-4 text-white/85" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {it.label}
                        </p>
                        {it.sub && (
                          <p className="truncate text-xs text-white/55">
                            {it.sub}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
                        {kindLabel(it.kind)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-4 py-2 text-[10px] text-white/50 sm:px-5">
          <span>{footerHint}</span>
          <span className="hidden sm:inline">{footerLabel}</span>
        </div>
      </div>
    </div>
  );
}
