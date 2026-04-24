'use client';

import { useState } from 'react';

/**
 * "Compartir" button for the trip editor. Opens a dialog, calls
 * `POST /api/trips/:id/share` to generate a token, shows the public URL
 * with copy-to-clipboard, and lets the user rotate (= new URL, old dies)
 * or revoke (= public URL 404s).
 *
 * Kept small on purpose — no dropdown menu framework dependency.
 */
export function ShareTripButton({
  tripId,
  initialToken,
  initialPublic,
  label,
  closeLabel,
  rotateLabel,
  revokeLabel,
  copyLabel,
  copiedLabel,
}: {
  tripId: string;
  initialToken: string | null;
  initialPublic: boolean;
  label: string;
  closeLabel: string;
  rotateLabel: string;
  revokeLabel: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(
    initialPublic ? initialToken : null,
  );
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = token
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://rutasenmx.com'}/compartido/${token}`
    : null;

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/share`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.token) {
        setError(data?.error ?? 'No se pudo generar el enlace.');
        return;
      }
      setToken(data.token);
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    setBusy(true);
    try {
      await fetch(`/api/trips/${tripId}/share`, { method: 'DELETE' });
      setToken(null);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback: select-and-copy via a hidden input.
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          if (!token) void generate();
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        {label}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">{label}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Genera un enlace público de solo lectura. Cualquier persona con
              el enlace podrá ver tu itinerario.
            </p>

            {busy && !url ? (
              <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                Generando enlace…
              </div>
            ) : url ? (
              <>
                <div className="mt-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <input
                    readOnly
                    value={url}
                    aria-label="Enlace para compartir"
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 bg-transparent px-2 py-1 font-mono text-xs text-slate-700 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={copy}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    {copied ? copiedLabel : copyLabel}
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={generate}
                    disabled={busy}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {rotateLabel}
                  </button>
                  <button
                    type="button"
                    onClick={revoke}
                    disabled={busy}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    {revokeLabel}
                  </button>
                </div>
              </>
            ) : null}

            {error ? (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                {closeLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
