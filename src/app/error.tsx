'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      {/* Decorative badge */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <span className="text-4xl" role="img" aria-label="Advertencia">
          ⚠️
        </span>
      </div>

      {/* Heading */}
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Algo salio mal
      </h1>

      {/* Description */}
      <p className="mb-8 max-w-md text-lg text-slate-600">
        Ocurrio un error inesperado. Puedes intentar de nuevo o volver al inicio.
      </p>

      {/* CTAs */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="inline-flex items-center justify-center rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
