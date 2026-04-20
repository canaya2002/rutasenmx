import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { buildPageMetadata } from '@/lib/seo/metadata';
import { optionalAuth } from '@/lib/auth/middleware';
import { canAccess } from '@/lib/subscription/plans';
import { DiscoveryClient } from '@/components/social/DiscoveryClient';

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'Descubrir viajeros · Conectar',
    description: 'Explora perfiles de viajeros que van a tu destino.',
    path: '/conectar/descubrir',
  }),
  robots: { index: false, follow: false },
};

export default async function DescubrirPage() {
  const session = await optionalAuth();
  if (!session) redirect('/iniciar-sesion?next=/conectar/descubrir');
  if (!canAccess(session.plan, 'social_connect')) redirect('/conectar');

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Descubrir</h1>
          <p className="text-sm text-slate-500">
            Desliza, conecta, arma tu próximo viaje acompañado.
          </p>
        </div>
        <Link
          href="/conectar/matches"
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Mis matches →
        </Link>
      </header>

      <DiscoveryClient />
    </main>
  );
}
