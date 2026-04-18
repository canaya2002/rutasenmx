'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, Sparkles, Zap } from 'lucide-react';
import { getLocalizedPlans, formatPlanPrice, type BillingInterval, type Plan } from '@/lib/subscription/plans';
import { useLocale } from '@/components/providers/LocaleProvider';

interface Props {
  currentPlan?: string;
}

function computeAnnualSavings(plan: Plan): number {
  if (plan.priceMonthly <= 0) return 0;
  const yearly = plan.priceMonthly * 12;
  if (yearly <= 0) return 0;
  return Math.round(((yearly - plan.priceAnnual) / yearly) * 100);
}

export function PricingTableV2({ currentPlan }: Props) {
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const PLANS = getLocalizedPlans(locale);
  const [interval, setInterval] = useState<BillingInterval>('annual');

  const labels = {
    monthly: isEn ? 'Monthly' : 'Mensual',
    annual: isEn ? 'Annual' : 'Anual',
    save: isEn ? 'Save up to' : 'Ahorra hasta',
    perMonth: isEn ? '/ month' : '/ mes',
    perYear: isEn ? '/ year' : '/ año',
    billedAs: isEn ? 'Billed annually' : 'Facturación anual',
    mostPopular: isEn ? 'Most popular' : 'Más popular',
    startFree: isEn ? 'Start free' : 'Empezar gratis',
    subscribe: isEn ? 'Subscribe' : 'Suscribirme',
    currentPlan: isEn ? 'Current plan' : 'Plan actual',
    included: isEn ? 'Everything in' : 'Todo lo de',
    plus: isEn ? 'plus' : 'más',
  };

  const maxSavings = Math.max(...PLANS.map(computeAnnualSavings));

  return (
    <div>
      {/* Billing toggle */}
      <div className="mb-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setInterval('monthly')}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              interval === 'monthly' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {labels.monthly}
          </button>
          <button
            type="button"
            onClick={() => setInterval('annual')}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              interval === 'annual' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {labels.annual}
          </button>
        </div>
        {maxSavings > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Sparkles className="h-3 w-3" />
            {labels.save} {maxSavings}%
          </span>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan) => {
          const active = currentPlan === plan.slug;
          const price = interval === 'monthly' ? plan.priceMonthly : plan.priceAnnual;
          const savings = computeAnnualSavings(plan);
          const priceLabel = formatPlanPrice(
            interval === 'monthly' ? price : Math.round(plan.priceAnnual / 12),
            isEn ? 'en' : 'es',
          );
          const isFree = plan.priceMonthly === 0;
          const href = isFree ? '/registrarse' : `/suscripcion?plan=${plan.slug}&interval=${interval}`;
          const ctaLabel = active ? labels.currentPlan : isFree ? labels.startFree : labels.subscribe;

          return (
            <article
              key={plan.slug}
              className={`relative flex flex-col overflow-hidden rounded-3xl border p-6 sm:p-7 ${
                plan.isRecommended
                  ? 'border-transparent bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white shadow-2xl ring-1 ring-emerald-400/30 lg:-translate-y-4 lg:scale-[1.02]'
                  : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              {plan.isRecommended && (
                <>
                  <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-emerald-400 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-900 shadow-md">
                    <Zap className="h-3 w-3" />
                    {labels.mostPopular}
                  </span>
                </>
              )}

              <h3 className={`text-lg font-bold tracking-tight ${plan.isRecommended ? 'text-white' : 'text-slate-900'}`}>
                {plan.name}
              </h3>
              <p className={`mt-1 text-sm ${plan.isRecommended ? 'text-slate-300' : 'text-slate-500'}`}>
                {plan.description}
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className={`text-4xl font-extrabold tracking-tight ${plan.isRecommended ? 'text-white' : 'text-slate-900'}`}>
                  {priceLabel}
                </span>
                {!isFree && (
                  <span className={`text-sm ${plan.isRecommended ? 'text-slate-300' : 'text-slate-500'}`}>
                    {labels.perMonth}
                  </span>
                )}
              </div>
              {!isFree && interval === 'annual' && (
                <p className={`mt-1 text-xs ${plan.isRecommended ? 'text-emerald-200' : 'text-emerald-700'}`}>
                  {labels.billedAs} · {formatPlanPrice(plan.priceAnnual, isEn ? 'en' : 'es')}
                  {savings > 0 && <span className="ml-1 font-semibold">· -{savings}%</span>}
                </p>
              )}
              {isFree && (
                <p className={`mt-1 text-xs ${plan.isRecommended ? 'text-slate-300' : 'text-slate-500'}`}>
                  {isEn ? 'Forever free' : 'Para siempre'}
                </p>
              )}

              <Link
                href={href}
                aria-disabled={active}
                className={`mt-6 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold shadow-sm transition ${
                  plan.isRecommended
                    ? 'bg-emerald-400 text-slate-900 hover:bg-emerald-300'
                    : active
                      ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500'
                      : 'bg-slate-900 text-white hover:bg-slate-700'
                }`}
              >
                {ctaLabel}
              </Link>

              <ul className={`mt-6 space-y-2.5 text-sm ${plan.isRecommended ? 'text-slate-200' : 'text-slate-700'}`}>
                {plan.features.map((f) => (
                  <li key={f.key} className="flex items-start gap-2">
                    {f.included ? (
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.isRecommended ? 'text-emerald-300' : 'text-emerald-600'}`} />
                    ) : (
                      <X className={`mt-0.5 h-4 w-4 shrink-0 ${plan.isRecommended ? 'text-slate-500' : 'text-slate-300'}`} />
                    )}
                    <span className={f.included ? '' : plan.isRecommended ? 'text-slate-400 line-through' : 'text-slate-400 line-through'}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
