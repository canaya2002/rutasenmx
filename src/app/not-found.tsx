import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pagina no encontrada',
  description: 'La pagina que buscas no existe o fue movida.',
};

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      {/* Decorative badge */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
        <span className="text-4xl" role="img" aria-label="Mapa">
          🗺️
        </span>
      </div>

      {/* Status code */}
      <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-orange-600">
        Error 404
      </p>

      {/* Heading */}
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Pagina no encontrada
      </h1>

      {/* Description */}
      <p className="mb-8 max-w-md text-lg text-slate-600">
        La pagina que buscas no existe o fue movida. Pero hay mucho por
        descubrir en Mexico.
      </p>

      {/* CTAs */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
        >
          Volver al inicio
        </Link>
        <Link
          href="/explorar"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Explorar el mapa
        </Link>
      </div>
    </main>
  );
}
