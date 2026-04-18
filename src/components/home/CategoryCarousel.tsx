'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CategoryCard {
  label: string;
  href: string;
  image: string;
  iconSvg?: string;
  color?: string;
}

export function CategoryCarousel({
  items,
  ariaLabel,
}: {
  items: readonly CategoryCard[];
  ariaLabel: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const refresh = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    refresh();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', refresh, { passive: true });
    window.addEventListener('resize', refresh);
    return () => {
      el.removeEventListener('scroll', refresh);
      window.removeEventListener('resize', refresh);
    };
  }, [refresh]);

  const nudge = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 900), behavior: 'smooth' });
  };

  return (
    <div className="relative" role="region" aria-label={ariaLabel}>
      {/* Left fade + button */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent transition-opacity ${canLeft ? 'opacity-100' : 'opacity-0'}`}
      />
      <button
        type="button"
        onClick={() => nudge(-1)}
        aria-label="Scroll left"
        className={`absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white p-2.5 shadow-lg ring-1 ring-black/5 transition ${canLeft ? 'opacity-100 hover:scale-105' : 'pointer-events-none opacity-0'}`}
      >
        <ChevronLeft className="h-5 w-5 text-slate-800" />
      </button>

      <div
        ref={scrollerRef}
        className="scrollbar-none flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 py-2"
      >
        {items.map((c) => (
          <Link
            key={c.href + c.label}
            href={c.href}
            className="group relative flex h-[260px] w-[220px] shrink-0 snap-start overflow-hidden rounded-3xl shadow-md ring-1 ring-black/5 transition-transform hover:-translate-y-1 hover:shadow-2xl sm:h-[300px] sm:w-[260px]"
          >
            <Image
              src={c.image}
              alt={c.label}
              fill
              sizes="(max-width: 640px) 220px, 260px"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity group-hover:from-black/90" />

            {c.iconSvg && (
              <span
                className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 shadow-lg ring-1 ring-black/5 backdrop-blur-sm transition-transform group-hover:rotate-[-6deg] group-hover:scale-110"
                aria-hidden
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.iconSvg} alt="" className="h-7 w-7" />
              </span>
            )}

            <div className="relative z-10 mt-auto w-full p-5">
              <h3 className="text-xl font-bold leading-tight text-white drop-shadow-md sm:text-2xl">
                {c.label}
              </h3>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-white/80">
                <span className="h-px w-6 bg-white/60 transition-all group-hover:w-10" />
                <span className="transition-transform group-hover:translate-x-1">Explorar →</span>
              </span>
            </div>
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={() => nudge(1)}
        aria-label="Scroll right"
        className={`absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white p-2.5 shadow-lg ring-1 ring-black/5 transition ${canRight ? 'opacity-100 hover:scale-105' : 'pointer-events-none opacity-0'}`}
      >
        <ChevronRight className="h-5 w-5 text-slate-800" />
      </button>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent transition-opacity ${canRight ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
