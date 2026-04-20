'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Flag, MoreVertical, Send, ShieldOff } from 'lucide-react';

import { SOCIAL_MESSAGE_MAX } from '@/lib/social/constants';
import type { SocialMessageView, SocialProfileView } from '@/lib/social/types';
import { ReportDialog } from './ReportDialog';

interface Props {
  matchId: string;
  other: SocialProfileView;
  initialMessages: SocialMessageView[];
  myUserId: string;
  isClosed: boolean;
}

const POLL_INTERVAL_MS = 3000;

export function ChatClient({
  matchId,
  other,
  initialMessages,
  myUserId,
  isClosed: initialClosed,
}: Props) {
  const [messages, setMessages] = useState<SocialMessageView[]>(initialMessages);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [closed, setClosed] = useState(initialClosed);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<string | null>(
    initialMessages[initialMessages.length - 1]?.id ?? null,
  );

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Polling loop
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const url = lastIdRef.current
          ? `/api/social/matches/${matchId}/messages?after=${lastIdRef.current}`
          : `/api/social/matches/${matchId}/messages`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = (await res.json()) as { messages?: SocialMessageView[] };
        const incoming = data.messages ?? [];
        if (cancelled || incoming.length === 0) return;
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const merged = [...prev];
          for (const m of incoming) {
            if (!seen.has(m.id)) merged.push(m);
          }
          return merged;
        });
        lastIdRef.current = incoming[incoming.length - 1].id;
      } catch {
        // swallow — we'll retry next tick
      }
    };
    const timer = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [matchId]);

  const send = async () => {
    const trimmed = body.trim();
    if (!trimmed || sending || closed) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/social/matches/${matchId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar');
      setMessages((prev) => [...prev, data.message]);
      lastIdRef.current = data.message.id;
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSending(false);
    }
  };

  const closeThisMatch = async () => {
    if (!confirm('¿Cerrar esta conversación? No podrás enviar más mensajes.')) return;
    await fetch(`/api/social/matches/${matchId}`, { method: 'DELETE' });
    setClosed(true);
    setShowMenu(false);
  };

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col bg-slate-50">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Link
          href="/conectar/matches"
          className="rounded-full p-1.5 hover:bg-slate-100"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5 text-slate-700" />
        </Link>
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-emerald-100 ring-1 ring-emerald-200">
          {other.photoUrl ? (
            <Image
              src={other.photoUrl}
              alt={other.displayName}
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-emerald-700">
              {other.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">
            {other.displayName}
          </p>
          {other.destinoEstadoName && (
            <p className="truncate text-xs text-slate-500">
              Va a {other.destinoEstadoName}
            </p>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu((s) => !s)}
            className="rounded-full p-2 hover:bg-slate-100"
            aria-label="Más opciones"
          >
            <MoreVertical className="h-5 w-5 text-slate-700" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setReporting(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <Flag className="h-4 w-4" />
                Reportar
              </button>
              {!closed && (
                <button
                  onClick={closeThisMatch}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <ShieldOff className="h-4 w-4" />
                  Cerrar conversación
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mx-auto max-w-2xl space-y-2">
          {messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              ¡Conectaron! Rompe el hielo con el primer mensaje.
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.senderId === myUserId;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-6 shadow-sm ${
                      mine
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-900 ring-1 ring-slate-200'
                    }`}
                  >
                    {m.body}
                    <div
                      className={`mt-0.5 text-[10px] ${
                        mine ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      {new Date(m.createdAt).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-slate-200 bg-white px-3 py-3">
        {closed ? (
          <p className="text-center text-xs text-slate-500">
            Esta conversación está cerrada.
          </p>
        ) : (
          <div className="mx-auto flex max-w-2xl items-end gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              maxLength={SOCIAL_MESSAGE_MAX}
              placeholder="Escribe un mensaje…"
              className="min-h-[40px] max-h-32 flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              onClick={send}
              disabled={!body.trim() || sending}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow transition hover:bg-emerald-700 disabled:opacity-50"
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
        {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
      </div>

      {reporting && (
        <ReportDialog
          reportedId={other.userId}
          displayName={other.displayName}
          onClose={() => setReporting(false)}
        />
      )}
    </div>
  );
}
