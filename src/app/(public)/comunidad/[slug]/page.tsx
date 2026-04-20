import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { MessageSquare, ArrowUp, Users, Pin, Lock } from 'lucide-react';

import { buildPageMetadata } from '@/lib/seo/metadata';
import { optionalAuth } from '@/lib/auth/middleware';
import { canAccess } from '@/lib/subscription/plans';
import {
  getCommunityBySlug,
  listPosts,
} from '@/lib/social/communities';
import { CommunityJoinButton } from '@/components/social/CommunityJoinButton';
import { PostComposer } from '@/components/social/PostComposer';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    ...buildPageMetadata({
      title: `${slug} · Comunidad`,
      description: 'Comparte experiencias de viaje por México.',
      path: `/comunidad/${slug}`,
    }),
    robots: { index: false, follow: false },
  };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `hace ${day} d`;
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default async function CommunityPage({ params }: Props) {
  const { slug } = await params;
  const session = await optionalAuth();
  if (!session) redirect(`/iniciar-sesion?next=/comunidad/${slug}`);
  if (!canAccess(session.plan, 'social_connect')) redirect('/conectar');

  const community = await getCommunityBySlug(slug, session.userId);
  if (!community) notFound();

  const posts = await listPosts(community.id, session.userId);

  const canPost =
    community.type === 'forum' ||
    (community.type === 'group' && community.isMember) ||
    (community.type === 'channel' && (community.role === 'moderator' || community.role === 'owner'));

  return (
    <main>
      {/* Hero */}
      <section className="relative border-b border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <nav className="mb-4 text-xs text-slate-500">
            <Link href="/comunidad" className="hover:text-emerald-600">
              Comunidad
            </Link>{' '}
            <span className="mx-1">/</span>
            <span className="text-slate-700">{community.name}</span>
          </nav>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-emerald-100 ring-1 ring-emerald-200">
                {community.coverPhotoUrl ? (
                  <Image
                    src={community.coverPhotoUrl}
                    alt={community.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl font-bold text-emerald-700">
                    {community.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <span className="inline-block rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  {community.type === 'forum'
                    ? 'Foro'
                    : community.type === 'group'
                      ? 'Grupo'
                      : 'Canal'}
                </span>
                <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
                  {community.name}
                </h1>
                {community.description && (
                  <p className="mt-1 max-w-2xl text-sm text-slate-600">
                    {community.description}
                  </p>
                )}
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
                  <Users className="h-3 w-3" />
                  {community.memberCount}{' '}
                  {community.memberCount === 1 ? 'miembro' : 'miembros'} ·{' '}
                  {community.postCount}{' '}
                  {community.postCount === 1 ? 'publicación' : 'publicaciones'}
                </p>
              </div>
            </div>
            <CommunityJoinButton
              slug={community.slug}
              type={community.type}
              isMember={community.isMember}
              role={community.role}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {canPost ? (
          <div className="mb-8">
            <PostComposer communitySlug={community.slug} />
          </div>
        ) : (
          <div className="mb-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            {community.type === 'channel'
              ? 'Este canal es de broadcast editorial. Solo moderadores publican.'
              : 'Únete al grupo para publicar.'}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 text-base font-medium text-slate-700">
              Aún no hay publicaciones aquí
            </p>
            {canPost && (
              <p className="mt-1 text-sm text-slate-500">
                Sé el primero en compartir.
              </p>
            )}
          </div>
        ) : (
          <ul className="space-y-4">
            {posts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/comunidad/post/${p.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8 overflow-hidden rounded-full bg-emerald-100">
                      {p.authorPhoto ? (
                        <Image
                          src={p.authorPhoto}
                          alt={p.authorName}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-bold text-emerald-700">
                          {p.authorName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {p.authorName}
                      </span>{' '}
                      · {timeAgo(p.createdAt)}
                    </div>
                    {p.isPinned && (
                      <Pin className="h-4 w-4 text-emerald-600" />
                    )}
                    {p.isLocked && (
                      <Lock className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">
                    {p.title}
                  </h3>
                  <p className="mt-1 line-clamp-3 text-sm text-slate-600">
                    {p.body}
                  </p>
                  {p.photoUrls.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {p.photoUrls.slice(0, 3).map((url, i) => (
                        <div
                          key={i}
                          className="relative h-20 w-28 overflow-hidden rounded-lg"
                        >
                          <Image
                            src={url}
                            alt=""
                            fill
                            sizes="112px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                      {p.photoUrls.length > 3 && (
                        <div className="flex h-20 w-12 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                          +{p.photoUrls.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <ArrowUp className="h-3.5 w-3.5" />
                      {p.upvoteCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {p.commentCount}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
