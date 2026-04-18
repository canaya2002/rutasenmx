'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getLocalizedPlans, formatPlanPrice, type PlanSlug } from '@/lib/subscription/plans';
import { PLAN_LIMITS } from '@/lib/constants';
import { useLocale } from '@/components/providers/LocaleProvider';

interface UserData {
  plan: PlanSlug;
}

export default function SuscripcionPage() {
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const T = (es: string, en: string) => (isEn ? en : es);

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser({ plan: data.user.plan || 'free' });
        }
      } catch {
        // handled
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handlePortalClick() {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      }
    } catch {
      // handled
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-black" />
      </div>
    );
  }

  const currentPlan = user?.plan || 'free';
  const PLANS = getLocalizedPlans(locale);
  const planData = PLANS.find((p) => p.slug === currentPlan);
  const limits = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS];

  return (
    <div className="max-w-2xl">
      <h1 className="mb-8 text-2xl font-bold text-slate-900">{T('Suscripción', 'Subscription')}</h1>

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{T('Plan actual', 'Current plan')}</p>
            <h2 className="text-2xl font-bold text-slate-900">
              {planData?.name || T('Gratis', 'Free')}
            </h2>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        </div>

        {planData && planData.priceMonthly > 0 && (
          <p className="mt-2 text-sm text-slate-600">
            {formatPlanPrice(planData.priceMonthly, locale)}/{T('mes', 'mo')}
          </p>
        )}
      </div>

      <div className="mb-8">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">{T('Uso actual', 'Current usage')}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-500">{T('Viajes guardados', 'Saved trips')}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              - / {limits.maxSavedTrips === Infinity ? T('Ilimitados', 'Unlimited') : limits.maxSavedTrips}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-500">{T('Paradas por viaje', 'Stops per trip')}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {T('Hasta', 'Up to')} {limits.maxStopsPerTrip}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {currentPlan !== 'premium' && (
          <Link
            href="/precios"
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {T('Subir de plan', 'Upgrade plan')}
          </Link>
        )}

        {currentPlan !== 'free' && (
          <button
            type="button"
            onClick={handlePortalClick}
            disabled={portalLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            {portalLoading ? T('Abriendo...', 'Opening…') : T('Gestionar facturación', 'Manage billing')}
          </button>
        )}
      </div>

      {planData && (
        <div className="mt-10">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            {T('Incluido en tu plan', 'Included in your plan')}
          </h3>
          <ul className="space-y-2">
            {planData.features
              .filter((f) => f.included)
              .map((feature) => (
                <li key={feature.key} className="flex items-center gap-2 text-sm text-slate-700">
                  <svg className="h-4 w-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature.label}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
