'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';

import { PhotoUploader, type UploadedPhoto } from './PhotoUploader';

interface Props {
  communitySlug: string;
}

export function PostComposer({ communitySlug }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    if (title.trim().length < 3 || body.trim().length < 3) {
      setError('Completa título y contenido');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/social/communities/${communitySlug}/posts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            body: body.trim(),
            photoUrls: photos.map((p) => p.url),
            photoHashes: photos.map((p) => p.sha256),
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al publicar');
      router.push(`/comunidad/post/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Título
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Comparte tu experiencia…"
          className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-base font-medium focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Contenido ({body.length}/8000)
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={8000}
          rows={6}
          placeholder="Detalles, recomendaciones, preguntas…"
          className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Fotos (opcional, máx 4)
        </label>
        <div className="mt-2">
          <PhotoUploader
            scope="post"
            max={4}
            value={photos}
            onChange={setPhotos}
          />
        </div>
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      <button
        onClick={submit}
        disabled={submitting || title.trim().length < 3 || body.trim().length < 3}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white shadow transition hover:bg-emerald-700 disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {submitting ? 'Publicando…' : 'Publicar'}
      </button>
    </div>
  );
}
