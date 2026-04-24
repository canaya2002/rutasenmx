import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { apiFetch, ApiError } from '@/lib/api';
import { emit, EVENTS } from '@/lib/analytics';
import { API } from '@shared/index';

// ─────────────────────────────────────────────────────────────────────────────
// Types (server-side CommunityView / PostView / CommentView shapes, mirrored)
// ─────────────────────────────────────────────────────────────────────────────
export interface CommunityView {
  id: string;
  type: 'forum' | 'group' | 'channel';
  slug: string;
  name: string;
  description: string | null;
  coverPhotoUrl: string | null;
  memberCount: number;
  postCount: number;
  createdAt: string;
  isMember: boolean;
  role: 'member' | 'moderator' | 'owner' | null;
}

export interface PostView {
  id: string;
  communityId: string;
  communitySlug: string;
  communityName: string;
  authorId: string;
  authorName: string;
  authorPhoto: string | null;
  title: string;
  body: string;
  photoUrls: string[];
  upvoteCount: number;
  commentCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  status: 'published' | 'hidden' | 'removed';
  didUpvote: boolean;
}

export interface CommentView {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto: string | null;
  parentCommentId: string | null;
  body: string;
  upvoteCount: number;
  createdAt: string;
  didUpvote: boolean;
  status: 'published' | 'hidden' | 'removed';
}

// ─────────────────────────────────────────────────────────────────────────────
// Communities
// ─────────────────────────────────────────────────────────────────────────────
export function useCommunities(opts: {
  type?: 'forum' | 'group' | 'channel';
  q?: string;
} = {}) {
  return useQuery<CommunityView[]>({
    queryKey: ['community', 'list', opts],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (opts.type) p.set('type', opts.type);
      if (opts.q) p.set('q', opts.q);
      const url = p.toString()
        ? `${API.communities}?${p.toString()}`
        : API.communities;
      const data = await apiFetch<{ communities: CommunityView[] }>(url);
      return data.communities;
    },
    staleTime: 60_000,
  });
}

export function useCommunity(slug: string | undefined) {
  return useQuery<CommunityView>({
    queryKey: ['community', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      if (!slug) throw new Error('slug required');
      const data = await apiFetch<{ community: CommunityView }>(
        API.community(slug),
      );
      return data.community;
    },
  });
}

export function useJoinCommunity() {
  const qc = useQueryClient();
  return useMutation<{ joined: boolean; pending: boolean }, ApiError, string>({
    mutationFn: (slug) =>
      apiFetch(API.community(slug), { method: 'POST' }),
    onSuccess: (res, slug) => {
      qc.invalidateQueries({ queryKey: ['community'] });
      if (res.joined || res.pending) {
        emit(EVENTS.community_joined, {
          properties: { slug, pending: res.pending },
        });
      }
    },
  });
}

export function useLeaveCommunity() {
  const qc = useQueryClient();
  return useMutation<{ ok: true }, ApiError, string>({
    mutationFn: (slug) =>
      apiFetch(API.community(slug), { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community'] });
    },
  });
}

export function useCreateCommunity() {
  const qc = useQueryClient();
  return useMutation<
    { community: CommunityView },
    ApiError,
    { name: string; description?: string; requiresApproval?: boolean }
  >({
    mutationFn: (input) =>
      apiFetch(API.communities, { method: 'POST', body: input }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['community', 'list'] });
      emit(EVENTS.community_created, {
        properties: {
          communityId: res.community.id,
          slug: res.community.slug,
        },
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Posts (infinite scroll)
// ─────────────────────────────────────────────────────────────────────────────
interface PostsPage {
  posts: PostView[];
}

export function useCommunityPosts(slug: string | undefined) {
  return useInfiniteQuery<PostsPage>({
    queryKey: ['community', 'posts', slug],
    enabled: Boolean(slug),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!slug) return { posts: [] };
      const url = `${API.communityPosts(slug)}?offset=${pageParam}&limit=20`;
      return apiFetch<PostsPage>(url);
    },
    getNextPageParam: (last, pages) =>
      last.posts.length < 20 ? undefined : pages.length * 20,
  });
}

export function usePost(postId: string | undefined) {
  return useQuery<PostView>({
    queryKey: ['post', postId],
    enabled: Boolean(postId),
    queryFn: async () => {
      if (!postId) throw new Error('postId required');
      const data = await apiFetch<{ post: PostView }>(API.post(postId));
      return data.post;
    },
  });
}

export function useCreatePost(slug: string) {
  const qc = useQueryClient();
  return useMutation<
    { id: string },
    ApiError,
    { title: string; body: string; photoUrls?: string[]; photoHashes?: string[] }
  >({
    mutationFn: (input) =>
      apiFetch<{ id: string }>(API.communityPosts(slug), {
        method: 'POST',
        body: input,
      }),
    onSuccess: (_r, input) => {
      qc.invalidateQueries({ queryKey: ['community', 'posts', slug] });
      emit(EVENTS.post_created, {
        properties: {
          communitySlug: slug,
          hasPhotos: (input.photoUrls?.length ?? 0) > 0,
        },
      });
    },
  });
}

export function useVotePost(postId: string) {
  const qc = useQueryClient();
  return useMutation<{ upvoted: boolean }, ApiError, void>({
    mutationFn: () =>
      apiFetch<{ upvoted: boolean }>(API.postVote(postId), {
        method: 'POST',
      }),
    onSuccess: (res) => {
      qc.setQueryData<PostView | undefined>(['post', postId], (p) =>
        p
          ? {
              ...p,
              didUpvote: res.upvoted,
              upvoteCount: p.upvoteCount + (res.upvoted ? 1 : -1),
            }
          : p,
      );
    },
  });
}

export function useFlagPost() {
  return useMutation<
    { ok: true },
    ApiError,
    { postId: string; reason: string; note?: string }
  >({
    mutationFn: ({ postId, reason, note }) =>
      apiFetch(API.postFlag(postId), {
        method: 'POST',
        body: { reason, note },
      }),
    onSuccess: (_r, { postId, reason }) => {
      emit(EVENTS.post_flagged, { properties: { postId, reason } });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Comments
// ─────────────────────────────────────────────────────────────────────────────
export function usePostComments(postId: string | undefined) {
  return useQuery<CommentView[]>({
    queryKey: ['comments', postId],
    enabled: Boolean(postId),
    queryFn: async () => {
      if (!postId) return [];
      const data = await apiFetch<{ comments: CommentView[] }>(
        API.postComments(postId),
      );
      return data.comments;
    },
  });
}

export function useCreateComment(postId: string) {
  const qc = useQueryClient();
  return useMutation<
    { id: string },
    ApiError,
    { body: string; parentCommentId?: string | null }
  >({
    mutationFn: (input) =>
      apiFetch<{ id: string }>(API.postComments(postId), {
        method: 'POST',
        body: input,
      }),
    onSuccess: (_r, input) => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      qc.setQueryData<PostView | undefined>(['post', postId], (p) =>
        p ? { ...p, commentCount: p.commentCount + 1 } : p,
      );
      emit(EVENTS.comment_created, {
        properties: { postId, isReply: !!input.parentCommentId },
      });
    },
  });
}

export function useVoteComment(commentId: string) {
  return useMutation<{ upvoted: boolean }, ApiError, void>({
    mutationFn: () =>
      apiFetch<{ upvoted: boolean }>(API.commentVote(commentId), {
        method: 'POST',
      }),
  });
}
