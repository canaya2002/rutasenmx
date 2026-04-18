import Link from 'next/link';
import type { Metadata } from 'next';
import { getLocale } from '@/lib/i18n/server';

export const metadata: Metadata = {
  title: 'Página no encontrada / Page not found',
  description:
    'La página que buscas no existe o fue movida. / The page you are looking for does not exist or was moved.',
};

export default async function NotFound() {
  const locale = await getLocale();
  const isEn = locale === 'en';

  const L = {
    error: isEn ? 'Error 404' : 'Error 404',
    title: isEn ? 'Page not found' : 'Página no encontrada',
    desc: isEn
      ? "The page you're looking for doesn't exist or was moved. But there's plenty to discover in Mexico."
      : 'La página que buscas no existe o fue movida. Pero hay mucho por descubrir en México.',
    backHome: isEn ? 'Back to home' : 'Volver al inicio',
    exploreMap: isEn ? 'Explore the map' : 'Explorar el mapa',
    mapAlt: isEn ? 'Map' : 'Mapa',
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
        <span className="text-4xl" role="img" aria-label={L.mapAlt}>
          🗺️
        </span>
      </div>

      <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-emerald-600">
        {L.error}
      </p>

      <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        {L.title}
      </h1>

      <p className="mb-8 max-w-md text-lg text-slate-600">{L.desc}</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          {L.backHome}
        </Link>
        <Link
          href="/explorar"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          {L.exploreMap}
        </Link>
      </div>
    </main>
  );
}
