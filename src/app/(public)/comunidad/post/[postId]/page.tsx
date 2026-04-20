import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { buildPageMetadata } from '@/lib/seo/metadata';
import { optionalAuth } from '@/lib/auth/middleware';
import { canAccess } from '@/lib/subscription/plans';
import { getPost } from '@/lib/social/communities';
import { PostClient } from '@/components/social/PostClient';

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'Publicación · Comunidad',
    description: 'Publicación de la comunidad de viajeros de México.',
    path: '/comunidad/post',
  }),
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ postId: string }>;
}

export default async function PostPage({ params }: Props) {
  const { postId } = await params;
  const session = await optionalAuth();
  if (!session) redirect(`/iniciar-sesion?next=/comunidad/post/${postId}`);
  if (!canAccess(session.plan, 'social_connect')) redirect('/conectar');

  const post = await getPost(postId, session.userId);
  if (!post || post.status !== 'published') notFound();

  return (
    <main>
      <nav className="mx-auto max-w-3xl px-4 pt-6 text-xs text-slate-500 sm:px-6 lg:px-8">
        <Link href="/comunidad" className="hover:text-emerald-600">
          Comunidad
        </Link>{' '}
        <span className="mx-1">/</span>
        <Link
          href={`/comunidad/${post.communitySlug}`}
          className="hover:text-emerald-600"
        >
          {post.communityName}
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">Publicación</span>
      </nav>
      <PostClient post={post} />
    </main>
  );
}
