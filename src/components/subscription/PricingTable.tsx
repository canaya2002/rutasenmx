'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PLANS, formatPlanPrice, type BillingInterval } from '@/lib/subscription/plans';

interface PricingTableProps {
  currentPlan?: string;
}

export function PricingTable({ currentPlan }: PricingTableProps) {
  const [interval, setInterval] = useState<BillingInterval>('monthly');

  return (
    <div>
      {/* Toggle monthly/annual */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <span
          className={`text-sm font-medium ${
            interval === 'monthly' ? 'text-slate-900' : 'text-slate-500'
          }`}
        >
          Mensual
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={interval === 'annual'}
          onClick={() => setInterval(interval === 'monthly' ? 'annual' : 'monthly')}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            interval === 'annual' ? 'bg-orange-600' : 'bg-slate-200'
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
          Anual
          <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
            Ahorra hasta 33%
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
                  ? 'border-orange-600 shadow-lg shadow-orange-100'
                  : 'border-slate-200'
              }`}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold text-white">
                  Recomendado
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
                  {formatPlanPrice(price)}
                </span>
                {price > 0 && (
                  <span className="text-sm text-slate-500">
                    /{interval === 'monthly' ? 'mes' : 'año'}
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
                    Plan actual
                  </div>
                ) : plan.slug === 'free' ? (
                  <Link
                    href="/registrarse"
                    className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Empezar gratis
                  </Link>
                ) : (
                  <Link
                    href={`/api/stripe/checkout?plan=${plan.slug}&interval=${interval}`}
                    className={`block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold shadow-sm transition ${
                      isRecommended
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'border border-orange-600 text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    {currentPlan ? 'Cambiar plan' : 'Suscribirse'}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
