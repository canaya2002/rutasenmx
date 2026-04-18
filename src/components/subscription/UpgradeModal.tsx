'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/providers/LocaleProvider';

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
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const [closing, setClosing] = useState(false);

  if (!isOpen) return null;

  function handleClose() {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 150);
  }

  const tripsLimit = limitValue ?? 1;
  const stopsLimit = limitValue ?? 7;

  const messages: Record<string, { title: string; description: string }> = isEn
    ? {
        trips: {
          title: 'Trip limit reached',
          description: `You've reached the limit of ${tripsLimit} trip${tripsLimit > 1 ? 's' : ''} on your current plan. Upgrade to save more trips.`,
        },
        stops: {
          title: 'Stops limit reached',
          description: `You've reached the limit of ${stopsLimit} stops per trip on your current plan. Upgrade to add more stops.`,
        },
        feature: {
          title: 'Feature not available',
          description: `${featureName || 'This feature'} is not included in your current plan. Upgrade to unlock it.`,
        },
      }
    : {
        trips: {
          title: 'Límite de viajes alcanzado',
          description: `Has alcanzado el límite de ${tripsLimit} viaje${tripsLimit > 1 ? 's' : ''} de tu plan actual. Sube de plan para guardar más viajes.`,
        },
        stops: {
          title: 'Límite de paradas alcanzado',
          description: `Has alcanzado el límite de ${stopsLimit} paradas por viaje de tu plan actual. Sube de plan para agregar más paradas.`,
        },
        feature: {
          title: 'Funcionalidad no disponible',
          description: `${featureName || 'Esta funcionalidad'} no está incluida en tu plan actual. Sube de plan para desbloquearla.`,
        },
      };

  const message = messages[limitType];

  const L = {
    benefitsTitle: isEn ? 'Benefits when you upgrade' : 'Beneficios al subir de plan',
    notNow: isEn ? 'Not now' : 'Ahora no',
    viewPlans: isEn ? 'View plans' : 'Ver planes',
    close: isEn ? 'Close' : 'Cerrar',
    benefits: isEn
      ? [
          'More saved trips',
          'More stops per trip',
          'PDF and GPX export',
          'Ad-free mode',
          'Trip collaboration',
          'AI Autopilot',
        ]
      : [
          'Más viajes guardados',
          'Más paradas por viaje',
          'Exportación PDF y GPX',
          'Modo sin anuncios',
          'Colaboración en viajes',
          'IA Autopilot',
        ],
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        closing ? 'opacity-0' : 'opacity-100'
      } transition-opacity duration-150`}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          aria-label={L.close}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
          <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        <h2 className="text-lg font-bold text-slate-900">{message.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{message.description}</p>

        <div className="mt-4 rounded-lg bg-slate-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {L.benefitsTitle}
          </p>
          <ul className="space-y-1.5">
            {L.benefits.map((benefit) => (
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
            {L.notNow}
          </button>
          <Link
            href="/precios"
            className="flex-1 rounded-lg bg-black px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            {L.viewPlans}
          </Link>
        </div>
      </div>
    </div>
  );
}
