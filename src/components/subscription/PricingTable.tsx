'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getLocalizedPlans, formatPlanPrice, type BillingInterval, type PlanSlug } from '@/lib/subscription/plans';
import { useLocale, useTranslation } from '@/components/providers/LocaleProvider';

interface PricingTableProps {
  currentPlan?: string;
}

export function PricingTable({ currentPlan }: PricingTableProps) {
  const t = useTranslation();
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const shortMonth = isEn ? 'mo' : 'mes';
  const shortYear = isEn ? 'yr' : 'año';
  const currentPlanLabel = t.subscription.currentPlan;
  const startFreeLabel = t.subscription.startFree;
  const changePlanLabel = t.subscription.changePlan;
  const subscribeLabel = t.subscription.subscribe;
  const PLANS = getLocalizedPlans(locale);
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<PlanSlug | null>(null);

  async function handleSubscribe(plan: PlanSlug) {
    setLoadingPlan(plan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval }),
      });
      if (res.status === 401) {
        window.location.href = `/iniciar-sesion?next=/precios`;
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Error ${res.status}`);
      }
      const data = (await res.json()) as { url: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setLoadingPlan(null);
    }
  }

  return (
    <div>
      {/* Toggle monthly/annual */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <span
          className={`text-sm font-medium ${
            interval === 'monthly' ? 'text-slate-900' : 'text-slate-500'
          }`}
        >
          {t.subscription.monthly}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={interval === 'annual'}
          onClick={() => setInterval(interval === 'monthly' ? 'annual' : 'monthly')}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            interval === 'annual' ? 'bg-black' : 'bg-slate-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${
              interval === 'annual' ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium ${
            interval === 'annual' ? 'text-slate-900' : 'text-slate-500'
          }`}
        >
          {t.subscription.annual}
          <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
            {t.subscription.saveUp}
          </span>
        </span>
      </div>

      {/* Plan cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const price = interval === 'monthly' ? plan.priceMonthly : plan.priceAnnual;
          const isCurrent = currentPlan === plan.slug;
          const isRecommended = plan.isRecommended;

          return (
            <div
              key={plan.slug}
              className={`relative flex flex-col rounded-xl border p-6 ${
                isRecommended
                  ? 'border-black shadow-lg shadow-emerald-100'
                  : 'border-slate-200'
              }`}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                  {t.subscription.recommended}
                </div>
              )}

              <h3 className="text-lg font-bold text-slate-900">
                {plan.name}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {plan.description}
              </p>

              <div className="mt-4">
                <span className="text-3xl font-bold text-slate-900">
                  {formatPlanPrice(price, locale)}
                </span>
                {price > 0 && (
                  <span className="text-sm text-slate-500">
                    /{interval === 'monthly' ? shortMonth : shortYear}
                  </span>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature.key} className="flex items-start gap-2 text-sm">
                    {feature.included ? (
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span
                      className={
                        feature.included
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }
                    >
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <div className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-center text-sm font-medium text-slate-600">
                    {currentPlanLabel}
                  </div>
                ) : plan.slug === 'free' ? (
                  <Link
                    href="/registrarse"
                    className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    {startFreeLabel}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubscribe(plan.slug)}
                    disabled={loadingPlan !== null}
                    className={`block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold shadow-sm transition disabled:opacity-50 ${
                      isRecommended
                        ? 'bg-black text-white hover:bg-gray-800'
                        : 'border border-black text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {loadingPlan === plan.slug
                      ? '…'
                      : currentPlan
                      ? changePlanLabel
                      : subscribeLabel}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
