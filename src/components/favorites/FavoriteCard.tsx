'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * A single favorited place card with an in-card "quitar" (remove) button.
 * Client component because the remove action fires an authenticated
 * DELETE /api/favorites?slug=... and needs to re-render on success.
 */
export function FavoriteCard({
  fav,
  isEn,
}: {
  fav: {
    id: string;
    slug: string;
    name: string;
    image: string;
    categoryName: string;
    stateName: string;
    notes: string | null;
  };
  isEn: boolean;
}) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);
  const [hidden, setHidden] = useState(false);

  async function onRemove() {
    setRemoving(true);
    try {
      const res = await fetch(
        `/api/favorites?slug=${encodeURIComponent(fav.slug)}`,
        { method: 'DELETE' },
      );
      if (res.ok) {
        setHidden(true);
        // Invalidate the server component so count + grid refresh.
        router.refresh();
      }
    } finally {
      setRemoving(false);
    }
  }

  if (hidden) return null;

  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-slate-100">
        {fav.image ? (
          <Image
            src={fav.image}
            alt={fav.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            {isEn ? 'No image' : 'Sin imagen'}
          </div>
        )}

        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          aria-label={isEn ? 'Remove from favorites' : 'Quitar de favoritos'}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 shadow transition hover:bg-white disabled:opacity-50"
        >
          {/* filled heart icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M12 21s-7-4.35-9.33-9A5.5 5.5 0 0112 6.5a5.5 5.5 0 019.33 5.5C19 16.65 12 21 12 21z" />
          </svg>
        </button>
      </div>

      <div className="p-4">
        <Link
          href={`/lugares/${fav.slug}`}
          className="font-semibold text-slate-900 hover:text-emerald-600"
        >
          {fav.name}
        </Link>
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
          {fav.categoryName ? <span>{fav.categoryName}</span> : null}
          {fav.categoryName && fav.stateName ? <span>-</span> : null}
          {fav.stateName ? <span>{fav.stateName}</span> : null}
        </div>
        {fav.notes ? (
          <p className="mt-2 text-sm text-slate-600">{fav.notes}</p>
        ) : null}
      </div>
    </div>
  );
}
