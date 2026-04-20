import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { buildPageMetadata } from '@/lib/seo/metadata';
import { optionalAuth } from '@/lib/auth/middleware';
import { canAccess } from '@/lib/subscription/plans';
import { getSocialProfile } from '@/lib/social/profile';
import { db } from '@/db';
import { users } from '@/db/schema';
import { SocialProfileForm } from '@/components/social/SocialProfileForm';

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'Mi perfil social · Conectar',
    description: 'Edita tu perfil social para descubrir viajeros compatibles.',
    path: '/conectar/perfil',
  }),
  robots: { index: false, follow: false },
};

export default async function ConectarPerfilPage() {
  const session = await optionalAuth();
  if (!session) {
    redirect('/iniciar-sesion?next=/conectar/perfil');
  }
  if (!canAccess(session.plan, 'social_connect')) {
    redirect('/conectar');
  }

  const profile = await getSocialProfile(session.userId);
  const [user] = await db
    .select({ name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-xs text-slate-500">
        <Link href="/conectar" className="hover:text-emerald-600">
          Conectar
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">Mi perfil</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">
          {profile ? 'Edita tu perfil social' : 'Crea tu perfil social'}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {profile
            ? 'Estos datos son los que ven otros viajeros cuando apareces en descubrir.'
            : 'Llena estos datos en menos de un minuto para empezar a conectar.'}
        </p>
      </header>

      <SocialProfileForm
        initial={profile}
        userAvatar={user?.avatarUrl ?? null}
        userName={user?.name ?? null}
      />
    </main>
  );
}
