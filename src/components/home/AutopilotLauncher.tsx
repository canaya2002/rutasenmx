'use client';

import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { AutopilotWizard } from '@/components/ai/AutopilotWizard';
import { useLocale } from '@/components/providers/LocaleProvider';

/**
 * Button + modal that opens the AutopilotWizard inline.
 * Exposes a window-level event `rutasmx:open-autopilot` so other places can
 * launch it without prop drilling.
 */
export function AutopilotLauncher({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const { locale } = useLocale();
  const isEn = locale === 'en';

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('rutasmx:open-autopilot', handler);
    return () => window.removeEventListener('rutasmx:open-autopilot', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#06C167] px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600 hover:shadow-emerald-500/40"
      >
        <Sparkles className="h-4 w-4" />
        {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isEn ? 'AI route planner' : 'Planificador de rutas con IA'}
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="animate-popup-fade-in absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
          />

          {/* Dialog */}
          <div className="animate-fade-up relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-[#06C167]">
                  <Sparkles className="h-4 w-4" />
                </span>
                <p className="text-sm font-semibold text-slate-900">
                  {isEn ? 'AI Autopilot' : 'Autopilot con IA'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-4 sm:px-6">
              <AutopilotWizard />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
