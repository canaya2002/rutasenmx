/**
 * Single file for every /api/social/* hook. Kept together so the surface
 * area is grep-able: if any server contract changes, this file is the one
 * that either breaks or the one to update.
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';

import { apiFetch, ApiError } from '@/lib/api';
import { emit, EVENTS } from '@/lib/analytics';
import {
  API,
  type SocialProfileView,
  type SocialMatchView,
  type SocialMessageView,
  type SocialSwipeResult,
  type SocialIntent,
  type SocialSwipeAction,
  type ReportReason,
} from '@shared/index';

// ─────────────────────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────────────────────
interface ProfileResponse {
  profile: SocialProfileView | null;
}

export function useSocialProfile() {
  return useQuery<SocialProfileView | null>({
    queryKey: ['social', 'profile'],
    queryFn: async () => {
      const data = await apiFetch<ProfileResponse>(API.socialProfile);
      return data.profile;
    },
    staleTime: 30_000,
  });
}

export interface SocialProfileInput {
  displayName: string;
  bio?: string | null;
  photoUrl?: string | null;
  destinoEstadoSlug?: string | null;
  interests: string[];
  intent?: SocialIntent | null;
  age?: number | null;
  languages: string[];
  travelFrom?: string | null;
  travelTo?: string | null;
  isVisible: boolean;
}

export function useUpsertSocialProfile() {
  const qc = useQueryClient();
  return useMutation<SocialProfileView, ApiError, SocialProfileInput>({
    mutationFn: async (input) => {
      const data = await apiFetch<{ profile: SocialProfileView }>(
        API.socialProfile,
        { method: 'POST', body: input },
      );
      return data.profile;
    },
    onSuccess: (profile) => {
      qc.setQueryData(['social', 'profile'], profile);
      qc.invalidateQueries({ queryKey: ['social', 'queue'] });
      emit(EVENTS.social_profile_saved, {
        properties: {
          hasPhoto: !!profile.photoUrl,
          interestCount: profile.interests.length,
          intent: profile.intent,
          destino: profile.destinoEstadoSlug,
        },
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Discovery queue
// ─────────────────────────────────────────────────────────────────────────────
export interface DiscoveryFilters {
  destinoEstadoSlug?: string;
  intent?: SocialIntent;
  minAge?: number;
  maxAge?: number;
  interests?: string[];
}

interface QueueResponse {
  queue?: SocialProfileView[];
  needsProfile?: boolean;
  error?: string;
}

export function useDiscoveryQueue(filters: DiscoveryFilters = {}) {
  return useQuery<QueueResponse>({
    queryKey: ['social', 'queue', filters],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filters.destinoEstadoSlug) p.set('destino', filters.destinoEstadoSlug);
      if (filters.intent) p.set('intent', filters.intent);
      if (filters.minAge != null) p.set('minAge', String(filters.minAge));
      if (filters.maxAge != null) p.set('maxAge', String(filters.maxAge));
      if (filters.interests?.length)
        p.set('interests', filters.interests.join(','));
      const qs = p.toString();
      try {
        return await apiFetch<QueueResponse>(
          qs ? `${API.socialQueue}?${qs}` : API.socialQueue,
        );
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          return { needsProfile: true };
        }
        throw err;
      }
    },
    staleTime: 10_000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Swipe
// ─────────────────────────────────────────────────────────────────────────────
interface SwipeInput {
  toUserId: string;
  action: SocialSwipeAction;
}

export function useSwipe() {
  const qc = useQueryClient();
  return useMutation<SocialSwipeResult, ApiError, SwipeInput>({
    mutationFn: (input) =>
      apiFetch<SocialSwipeResult>(API.socialSwipe, {
        method: 'POST',
        body: input,
      }),
    onSuccess: (result, input) => {
      emit(EVENTS.swipe, {
        properties: { action: input.action, matched: result.matched },
      });
      if (result.matched) {
        emit(EVENTS.match_created, {
          properties: {
            matchId: result.matchId ?? null,
            otherUserId: input.toUserId,
          },
        });
        qc.invalidateQueries({ queryKey: ['social', 'matches'] });
      }
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Matches list + chat
// ─────────────────────────────────────────────────────────────────────────────
export function useMatches() {
  return useQuery<SocialMatchView[]>({
    queryKey: ['social', 'matches'],
    queryFn: async () => {
      const data = await apiFetch<{ matches: SocialMatchView[] }>(
        API.socialMatches,
      );
      return data.matches;
    },
    staleTime: 10_000,
  });
}

export function useMessages(matchId: string | undefined, opts: {
  pollingIntervalMs?: number;
} = {}) {
  return useQuery<SocialMessageView[]>({
    queryKey: ['social', 'messages', matchId],
    enabled: Boolean(matchId),
    queryFn: async () => {
      if (!matchId) return [];
      const data = await apiFetch<{ messages: SocialMessageView[] }>(
        API.socialMatchMessages(matchId),
      );
      return data.messages;
    },
    refetchInterval: opts.pollingIntervalMs ?? 3000,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
}

export function useSendMessage(matchId: string) {
  const qc = useQueryClient();
  return useMutation<SocialMessageView, ApiError, string>({
    mutationFn: async (body) => {
      const data = await apiFetch<{ message: SocialMessageView }>(
        API.socialMatchMessages(matchId),
        { method: 'POST', body: { body } },
      );
      return data.message;
    },
    onSuccess: (message) => {
      qc.setQueryData<SocialMessageView[]>(
        ['social', 'messages', matchId],
        (prev) => {
          const next = prev ? [...prev] : [];
          if (!next.some((m) => m.id === message.id)) next.push(message);
          return next;
        },
      );
      qc.invalidateQueries({ queryKey: ['social', 'matches'] });
      emit(EVENTS.message_sent, {
        properties: { matchId, length: message.body.length },
      });
    },
  });
}

export function useCloseMatch() {
  const qc = useQueryClient();
  return useMutation<{ ok: true }, ApiError, string>({
    mutationFn: (matchId) =>
      apiFetch<{ ok: true }>(API.socialMatch(matchId), {
        method: 'DELETE',
      }),
    onSuccess: (_r, matchId) => {
      qc.invalidateQueries({ queryKey: ['social', 'matches'] });
      qc.invalidateQueries({ queryKey: ['social', 'messages', matchId] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Moderation: report + block
// ─────────────────────────────────────────────────────────────────────────────
export function useReportUser() {
  return useMutation<
    { ok: true },
    ApiError,
    { reportedId: string; reason: ReportReason; note?: string }
  >({
    mutationFn: (input) =>
      apiFetch<{ ok: true }>(API.socialReports, {
        method: 'POST',
        body: input,
      }),
    onSuccess: (_r, input) => {
      emit(EVENTS.user_reported, {
        properties: { reportedId: input.reportedId, reason: input.reason },
      });
    },
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation<{ ok: true }, ApiError, { userId: string }>({
    mutationFn: (input) =>
      apiFetch<{ ok: true }>(API.socialBlocks, {
        method: 'POST',
        body: input,
      }),
    onSuccess: (_r, input) => {
      qc.invalidateQueries({ queryKey: ['social', 'queue'] });
      qc.invalidateQueries({ queryKey: ['social', 'matches'] });
      emit(EVENTS.user_blocked, {
        properties: { blockedId: input.userId },
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Photo upload (to /api/social/upload)
// ─────────────────────────────────────────────────────────────────────────────
export interface UploadedPhotoView {
  url: string;
  sha256: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Uploads a single photo via multipart/form-data. `fileUri` should be the
 * local URI returned by `expo-image-picker` (starts with `file://` or
 * `content://`). Server enforces MIME + magic bytes + size + EXIF stripping.
 */
export async function uploadPhoto(
  fileUri: string,
  scope: 'avatar' | 'post',
): Promise<UploadedPhotoView> {
  const form = new FormData();
  // RN's FormData accepts this shape for file parts:
  form.append('file', {
    uri: fileUri,
    name: `photo-${Date.now()}.jpg`,
    type: 'image/jpeg',
  } as unknown as Blob);
  form.append('scope', scope);

  return apiFetch<UploadedPhotoView>(API.socialUpload, {
    method: 'POST',
    body: form,
    headers: {
      // Let fetch set the multipart boundary automatically — DO NOT set
      // Content-Type manually; that breaks the boundary.
      Accept: 'application/json',
    },
    timeoutMs: 30_000,
  });
}
