'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Client-side heart toggle for place detail pages.
 *
 * Starts in an "unknown" state and checks whether the slug is already a
 * favorite via `GET /api/favorites` on mount — the whole list comes back
 * anyway because it's a small payload and it lets us also derive the
 * correct state on every visit without needing a per-place GET endpoint.
 *
 * Unauthenticated users see the heart, but tapping it redirects to login.
 */
export function FavoriteHeartButton({
  slug,
  placeName,
  className = '',
}: {
  slug: string;
  placeName: string;
  className?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'on' | 'off' | 'anon'>(
    'loading',
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/favorites');
        if (res.status === 401) {
          if (!cancelled) setStatus('anon');
          return;
        }
        if (!res.ok) {
          if (!cancelled) setStatus('off');
          return;
        }
        const data = (await res.json()) as {
          favorites: { slug: string }[];
        };
        if (cancelled) return;
        setStatus(
          data.favorites.some((f) => f.slug === slug) ? 'on' : 'off',
        );
      } catch {
        if (!cancelled) setStatus('off');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function toggle() {
    if (status === 'anon') {
      router.push(`/iniciar-sesion?next=/lugares/${slug}`);
      return;
    }
    if (busy || status === 'loading') return;
    setBusy(true);
    const willAdd = status !== 'on';
    // Optimistic
    setStatus(willAdd ? 'on' : 'off');
    try {
      const res = willAdd
        ? await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ placeSlug: slug }),
          })
        : await fetch(
            `/api/favorites?slug=${encodeURIComponent(slug)}`,
            { method: 'DELETE' },
          );
      if (!res.ok && res.status !== 200) {
        // Rollback on error.
        setStatus(willAdd ? 'off' : 'on');
      }
    } catch {
      setStatus(willAdd ? 'off' : 'on');
    } finally {
      setBusy(false);
    }
  }

  const isOn = status === 'on';
  const label = isOn
    ? `Quitar ${placeName} de favoritos`
    : `Guardar ${placeName} en favoritos`;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || status === 'loading'}
      aria-label={label}
      aria-pressed={isOn}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
        isOn
          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      } ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={isOn ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.8}
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {isOn ? 'Guardado' : 'Guardar'}
    </button>
  );
}
