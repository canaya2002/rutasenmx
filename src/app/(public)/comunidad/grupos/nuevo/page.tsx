import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { buildPageMetadata } from '@/lib/seo/metadata';
import { optionalAuth } from '@/lib/auth/middleware';
import { canAccess } from '@/lib/subscription/plans';
import { CreateGroupForm } from '@/components/social/CreateGroupForm';

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'Nuevo grupo · Comunidad',
    description: 'Crea tu propio grupo de viajeros.',
    path: '/comunidad/grupos/nuevo',
  }),
  robots: { index: false, follow: false },
};

export default async function NewGroupPage() {
  const session = await optionalAuth();
  if (!session) redirect('/iniciar-sesion?next=/comunidad/grupos/nuevo');
  if (!canAccess(session.plan, 'social_connect')) redirect('/conectar');

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-xs text-slate-500">
        <Link href="/comunidad" className="hover:text-emerald-600">
          Comunidad
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">Nuevo grupo</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Crear un grupo</h1>
        <p className="mt-2 text-sm text-slate-600">
          Un grupo es un espacio privado o abierto donde viajeros con intereses
          comunes comparten publicaciones y fotos. Como dueño, moderas el
          contenido.
        </p>
      </header>

      <CreateGroupForm />
    </main>
  );
}
