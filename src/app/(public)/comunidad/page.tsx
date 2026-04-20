import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { MessageSquare, Users, Radio, Plus } from 'lucide-react';

import { buildPageMetadata } from '@/lib/seo/metadata';
import { optionalAuth } from '@/lib/auth/middleware';
import { canAccess } from '@/lib/subscription/plans';
import { listCommunities } from '@/lib/social/communities';

export const metadata: Metadata = buildPageMetadata({
  title: 'Comunidad · Foros, grupos y canales',
  description:
    'Comparte experiencias de viaje por México en foros temáticos, grupos de viajeros y canales editoriales.',
  path: '/comunidad',
});

const TYPE_META = {
  forum: {
    label: 'Foro',
    icon: MessageSquare,
    color: 'emerald',
  },
  group: {
    label: 'Grupo',
    icon: Users,
    color: 'blue',
  },
  channel: {
    label: 'Canal',
    icon: Radio,
    color: 'purple',
  },
} as const;

export default async function ComunidadPage() {
  const session = await optionalAuth();
  if (!session) redirect('/iniciar-sesion?next=/comunidad');
  if (!canAccess(session.plan, 'social_connect')) redirect('/conectar');

  const all = await listCommunities(session.userId);
  const forums = all.filter((c) => c.type === 'forum');
  const groups = all.filter((c) => c.type === 'group');
  const channels = all.filter((c) => c.type === 'channel');

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Comunidad</h1>
        <p className="mt-2 text-sm text-slate-600">
          Comparte experiencias de comida, rutas y lugares en México.
          Exclusivo para miembros Premium.
        </p>
      </header>

      {channels.length > 0 && (
        <Section title="Canales editoriales" icon={Radio}>
          <List communities={channels} />
        </Section>
      )}

      <Section title="Foros temáticos" icon={MessageSquare}>
        <List communities={forums} />
      </Section>

      <Section
        title="Grupos de viajeros"
        icon={Users}
        action={
          <Link
            href="/comunidad/grupos/nuevo"
            className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Crear grupo
          </Link>
        }
      >
        {groups.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Aún no hay grupos. Sé el primero en crear uno.
          </p>
        ) : (
          <List communities={groups} />
        )}
      </Section>
    </main>
  );
}

function Section({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: typeof MessageSquare;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Icon className="h-5 w-5 text-emerald-600" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function List({
  communities,
}: {
  communities: Awaited<ReturnType<typeof listCommunities>>;
}) {
  if (communities.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {communities.map((c) => {
        const meta = TYPE_META[c.type];
        const Icon = meta.icon;
        return (
          <Link
            key={c.id}
            href={`/comunidad/${c.slug}`}
            className="group flex gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-emerald-100">
              {c.coverPhotoUrl ? (
                <Image
                  src={c.coverPhotoUrl}
                  alt={c.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Icon className="h-6 w-6 text-emerald-600" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  {meta.label}
                </span>
                {c.isMember && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Unido
                  </span>
                )}
              </div>
              <h3 className="mt-1 truncate text-base font-bold text-slate-900 group-hover:text-emerald-600">
                {c.name}
              </h3>
              {c.description && (
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {c.description}
                </p>
              )}
              <p className="mt-2 text-[11px] text-slate-400">
                {c.memberCount} {c.memberCount === 1 ? 'miembro' : 'miembros'} · {c.postCount}{' '}
                {c.postCount === 1 ? 'publicación' : 'publicaciones'}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
