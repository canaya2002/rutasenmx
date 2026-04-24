'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

import {
  REPORT_REASONS,
  REPORT_REASON_LABELS,
  type ReportReason,
} from '@/lib/social/constants';

interface Props {
  postId: string;
  onClose: () => void;
}

/**
 * Replaces the old `prompt()` UX for flagging a post. Posts the selected
 * reason to `/api/social/posts/[postId]/flag`, shows confirmation, and
 * closes — identical shape to ReportDialog so the UX stays consistent.
 */
export function FlagPostDialog({ postId, onClose }: Props) {
  const [reason, setReason] = useState<ReportReason>('inappropriate_content');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/social/posts/${postId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, note: note || undefined }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'No se pudo enviar el reporte');
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>

        {done ? (
          <>
            <h2 className="text-xl font-bold text-slate-900">
              Gracias por tu reporte
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Revisaremos la publicación. Si recibe 3 reportes se oculta
              automáticamente mientras el equipo valida.
            </p>
            <button
              onClick={onClose}
              className="mt-5 w-full rounded-full bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Cerrar
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-slate-900">
              Reportar publicación
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Cuéntanos por qué consideras que esta publicación no debe estar
              aquí.
            </p>

            <fieldset className="mt-5 space-y-2">
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Motivo
              </legend>
              {REPORT_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${
                    reason === r
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="flag-reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  {REPORT_REASON_LABELS[r]}
                </label>
              ))}
            </fieldset>

            <label className="mt-4 block text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Contexto (opcional)
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="¿Qué pasó exactamente?"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {submitting ? 'Enviando…' : 'Enviar reporte'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
