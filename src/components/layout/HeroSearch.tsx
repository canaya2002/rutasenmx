"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "@/components/providers/LocaleProvider";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const t = useTranslation();

  function handleSubmit() {
    const trimmed = query.trim();
    if (trimmed.length > 0) {
      router.push(`/explorar?search=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <div className="mx-auto mt-10 flex max-w-lg flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <label htmlFor="hero-search" className="sr-only">
          {t.hero.searchPlaceholder}
        </label>
        <input
          id="hero-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={t.hero.searchPlaceholder}
          className="w-full rounded-full border-0 bg-white/95 px-5 py-3.5 text-sm text-slate-900 shadow-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
      >
        {t.common.search}
      </button>
    </div>
  );
}
