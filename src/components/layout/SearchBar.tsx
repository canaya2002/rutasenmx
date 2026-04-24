"use client";

import * as React from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Header search bar. Previously imported `mockPlaces`, `mockStates`,
 * `mockRoutes` (~500 KB of static JSON) into every client bundle. Now it
 * fetches from `/api/search/suggestions` with debounce, so the header ships
 * kilobytes instead of megabytes and the search stays in sync with the
 * catalog without a code change.
 */

interface SearchResult {
  label: string;
  href: string;
  subtitle?: string;
}

interface GroupedResults {
  lugares: SearchResult[];
  estados: SearchResult[];
  rutas: SearchResult[];
}

interface SuggestionItem {
  kind: 'place' | 'state' | 'category' | 'route';
  label: string;
  sub?: string;
  href: string;
}

function groupItems(items: SuggestionItem[]): GroupedResults {
  const out: GroupedResults = { lugares: [], estados: [], rutas: [] };
  for (const it of items) {
    const entry: SearchResult = {
      label: it.label,
      href: it.href,
      subtitle: it.sub,
    };
    if (it.kind === 'place') out.lugares.push(entry);
    else if (it.kind === 'state') out.estados.push(entry);
    else if (it.kind === 'route') out.rutas.push(entry);
    // 'category' is ignored in this bar (header doesn't show categorías).
  }
  return out;
}

interface SearchBarProps {
  /** Placeholder text */
  placeholder?: string;
  /** Callback with the debounced search value */
  onSearch?: (value: string) => void;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Additional class names */
  className?: string;
}

export function SearchBar({
  placeholder = "Buscar destinos, rutas, pueblos...",
  onSearch,
  debounceMs = 300,
  className,
}: SearchBarProps) {
  const [value, setValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [results, setResults] = React.useState<GroupedResults>({
    lugares: [],
    estados: [],
    rutas: [],
  });
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Debounced network search.
  React.useEffect(() => {
    if (value.length < 2) {
      setResults({ lugares: [], estados: [], rutas: [] });
      setIsOpen(false);
      onSearch?.(value);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(value)}&limit=15`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { items: SuggestionItem[] };
        setResults(groupItems(data.items));
        setIsOpen(true);
      } catch {
        // AbortError on rapid typing — safe to ignore.
      }
      onSearch?.(value);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, debounceMs, onSearch]);

  // Close on click outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClear = () => {
    setValue("");
    setResults({ lugares: [], estados: [], rutas: [] });
    setIsOpen(false);
    onSearch?.("");
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (value.length >= 2) {
      setIsOpen(true);
    }
  };

  const totalResults =
    results.lugares.length + results.estados.length + results.rutas.length;

  const groups: { key: keyof GroupedResults; title: string }[] = [
    { key: "lugares", title: "Lugares" },
    { key: "estados", title: "Estados" },
    { key: "rutas", title: "Rutas" },
  ];

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-md", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={handleFocus}
        placeholder={placeholder}
        className="pl-9 pr-9"
        aria-label="Buscar"
      />

      {value.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Limpiar busqueda"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {isOpen && value.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {totalResults === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-slate-500">
                Sin resultados para &ldquo;{value}&rdquo;
              </p>
            </div>
          ) : (
            <div className="py-1">
              {groups.map(({ key, title }) => {
                const items = results[key];
                if (items.length === 0) return null;
                return (
                  <div key={key}>
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {title}
                      </p>
                    </div>
                    {items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex flex-col gap-0.5 px-3 py-2 transition-colors hover:bg-slate-50"
                      >
                        <span className="text-sm font-medium text-slate-800">
                          {item.label}
                        </span>
                        {item.subtitle && (
                          <span className="text-xs text-slate-400">
                            {item.subtitle}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
