'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowUp, Flag, MessageSquare, Send } from 'lucide-react';

import type { CommentView, PostView } from '@/lib/social/communities';
import { FlagPostDialog } from './FlagPostDialog';

interface Props {
  post: PostView;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });
}

export function PostClient({ post: initialPost }: Props) {
  const [post, setPost] = useState<PostView>(initialPost);
  const [comments, setComments] = useState<CommentView[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flagging, setFlagging] = useState(false);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/social/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
    } finally {
      setLoadingComments(false);
    }
  }, [post.id]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const toggleUpvote = async () => {
    try {
      const res = await fetch(`/api/social/posts/${post.id}/vote`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setPost((p) => ({
          ...p,
          didUpvote: data.upvoted,
          upvoteCount: p.upvoteCount + (data.upvoted ? 1 : -1),
        }));
      }
    } catch {
      // ignore
    }
  };

  const upvoteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/social/comments/${commentId}/vote`, {
        method: 'POST',
      });
      if (!res.ok) return;
      const data = await res.json();
      setComments((cs) =>
        cs.map((c) =>
          c.id === commentId
            ? {
                ...c,
                didUpvote: data.upvoted,
                upvoteCount: c.upvoteCount + (data.upvoted ? 1 : -1),
              }
            : c,
        ),
      );
    } catch {
      // ignore
    }
  };

  // Flag is handled by FlagPostDialog — see the `flagging` state and the
  // dialog rendered at the bottom of the JSX.

  const sendComment = async () => {
    const body = newComment.trim();
    if (!body) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/social/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setNewComment('');
      await loadComments();
      setPost((p) => ({ ...p, commentCount: p.commentCount + 1 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-emerald-100">
            {post.authorPhoto ? (
              <Image
                src={post.authorPhoto}
                alt={post.authorName}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-bold text-emerald-700">
                {post.authorName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">{post.authorName}</p>
            <p className="text-xs text-slate-500">
              En <strong>{post.communityName}</strong> · {timeAgo(post.createdAt)}
            </p>
          </div>
          <button
            onClick={() => setFlagging(true)}
            aria-label="Reportar"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600"
          >
            <Flag className="h-4 w-4" />
          </button>
        </div>

        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
          {post.title}
        </h1>
        <div className="mt-3 whitespace-pre-wrap text-base leading-7 text-slate-700">
          {post.body}
        </div>

        {post.photoUrls.length > 0 && (
          <div
            className={`mt-4 grid gap-2 ${
              post.photoUrls.length === 1
                ? 'grid-cols-1'
                : post.photoUrls.length === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-2 md:grid-cols-3'
            }`}
          >
            {post.photoUrls.map((url, i) => (
              <div
                key={i}
                className="relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-slate-200"
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center gap-4 border-t border-slate-100 pt-4">
          <button
            onClick={toggleUpvote}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              post.didUpvote
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ArrowUp className="h-4 w-4" />
            {post.upvoteCount}
          </button>
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
            <MessageSquare className="h-4 w-4" />
            {post.commentCount}{' '}
            {post.commentCount === 1 ? 'comentario' : 'comentarios'}
          </span>
        </div>
      </article>

      {/* New comment */}
      {!post.isLocked ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            maxLength={4000}
            placeholder="Escribe un comentario…"
            className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          <div className="mt-2 flex justify-end">
            <button
              onClick={sendComment}
              disabled={!newComment.trim() || submitting}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Enviando…' : 'Comentar'}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
          Esta publicación está cerrada para nuevos comentarios.
        </p>
      )}

      {/* Comments */}
      <div className="mt-6 space-y-3">
        {loadingComments ? (
          <p className="text-center text-sm text-slate-500">Cargando…</p>
        ) : comments.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            Sé el primero en comentar.
          </p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="relative h-8 w-8 overflow-hidden rounded-full bg-emerald-100">
                  {c.authorPhoto ? (
                    <Image
                      src={c.authorPhoto}
                      alt={c.authorName}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-bold text-emerald-700">
                      {c.authorName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-xs">
                  <span className="font-semibold text-slate-900">
                    {c.authorName}
                  </span>
                  <span className="text-slate-500"> · {timeAgo(c.createdAt)}</span>
                </div>
                <button
                  onClick={() => upvoteComment(c.id)}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    c.didUpvote
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <ArrowUp className="h-3 w-3" />
                  {c.upvoteCount}
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {c.body}
              </p>
            </div>
          ))
        )}
      </div>

      {flagging && (
        <FlagPostDialog postId={post.id} onClose={() => setFlagging(false)} />
      )}
    </div>
  );
}
