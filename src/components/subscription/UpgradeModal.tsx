'use client';

import { useState } from 'react';
import Link from 'next/link';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: 'trips' | 'stops' | 'feature';
  limitValue?: number;
  featureName?: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  limitType,
  limitValue,
  featureName,
}: UpgradeModalProps) {
  const [closing, setClosing] = useState(false);

  if (!isOpen) return null;

  function handleClose() {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 150);
  }

  const messages: Record<string, { title: string; description: string }> = {
    trips: {
      title: 'Limite de viajes alcanzado',
      description: `Has alcanzado el limite de ${limitValue ?? 1} viaje${(limitValue ?? 1) > 1 ? 's' : ''} de tu plan actual. Sube de plan para guardar mas viajes.`,
    },
    stops: {
      title: 'Limite de paradas alcanzado',
      description: `Has alcanzado el limite de ${limitValue ?? 7} paradas por viaje de tu plan actual. Sube de plan para agregar mas paradas.`,
    },
    feature: {
      title: 'Funcionalidad no disponible',
      description: `${featureName || 'Esta funcionalidad'} no esta incluida en tu plan actual. Sube de plan para desbloquearla.`,
    },
  };

  const message = messages[limitType];

  const benefits = [
    'Mas viajes guardados',
    'Mas paradas por viaje',
    'Exportacion PDF y GPX',
    'Modo sin anuncios',
    'Colaboracion en viajes',
    'IA Autopilot',
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        closing ? 'opacity-0' : 'opacity-100'
      } transition-opacity duration-150`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          aria-label="Cerrar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
          <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        <h2 className="text-lg font-bold text-slate-900">
          {message.title}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {message.description}
        </p>

        <div className="mt-4 rounded-lg bg-slate-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Beneficios al subir de plan
          </p>
          <ul className="space-y-1.5">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-sm text-slate-700">
                <svg className="h-4 w-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Ahora no
          </button>
          <Link
            href="/precios"
            className="flex-1 rounded-lg bg-orange-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
          >
            Ver planes
          </Link>
        </div>
      </div>
    </div>
  );
}
