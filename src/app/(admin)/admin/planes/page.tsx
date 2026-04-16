import type { Metadata } from 'next';
import { db, subscriptionPlans, entitlements } from '@/db';
import { asc, eq } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Planes | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminPlanesPage() {
  const plans = await db
    .select()
    .from(subscriptionPlans)
    .orderBy(asc(subscriptionPlans.sortOrder));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Planes y precios
        </h1>
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Nuevo plan
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                plan.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {plan.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{plan.slug}</p>
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <p>Mensual: ${((plan.priceMonthlyCents ?? 0) / 100).toFixed(0)} {plan.currency}</p>
              <p>Anual: ${((plan.priceAnnualCents ?? 0) / 100).toFixed(0)} {plan.currency}</p>
              <p>Max viajes: {plan.maxSavedTrips ?? 'Ilimitados'}</p>
              <p>Max paradas: {plan.maxStopsPerTrip ?? 'Ilimitadas'}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Editar
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Entitlements
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
