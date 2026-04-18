'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export interface StateHoverCardProps {
  name: string;
  slug: string;
  image?: string | null;
  /** Up to 4 thumbnails for the collage preview */
  collage?: string[];
  placesCount?: number;
}

/**
 * State tile with a hover-only floating collage preview (desktop).
 * On mobile we just show the main tile.
 */
export function StateHoverCard({ name, slug, image, collage, placesCount }: StateHoverCardProps) {
  const [hover, setHover] = useState(false);
  const tiles = (collage ?? []).slice(0, 4);
  const hasImage = !!image;

  return (
    <div
      className="group relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link
        href={`/estados/${slug}`}
        className="relative flex flex-col gap-2"
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
      >
        {/* Main tile */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5 transition group-hover:-translate-y-0.5 group-hover:shadow-xl">
          {hasImage ? (
            <Image
              src={image as string}
              alt={name}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 text-center text-2xl font-bold text-emerald-700/60">
              {name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition-opacity group-hover:from-black/80" />
          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
            <p className="text-base font-bold leading-tight text-white drop-shadow-md sm:text-lg">{name}</p>
            {placesCount != null && (
              <p className="text-[11px] font-medium text-white/85">
                {placesCount} lugares
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Hover collage overlay (desktop only). Keeps pointer-events:auto when
          visible so the cursor can move into it without dismissing the hover. */}
      {tiles.length > 0 && (
        <div
          aria-hidden
          className={`absolute left-1/2 top-full z-40 hidden w-[280px] -translate-x-1/2 rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-black/10 transition-all duration-300 lg:block ${
            hover
              ? 'translate-y-3 opacity-100'
              : 'pointer-events-none translate-y-0 opacity-0'
          }`}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {tiles.map((src, i) => (
              <div
                key={src + i}
                className={`relative overflow-hidden rounded-lg ${i === 0 ? 'col-span-2 aspect-[16/10]' : 'aspect-square'}`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="140px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <div className="mt-2 px-1 pb-1">
            <p className="text-sm font-semibold text-slate-900">{name}</p>
            <p className="text-xs text-[#06C167]">Descubrir →</p>
          </div>
        </div>
      )}
    </div>
  );
}
