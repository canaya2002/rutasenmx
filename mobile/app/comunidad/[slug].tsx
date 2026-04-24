import {
  FlatList,
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from '@/components/MotionPressable';
import { PostCard } from '@/components/PostCard';
import { EmptyState } from '@/components/EmptyState';
import { ListSkeleton } from '@/components/ListSkeleton';
import {
  useCommunity,
  useCommunityPosts,
  useJoinCommunity,
  useLeaveCommunity,
} from '@/hooks/useCommunity';
import { imageUrl } from '@/lib/images';
import { haptics } from '@/lib/haptics';

export default function CommunityDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const { data: community, isLoading: communityLoading } = useCommunity(slug);
  const posts = useCommunityPosts(slug);
  const join = useJoinCommunity();
  const leave = useLeaveCommunity();

  const cover = imageUrl(community?.coverPhotoUrl ?? null);

  const canPost =
    community?.type === 'forum' ||
    (community?.type === 'group' && community.isMember) ||
    (community?.type === 'channel' &&
      (community.role === 'moderator' || community.role === 'owner'));

  const flatPosts = posts.data?.pages.flatMap((p) => p.posts) ?? [];

  if (communityLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#06C167" />
      </SafeAreaView>
    );
  }

  if (!community) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="p-5">
          <EmptyState
            icon="alert-circle-outline"
            title="Comunidad no encontrada"
            actionLabel="Volver"
            onAction={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  function toggleMembership() {
    if (!slug || !community) return;
    void haptics.tap();
    if (community.isMember) {
      if (community.role === 'owner') return;
      leave.mutate(slug);
    } else {
      join.mutate(slug);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={flatPosts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (posts.hasNextPage && !posts.isFetchingNextPage)
            void posts.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={posts.isRefetching}
            onRefresh={posts.refetch}
            tintColor="#06C167"
          />
        }
        ListHeaderComponent={
          <View>
            {/* Cover */}
            <View className="-mx-5 aspect-[16/9] bg-slate-800">
              {cover ? (
                <Image
                  source={{ uri: cover }}
                  contentFit="cover"
                  style={{ width: '100%', height: '100%' }}
                />
              ) : null}
              <View className="absolute inset-x-0 bottom-0 h-1/2 bg-black/60" />
              <SafeAreaView edges={['top']} className="absolute left-2 top-0">
                <MotionPressable
                  onPress={() => {
                    void haptics.tap();
                    router.back();
                  }}
                  accessibilityLabel="Volver"
                  className="ml-2 mt-2 h-10 w-10 items-center justify-center rounded-full bg-black/50"
                >
                  <Ionicons name="chevron-back" size={22} color="#F8FAFC" />
                </MotionPressable>
              </SafeAreaView>
            </View>

            <View className="mt-4">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald">
                {community.type === 'forum'
                  ? 'Foro'
                  : community.type === 'group'
                    ? 'Grupo'
                    : 'Canal'}
              </Text>
              <Text className="mt-1 text-2xl font-bold text-foreground">
                {community.name}
              </Text>
              {community.description ? (
                <Text className="mt-1 text-sm text-foreground/70">
                  {community.description}
                </Text>
              ) : null}
              <Text className="mt-2 text-xs text-foreground/50">
                {community.memberCount}{' '}
                {community.memberCount === 1 ? 'miembro' : 'miembros'} ·{' '}
                {community.postCount}{' '}
                {community.postCount === 1
                  ? 'publicación'
                  : 'publicaciones'}
              </Text>

              {/* Join/Leave */}
              {community.type !== 'forum' && (
                <MotionPressable
                  onPress={toggleMembership}
                  disabled={
                    join.isPending ||
                    leave.isPending ||
                    community.role === 'owner'
                  }
                  className={`mt-4 flex-row items-center justify-center gap-1.5 rounded-full py-2.5 ${
                    community.isMember
                      ? 'border border-white/10 bg-white/5'
                      : 'bg-emerald'
                  }`}
                  style={{
                    opacity:
                      join.isPending ||
                      leave.isPending ||
                      community.role === 'owner'
                        ? 0.6
                        : 1,
                  }}
                >
                  <Ionicons
                    name={
                      community.isMember
                        ? 'checkmark-circle'
                        : 'add-circle-outline'
                    }
                    size={14}
                    color={community.isMember ? '#06C167' : '#0A0F14'}
                  />
                  <Text
                    className={`text-sm font-bold ${
                      community.isMember ? 'text-emerald' : 'text-background'
                    }`}
                  >
                    {community.role === 'owner'
                      ? 'Dueño'
                      : community.isMember
                        ? 'Unido · Toca para salir'
                        : 'Unirme'}
                  </Text>
                </MotionPressable>
              )}

              {canPost ? (
                <Link href={`/comunidad/${community.slug}/nuevo`} asChild>
                  <MotionPressable className="mt-2 flex-row items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-2.5">
                    <Ionicons name="create-outline" size={14} color="#F8FAFC" />
                    <Text className="text-sm font-semibold text-foreground">
                      Nueva publicación
                    </Text>
                  </MotionPressable>
                </Link>
              ) : null}
            </View>

            <View className="mb-3 mt-5 border-b border-white/5" />
          </View>
        }
        ListEmptyComponent={
          posts.isLoading ? (
            <ListSkeleton rows={3} />
          ) : (
            <EmptyState
              icon="chatbubble-outline"
              title="Aún no hay publicaciones"
              subtitle={
                canPost
                  ? 'Sé el primero en compartir.'
                  : 'El equipo editorial estará publicando pronto.'
              }
            />
          )
        }
        ListFooterComponent={
          posts.isFetchingNextPage ? (
            <View className="py-4">
              <ListSkeleton rows={2} />
            </View>
          ) : null
        }
      />
    </View>
  );
}
