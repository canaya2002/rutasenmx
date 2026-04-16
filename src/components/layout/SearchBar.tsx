"use client";

import * as React from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { mockPlaces, mockStates, mockRoutes } from "@/lib/data/mock";

const MAX_PER_CATEGORY = 5;

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

function searchData(query: string): GroupedResults {
  const q = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const lugares = mockPlaces
    .filter(
      (p) =>
        normalize(p.name).includes(q) ||
        normalize(p.stateName).includes(q) ||
        normalize(p.description).includes(q) ||
        normalize(p.categoryName).includes(q)
    )
    .slice(0, MAX_PER_CATEGORY)
    .map((p) => ({
      label: p.name,
      href: `/lugares/${p.slug}`,
      subtitle: `${p.categoryName} - ${p.stateName}`,
    }));

  const estados = mockStates
    .filter(
      (s) =>
        normalize(s.name).includes(q) ||
        normalize(s.description).includes(q)
    )
    .slice(0, MAX_PER_CATEGORY)
    .map((s) => ({
      label: s.name,
      href: `/estados/${s.slug}`,
      subtitle: s.capital ? `Capital: ${s.capital}` : undefined,
    }));

  const rutas = mockRoutes
    .filter(
      (r) =>
        normalize(r.name).includes(q) ||
        normalize(r.description).includes(q) ||
        normalize(r.origin).includes(q) ||
        normalize(r.destination).includes(q)
    )
    .slice(0, MAX_PER_CATEGORY)
    .map((r) => ({
      label: r.name,
      href: `/rutas/${r.slug}`,
      subtitle: `${r.origin} → ${r.destination}`,
    }));

  return { lugares, estados, rutas };
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
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>(null);

  // Debounced search
  React.useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (value.length >= 2) {
        setResults(searchData(value));
        setIsOpen(true);
      } else {
        setResults({ lugares: [], estados: [], rutas: [] });
        setIsOpen(false);
      }
      onSearch?.(value);
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
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
      {/* Search icon */}
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

      {/* Clear button */}
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

      {/* Results dropdown */}
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
