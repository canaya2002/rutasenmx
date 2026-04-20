import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { Heart, MessageCircle } from 'lucide-react';

import { buildPageMetadata } from '@/lib/seo/metadata';
import { optionalAuth } from '@/lib/auth/middleware';
import { canAccess } from '@/lib/subscription/plans';
import { listMatches } from '@/lib/social/chat';

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'Mis matches · Conectar',
    description: 'Conversa con los viajeros con los que hiciste match.',
    path: '/conectar/matches',
  }),
  robots: { index: false, follow: false },
};

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'ahora';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export default async function MatchesPage() {
  const session = await optionalAuth();
  if (!session) redirect('/iniciar-sesion?next=/conectar/matches');
  if (!canAccess(session.plan, 'social_connect')) redirect('/conectar');

  const matches = await listMatches(session.userId);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Mis conversaciones</h1>
        <Link
          href="/conectar/descubrir"
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Descubrir
        </Link>
      </header>

      {matches.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <Heart className="mx-auto h-10 w-10 text-emerald-500" />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">
            Aún no tienes matches
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Cuando un like sea mutuo, aparecerá aquí. Explora más perfiles.
          </p>
          <Link
            href="/conectar/descubrir"
            className="mt-5 inline-block rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700"
          >
            Ir a descubrir
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {matches.map((m) => (
            <li key={m.matchId}>
              <Link
                href={`/conectar/chat/${m.matchId}`}
                className="flex items-center gap-4 p-4 transition hover:bg-slate-50"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-emerald-100 ring-1 ring-emerald-200">
                  {m.other.photoUrl ? (
                    <Image
                      src={m.other.photoUrl}
                      alt={m.other.displayName}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xl font-bold text-emerald-700">
                      {m.other.displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-semibold text-slate-900">
                      {m.other.displayName}
                    </p>
                    <span className="shrink-0 text-[11px] text-slate-500">
                      {timeAgo(m.lastMessageAt ?? m.createdAt)}
                    </span>
                  </div>
                  <p className="truncate text-sm text-slate-500">
                    {m.isClosed
                      ? 'Conversación cerrada'
                      : m.lastMessagePreview ?? 'Di hola 👋'}
                  </p>
                  {m.other.destinoEstadoName && (
                    <p className="truncate text-xs text-slate-400">
                      Va a {m.other.destinoEstadoName}
                    </p>
                  )}
                </div>
                {m.unreadCount > 0 && (
                  <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-bold text-white">
                    {m.unreadCount}
                  </span>
                )}
                <MessageCircle className="h-5 w-5 shrink-0 text-slate-300" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
