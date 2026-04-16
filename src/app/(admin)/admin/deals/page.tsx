import type { Metadata } from 'next';
import { db } from '@/db';

export const metadata: Metadata = {
  title: 'Deals | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminDealsPage() {
  // Deals table may be created in a future schema migration
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Deals
        </h1>
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Nuevo deal
        </button>
      </div>

      <div className="rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
        <svg className="mx-auto mb-4 h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">
          Sin deals configurados
        </h2>
        <p className="text-sm text-slate-500">
          Los deals permiten ofrecer descuentos y promociones a los usuarios de planes de pago.
        </p>
      </div>
    </div>
  );
}
