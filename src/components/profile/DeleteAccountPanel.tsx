'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Danger-zone panel at the bottom of `/perfil`. Handles the App Store /
 * Google Play mandated in-app account deletion.
 *
 * Flow:
 *   1. User clicks "Eliminar mi cuenta" (or arrives with `?delete=1` from the
 *      mobile app, which deep-links here to satisfy the platform rule).
 *   2. Modal asks them to type `ELIMINAR` to confirm.
 *   3. On confirm → DELETE /api/account → show success message → push to /.
 */
export function DeleteAccountPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Derive initial open state from the URL so the mobile app's deep-link
  // (`/perfil?delete=1`) auto-opens the modal. Computing it at init avoids
  // the "setState inside useEffect" lint warning and renders right the
  // first time — no flash of the collapsed view.
  const [open, setOpen] = useState(() => searchParams.get('delete') === '1');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleDelete() {
    if (confirmation !== 'ELIMINAR') {
      setError('Escribe ELIMINAR en mayúsculas para confirmar.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? 'No se pudo completar la eliminación.');
        setSubmitting(false);
        return;
      }
      setSuccess(data?.message ?? 'Cuenta eliminada.');
      setTimeout(() => router.push('/'), 2500);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-12 rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
      <h2 className="text-lg font-bold text-red-300">Zona peligrosa</h2>
      <p className="mt-2 text-sm text-red-100/80">
        Eliminar tu cuenta cancelará tu suscripción activa, cerrará tus matches
        y anonimizará tu perfil inmediatamente. En 30 días borraremos
        completamente tus viajes, mensajes y fotos.
      </p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-4 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
        >
          Eliminar mi cuenta
        </button>
      ) : success ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 rounded-lg bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200"
        >
          {success} Te estamos mandando a la página de inicio…
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <label htmlFor="delete-confirm" className="block text-xs font-semibold uppercase tracking-wider text-red-200">
            Para confirmar, escribe <code className="rounded bg-black/40 px-1 py-0.5">ELIMINAR</code>
          </label>
          <input
            id="delete-confirm"
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className="w-full rounded-lg border border-red-500/40 bg-black/20 px-3 py-2 font-mono text-sm text-red-100 placeholder:text-red-300/40 focus:border-red-400 focus:outline-none"
            placeholder="ELIMINAR"
            disabled={submitting}
          />
          {error ? (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDelete}
              disabled={submitting || confirmation !== 'ELIMINAR'}
              className="rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-40"
            >
              {submitting ? 'Eliminando…' : 'Eliminar definitivamente'}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setConfirmation('');
                setError(null);
              }}
              disabled={submitting}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/5"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
