'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';

export function CreateGroupForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    if (name.trim().length < 3) {
      setError('El nombre es muy corto');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/social/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          requiresApproval,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear');
      router.push(`/comunidad/${data.community.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Nombre del grupo *
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={160}
          placeholder="Ej. Road trippers CDMX-Oaxaca"
          className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Descripción ({description.length}/600)
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={600}
          placeholder="¿Sobre qué se habla aquí? ¿Qué se comparte?"
          className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </label>

      <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Requiere aprobación para entrar
          </p>
          <p className="text-xs text-slate-500">
            Revisas cada solicitud antes de que alguien se una.
          </p>
        </div>
        <input
          type="checkbox"
          checked={requiresApproval}
          onChange={(e) => setRequiresApproval(e.target.checked)}
          className="h-5 w-5 accent-emerald-600"
        />
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <button
        onClick={submit}
        disabled={submitting || name.trim().length < 3}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {submitting ? 'Creando…' : 'Crear grupo'}
      </button>
    </div>
  );
}
