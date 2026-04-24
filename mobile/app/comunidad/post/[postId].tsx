import { useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from '@/components/MotionPressable';
import { Avatar } from '@/components/Avatar';
import { CommentRow } from '@/components/CommentRow';
import { ChatInput } from '@/components/ChatInput';
import { EmptyState } from '@/components/EmptyState';
import { ListSkeleton } from '@/components/ListSkeleton';
import {
  usePost,
  usePostComments,
  useCreateComment,
  useVotePost,
  useFlagPost,
} from '@/hooks/useCommunity';
import { imageUrl } from '@/lib/images';
import { haptics } from '@/lib/haptics';
import {
  REPORT_REASONS,
  REPORT_REASON_LABELS_ES,
  type ReportReason,
} from '@shared/index';

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

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const [flagOpen, setFlagOpen] = useState(false);

  const post = usePost(postId);
  const comments = usePostComments(postId);
  const vote = useVotePost(postId ?? '');
  const flag = useFlagPost();
  const createComment = useCreateComment(postId ?? '');

  if (!postId) return null;

  if (post.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#06C167" />
      </SafeAreaView>
    );
  }

  if (post.isError || !post.data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="p-5">
          <EmptyState
            icon="alert-circle-outline"
            title="Publicación no disponible"
            actionLabel="Volver"
            onAction={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const p = post.data;

  async function sendComment(body: string) {
    await createComment.mutateAsync({ body });
  }

  function promptFlag() {
    const options = REPORT_REASONS.map((r) => REPORT_REASON_LABELS_ES[r]);
    Alert.alert('Reportar publicación', 'Elige un motivo:', [
      ...REPORT_REASONS.map((r, i) => ({
        text: options[i],
        onPress: async () => {
          try {
            await flag.mutateAsync({ postId: p.id, reason: r });
            void haptics.success();
            Alert.alert('Gracias', 'Tu reporte fue enviado.');
          } catch {
            void haptics.error();
            Alert.alert('Error', 'No se pudo enviar el reporte.');
          }
        },
      })),
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center gap-2 px-5 pb-2 pt-1">
        <MotionPressable
          onPress={() => {
            void haptics.tap();
            router.back();
          }}
          accessibilityLabel="Volver"
          className="h-10 w-10 items-center justify-center rounded-full bg-white/5"
        >
          <Ionicons name="chevron-back" size={22} color="#F8FAFC" />
        </MotionPressable>
        <Text className="flex-1 text-sm text-foreground/70" numberOfLines={1}>
          {p.communityName}
        </Text>
        <MotionPressable
          onPress={promptFlag}
          accessibilityLabel="Reportar publicación"
          className="h-10 w-10 items-center justify-center rounded-full bg-white/5"
        >
          <Ionicons name="flag-outline" size={14} color="#F8FAFC" />
        </MotionPressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-5">
            <View className="flex-row items-center gap-2">
              <Avatar uri={p.authorPhoto} name={p.authorName} size={36} />
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground">
                  {p.authorName}
                </Text>
                <Text className="text-[10px] text-foreground/60">
                  {timeAgo(p.createdAt)}
                </Text>
              </View>
            </View>

            <Text className="mt-3 text-2xl font-extrabold text-foreground">
              {p.title}
            </Text>
            <Text className="mt-2 text-sm leading-6 text-foreground/85">
              {p.body}
            </Text>

            {p.photoUrls.length > 0 ? (
              <View className="mt-3 gap-2">
                {p.photoUrls.map((url, i) => {
                  const u = imageUrl(url);
                  if (!u) return null;
                  return (
                    <View
                      key={i}
                      className="overflow-hidden rounded-xl bg-slate-800"
                    >
                      <Image
                        source={{ uri: u }}
                        contentFit="cover"
                        style={{ width: '100%', aspectRatio: 4 / 3 }}
                      />
                    </View>
                  );
                })}
              </View>
            ) : null}

            <View className="mt-4 flex-row items-center gap-4 border-t border-white/5 pt-3">
              <MotionPressable
                onPress={() => {
                  void haptics.tap();
                  vote.mutate();
                }}
                hapticOnPressIn={false}
                className={`flex-row items-center gap-1 rounded-full px-3 py-1.5 ${
                  p.didUpvote ? 'bg-emerald' : 'border border-white/10 bg-white/5'
                }`}
              >
                <Ionicons
                  name="arrow-up-outline"
                  size={14}
                  color={p.didUpvote ? '#0A0F14' : '#F8FAFC'}
                />
                <Text
                  className={`text-xs font-semibold ${
                    p.didUpvote ? 'text-background' : 'text-foreground'
                  }`}
                >
                  {p.upvoteCount}
                </Text>
              </MotionPressable>
              <View className="flex-row items-center gap-1">
                <Ionicons
                  name="chatbubble-outline"
                  size={12}
                  color="#94A3B8"
                />
                <Text className="text-xs text-foreground/60">
                  {p.commentCount}
                </Text>
              </View>
            </View>
          </View>

          <View className="mx-5 mt-5 border-t border-white/5 pt-3">
            <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
              Comentarios
            </Text>
            {comments.isLoading ? (
              <ListSkeleton variant="row" rows={3} />
            ) : (comments.data ?? []).length === 0 ? (
              <Text className="py-6 text-center text-xs text-foreground/60">
                Sé el primero en comentar
              </Text>
            ) : (
              (comments.data ?? []).map((c) => (
                <CommentRow key={c.id} comment={c} />
              ))
            )}
          </View>
        </ScrollView>

        {p.isLocked ? (
          <View className="border-t border-white/5 p-4">
            <Text className="text-center text-xs text-foreground/60">
              Esta publicación está cerrada para nuevos comentarios.
            </Text>
          </View>
        ) : (
          <ChatInput
            onSend={sendComment}
            placeholder="Escribe un comentario…"
            maxLength={4000}
          />
        )}
      </KeyboardAvoidingView>
      {flagOpen ? null : null}
    </SafeAreaView>
  );
}
