'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MapPin, Heart, X, Flag, Sparkles } from 'lucide-react';

import type { SocialProfileView } from '@/lib/social/types';
import {
  SOCIAL_INTENT_EMOJIS,
  SOCIAL_INTENT_LABELS,
} from '@/lib/social/constants';

interface Props {
  profile: SocialProfileView;
  onLike: () => void;
  onPass: () => void;
  onReport: () => void;
  disabled?: boolean;
}

export function SwipeCard({ profile, onLike, onPass, onReport, disabled }: Props) {
  const [imgOk, setImgOk] = useState(true);
  const hasPhoto = !!profile.photoUrl && imgOk;

  return (
    <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-emerald-200 to-emerald-50">
        {hasPhoto ? (
          <Image
            src={profile.photoUrl!}
            alt={profile.displayName}
            fill
            sizes="(max-width: 640px) 100vw, 384px"
            className="object-cover"
            onError={() => setImgOk(false)}
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-6xl font-bold text-emerald-700/60">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <button
          type="button"
          onClick={onReport}
          aria-label="Reportar"
          className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
        >
          <Flag className="h-4 w-4" />
        </button>

        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-bold drop-shadow">
              {profile.displayName}
            </h2>
            {profile.age != null && (
              <span className="text-lg opacity-90">· {profile.age}</span>
            )}
          </div>
          {profile.destinoEstadoName && (
            <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium drop-shadow">
              <MapPin className="h-3.5 w-3.5" />
              Va a {profile.destinoEstadoName}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3 p-5">
        {profile.intent && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <span>{SOCIAL_INTENT_EMOJIS[profile.intent]}</span>
            {SOCIAL_INTENT_LABELS[profile.intent]}
          </div>
        )}

        {profile.bio && (
          <p className="line-clamp-4 text-sm leading-6 text-slate-700">
            {profile.bio}
          </p>
        )}

        {profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.interests.slice(0, 8).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {profile.travelFrom && profile.travelTo && (
          <p className="text-xs text-slate-500">
            <Sparkles className="mr-1 inline h-3 w-3" />
            Viaja del {profile.travelFrom} al {profile.travelTo}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 border-t border-slate-100 bg-slate-50 p-4">
        <button
          type="button"
          onClick={onPass}
          disabled={disabled}
          aria-label="Pasar"
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-slate-600 shadow-sm transition hover:scale-105 hover:border-slate-400 hover:text-slate-800 disabled:opacity-50"
        >
          <X className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={onLike}
          disabled={disabled}
          aria-label="Conectar"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg transition hover:scale-105 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
        >
          <Heart className="h-7 w-7" fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
