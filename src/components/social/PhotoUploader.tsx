'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, X } from 'lucide-react';

export interface UploadedPhoto {
  url: string;
  sha256: string;
  width: number;
  height: number;
}

interface Props {
  scope: 'avatar' | 'post';
  max?: number;
  value: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
}

export function PhotoUploader({ scope, max = 4, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = max - value.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;

    setUploading(true);
    setError(null);

    const uploaded: UploadedPhoto[] = [];
    for (const file of toUpload) {
      const form = new FormData();
      form.append('file', file);
      form.append('scope', scope);
      try {
        const res = await fetch('/api/social/upload', {
          method: 'POST',
          body: form,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Error al subir');
          break;
        }
        uploaded.push({
          url: data.url,
          sha256: data.sha256,
          width: data.width,
          height: data.height,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
        break;
      }
    }

    if (uploaded.length > 0) onChange([...value, ...uploaded]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (i: number) => {
    const next = [...value];
    next.splice(i, 1);
    onChange(next);
  };

  const canAdd = value.length < max;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((p, i) => (
          <div
            key={p.sha256 + i}
            className="relative h-20 w-20 overflow-hidden rounded-lg ring-1 ring-slate-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
              aria-label="Quitar foto"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {canAdd && (
          <label
            className={`flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-500 transition hover:border-emerald-400 hover:bg-emerald-50 ${
              uploading ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple={max > 1}
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
          </label>
        )}
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        JPEG / PNG / WebP · máx 10 MB · se revisan automáticamente.
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
