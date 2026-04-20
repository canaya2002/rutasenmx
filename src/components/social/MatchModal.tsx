'use client';

import Link from 'next/link';
import Image from 'next/image';
import { X, MessageCircle } from 'lucide-react';

import type { SocialProfileView } from '@/lib/social/types';

interface Props {
  other: SocialProfileView;
  matchId: string;
  onClose: () => void;
}

export function MatchModal({ other, matchId, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800 p-8 text-white shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 transition hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-200">
          ✨ Match ✨
        </p>
        <h2 className="mt-2 text-center text-3xl font-extrabold">
          ¡Conectaste con {other.displayName}!
        </h2>
        <p className="mt-2 text-center text-sm text-emerald-100">
          Empieza la conversación. Ambos se dieron like.
        </p>

        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="relative h-28 w-28 overflow-hidden rounded-full ring-4 ring-white/30">
            {other.photoUrl ? (
              <Image
                src={other.photoUrl}
                alt={other.displayName}
                fill
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-white/10 text-4xl font-bold">
                {other.displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/conectar/chat/${matchId}`}
            className="flex-1 rounded-full bg-white py-3 text-center text-sm font-bold text-emerald-700 shadow transition hover:bg-emerald-50"
          >
            <MessageCircle className="mr-1.5 inline h-4 w-4" />
            Escribir mensaje
          </Link>
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-white/30 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            Seguir descubriendo
          </button>
        </div>
      </div>
    </div>
  );
}
