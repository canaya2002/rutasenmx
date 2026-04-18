'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/providers/LocaleProvider';

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const L = {
    title: isEn ? 'Something went wrong' : 'Algo salió mal',
    desc: isEn
      ? 'An unexpected error occurred. You can try again or go back home.'
      : 'Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.',
    retry: isEn ? 'Try again' : 'Intentar de nuevo',
    backHome: isEn ? 'Back to home' : 'Volver al inicio',
    warning: isEn ? 'Warning' : 'Advertencia',
  };

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <span className="text-4xl" role="img" aria-label={L.warning}>
          ⚠️
        </span>
      </div>

      <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        {L.title}
      </h1>

      <p className="mb-8 max-w-md text-lg text-slate-600">{L.desc}</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          {L.retry}
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          {L.backHome}
        </Link>
      </div>
    </main>
  );
}
