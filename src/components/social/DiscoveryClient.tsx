'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Filter, Heart, Loader2, Sparkles } from 'lucide-react';

import { SwipeCard } from './SwipeCard';
import { MatchModal } from './MatchModal';
import { ReportDialog } from './ReportDialog';
import { ESTADOS_MEXICO } from '@/lib/constants';
import {
  SOCIAL_INTENT_EMOJIS,
  SOCIAL_INTENT_LABELS,
} from '@/lib/social/constants';
import type { SocialIntent, SocialProfileView } from '@/lib/social/types';

const INTENTS: SocialIntent[] = ['convivir', 'salir', 'explorar', 'conocer'];

interface QueueResponse {
  queue?: SocialProfileView[];
  needsProfile?: boolean;
  error?: string;
}

export function DiscoveryClient() {
  const [queue, setQueue] = useState<SocialProfileView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [destino, setDestino] = useState<string>('');
  const [intent, setIntent] = useState<SocialIntent | ''>('');
  const [match, setMatch] = useState<{
    other: SocialProfileView;
    matchId: string;
  } | null>(null);
  const [reportTarget, setReportTarget] = useState<SocialProfileView | null>(
    null,
  );
  const [showFilters, setShowFilters] = useState(false);

  const current = queue[0];

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (destino) params.set('destino', destino);
      if (intent) params.set('intent', intent);
      const res = await fetch(`/api/social/queue?${params.toString()}`);
      const data = (await res.json()) as QueueResponse;
      if (!res.ok) {
        if (data.needsProfile) {
          setError('profile-missing');
          return;
        }
        throw new Error(data.error || 'Error al cargar');
      }
      setQueue(data.queue ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [destino, intent]);

  useEffect(() => {
    void fetchQueue();
  }, [fetchQueue]);

  const swipe = async (action: 'like' | 'pass') => {
    if (!current || busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/social/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: current.userId, action }),
      });
      const data = (await res.json()) as {
        matched?: boolean;
        matchId?: string;
        otherProfile?: SocialProfileView;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || 'Error al conectar');

      // Pop the current card regardless
      setQueue((q) => q.slice(1));

      if (data.matched && data.otherProfile && data.matchId) {
        setMatch({ other: data.otherProfile, matchId: data.matchId });
      }

      // Prefetch more when the stack runs low
      if (queue.length <= 3) {
        void fetchQueue();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const filterCount = useMemo(
    () => (destino ? 1 : 0) + (intent ? 1 : 0),
    [destino, intent],
  );

  if (error === 'profile-missing') {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-emerald-600" />
        <h2 className="mt-3 text-xl font-bold text-slate-900">
          Primero crea tu perfil social
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Necesitas un perfil público para descubrir a otras personas.
        </p>
        <Link
          href="/conectar/perfil"
          className="mt-5 inline-block rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
        >
          Crear mi perfil
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          className="flex w-full items-center justify-between"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Filter className="h-4 w-4 text-emerald-600" />
            Filtros
            {filterCount > 0 && (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {filterCount}
              </span>
            )}
          </span>
          <span className="text-xs text-slate-500">
            {showFilters ? 'Ocultar' : 'Mostrar'}
          </span>
        </button>

        {showFilters && (
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Estado destino
              </span>
              <select
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm"
              >
                <option value="">Cualquiera</option>
                {ESTADOS_MEXICO.map((e) => (
                  <option key={e.slug} value={e.slug}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Intención
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setIntent('')}
                  className={`rounded-full px-3 py-1 text-xs ${
                    intent === ''
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Todos
                </button>
                {INTENTS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIntent(intent === i ? '' : i)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${
                      intent === i
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{SOCIAL_INTENT_EMOJIS[i]}</span>
                    {SOCIAL_INTENT_LABELS[i]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stack */}
      <div className="flex min-h-[560px] items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Cargando viajeros…</span>
          </div>
        ) : current ? (
          <SwipeCard
            profile={current}
            onLike={() => swipe('like')}
            onPass={() => swipe('pass')}
            onReport={() => setReportTarget(current)}
            disabled={busy}
          />
        ) : (
          <div className="text-center">
            <Heart className="mx-auto h-10 w-10 text-emerald-600" />
            <p className="mt-3 text-lg font-semibold text-slate-900">
              Ya viste a todos por ahora
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Ajusta los filtros o vuelve después para ver nuevos perfiles.
            </p>
            <button
              onClick={fetchQueue}
              className="mt-4 rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white"
            >
              Recargar
            </button>
          </div>
        )}
      </div>

      {error && error !== 'profile-missing' && (
        <p className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
          {error}
        </p>
      )}

      {match && (
        <MatchModal
          other={match.other}
          matchId={match.matchId}
          onClose={() => setMatch(null)}
        />
      )}
      {reportTarget && (
        <ReportDialog
          reportedId={reportTarget.userId}
          displayName={reportTarget.displayName}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}
