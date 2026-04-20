'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Save } from 'lucide-react';

import { ESTADOS_MEXICO } from '@/lib/constants';
import {
  SOCIAL_BIO_MAX,
  SOCIAL_DISPLAY_NAME_MAX,
  SOCIAL_INTENT_EMOJIS,
  SOCIAL_INTENT_LABELS,
  SOCIAL_INTEREST_OPTIONS,
  SOCIAL_LANGUAGE_OPTIONS,
} from '@/lib/social/constants';
import type { SocialProfileView, SocialIntent } from '@/lib/social/types';

const INTENTS: SocialIntent[] = ['convivir', 'salir', 'explorar', 'conocer'];

interface Props {
  initial: SocialProfileView | null;
  /** Where to redirect after a successful save. */
  redirectTo?: string;
  userAvatar?: string | null;
  userName?: string | null;
}

export function SocialProfileForm({
  initial,
  redirectTo = '/conectar/descubrir',
  userAvatar,
  userName,
}: Props) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(
    initial?.displayName ?? userName ?? '',
  );
  const [bio, setBio] = useState(initial?.bio ?? '');
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? userAvatar ?? '');
  const [destino, setDestino] = useState(initial?.destinoEstadoSlug ?? '');
  const [interests, setInterests] = useState<string[]>(initial?.interests ?? []);
  const [intent, setIntent] = useState<SocialIntent | null>(
    initial?.intent ?? null,
  );
  const [age, setAge] = useState<string>(
    initial?.age != null ? String(initial.age) : '',
  );
  const [languages, setLanguages] = useState<string[]>(
    initial?.languages ?? ['Español'],
  );
  const [isVisible, setIsVisible] = useState(initial?.isVisible ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (arr: string[], set: (v: string[]) => void, val: string) => {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const submit = async () => {
    setError(null);
    if (displayName.trim().length < 2) {
      setError('Tu nombre visible es muy corto');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        displayName: displayName.trim(),
        bio: bio.trim() || null,
        photoUrl: photoUrl.trim() || null,
        destinoEstadoSlug: destino || null,
        interests,
        intent,
        age: age ? Number(age) : null,
        languages,
        travelFrom: null,
        travelTo: null,
        isVisible,
      };
      const res = await fetch('/api/social/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'No se pudo guardar');
      }
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Foto */}
      <section className="flex items-center gap-4">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 ring-2 ring-emerald-300">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={displayName}
              className="h-full w-full object-cover"
              onError={() => setPhotoUrl('')}
            />
          ) : (
            <Camera className="h-8 w-8 text-emerald-700/70" />
          )}
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            URL de tu foto
          </label>
          <input
            type="url"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <p className="mt-1 text-xs text-slate-500">
            Usa el link de una imagen pública. Próximamente: subida directa.
          </p>
        </div>
      </section>

      {/* Nombre + edad */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Nombre visible *
          </span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={SOCIAL_DISPLAY_NAME_MAX}
            required
            className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Edad
          </span>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min={18}
            max={99}
            className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </label>
      </section>

      {/* Bio */}
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Bio corta ({bio.length}/{SOCIAL_BIO_MAX})
        </span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={SOCIAL_BIO_MAX}
          rows={3}
          placeholder="¿Qué te define? ¿Qué buscas en este viaje?"
          className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </label>

      {/* Destino */}
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Estado al que vas 🇲🇽
        </span>
        <select
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">Sin destino específico</option>
          {ESTADOS_MEXICO.map((e) => (
            <option key={e.slug} value={e.slug}>
              {e.name}
            </option>
          ))}
        </select>
      </label>

      {/* Intent */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Qué buscas *
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {INTENTS.map((i) => {
            const active = intent === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setIntent(active ? null : i)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-sm transition ${
                  active
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-2xl">{SOCIAL_INTENT_EMOJIS[i]}</span>
                <span className="text-xs font-semibold">
                  {SOCIAL_INTENT_LABELS[i]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Intereses */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Intereses (máx 10) · {interests.length}/10
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SOCIAL_INTEREST_OPTIONS.map((tag) => {
            const active = interests.includes(tag);
            const disabled = !active && interests.length >= 10;
            return (
              <button
                key={tag}
                type="button"
                disabled={disabled}
                onClick={() => toggle(interests, setInterests, tag)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : disabled
                      ? 'bg-slate-100 text-slate-400'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </section>

      {/* Idiomas */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Idiomas
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SOCIAL_LANGUAGE_OPTIONS.map((lang) => {
            const active = languages.includes(lang);
            const disabled = !active && languages.length >= 5;
            return (
              <button
                key={lang}
                type="button"
                disabled={disabled}
                onClick={() => toggle(languages, setLanguages, lang)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  active
                    ? 'bg-slate-900 text-white'
                    : disabled
                      ? 'bg-slate-100 text-slate-400'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </section>

      {/* Visibilidad */}
      <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Perfil visible para otros
          </p>
          <p className="text-xs text-slate-500">
            Cuando esté desactivado, nadie verá tu perfil en descubrimiento.
          </p>
        </div>
        <input
          type="checkbox"
          checked={isVisible}
          onChange={(e) => setIsVisible(e.target.checked)}
          className="h-5 w-5 accent-emerald-600"
        />
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <button
        onClick={submit}
        disabled={submitting || displayName.trim().length < 2}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white shadow transition hover:bg-emerald-700 disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {submitting ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear perfil social'}
      </button>
    </div>
  );
}
