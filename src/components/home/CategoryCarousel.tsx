'use client';

import Image from 'next/image';
import Link from 'next/link';

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
  return (
    <div className="overflow-hidden" role="region" aria-label={ariaLabel}>
      {/* Auto-scrolling track — duplicated items for seamless loop */}
      <div className="animate-marquee flex w-max gap-5 py-2">
        {[...items, ...items].map((c, i) => (
          <Link
            key={`${c.href}-${i}`}
            href={c.href}
            className="group relative flex h-[260px] w-[220px] shrink-0 overflow-hidden rounded-3xl shadow-md ring-1 ring-black/5 transition-transform hover:-translate-y-1 hover:shadow-2xl sm:h-[300px] sm:w-[260px]"
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
    </div>
  );
}
