import { FlatList, View, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from '@/components/MotionPressable';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { ListSkeleton } from '@/components/ListSkeleton';
import { useMatches } from '@/hooks/useSocial';
import { haptics } from '@/lib/haptics';
import type { SocialMatchView } from '@shared/index';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'ahora';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

export default function MatchesScreen() {
  const router = useRouter();
  const { data, isLoading, isError, isRefetching, refetch } = useMatches();

  const renderItem = ({ item: m }: { item: SocialMatchView }) => (
    <Link href={`/conectar/chat/${m.matchId}`} asChild>
      <MotionPressable className="flex-row items-center gap-3 border-b border-white/5 px-5 py-3">
        <Avatar uri={m.other.photoUrl} name={m.other.displayName} size={52} />
        <View className="flex-1">
          <View className="flex-row items-baseline justify-between gap-2">
            <Text
              className="flex-1 text-base font-bold text-foreground"
              numberOfLines={1}
            >
              {m.other.displayName}
            </Text>
            <Text className="text-[10px] text-foreground/60">
              {timeAgo(m.lastMessageAt ?? m.createdAt)}
            </Text>
          </View>
          <Text className="mt-0.5 text-xs text-foreground/70" numberOfLines={1}>
            {m.isClosed
              ? 'Conversación cerrada'
              : (m.lastMessagePreview ?? 'Di hola 👋')}
          </Text>
          {m.other.destinoEstadoName ? (
            <Text className="text-[10px] text-foreground/50">
              Va a {m.other.destinoEstadoName}
            </Text>
          ) : null}
        </View>
        {m.unreadCount > 0 ? (
          <View className="min-w-6 items-center justify-center rounded-full bg-emerald px-1.5 py-0.5">
            <Text className="text-[10px] font-bold text-background">
              {m.unreadCount}
            </Text>
          </View>
        ) : null}
      </MotionPressable>
    </Link>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center gap-2 px-5 pb-3 pt-1">
        <MotionPressable
          onPress={() => {
            void haptics.tap();
            router.back();
          }}
          className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
        >
          <Ionicons name="chevron-back" size={22} color="#F8FAFC" />
        </MotionPressable>
        <Text className="flex-1 text-2xl font-bold text-foreground">
          Mis matches
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 px-5 pt-2">
          <ListSkeleton variant="row" rows={5} />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(m) => m.matchId}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#06C167"
            />
          }
          ListEmptyComponent={
            <View className="mt-6 px-5">
              {isError ? (
                <EmptyState
                  icon="cloud-offline-outline"
                  title="No pudimos cargar tus matches"
                  actionLabel="Reintentar"
                  onAction={() => void refetch()}
                />
              ) : (
                <EmptyState
                  icon="heart-outline"
                  title="Aún no tienes matches"
                  subtitle="Cuando un like sea mutuo aparecerá aquí."
                  actionLabel="Descubrir"
                  onAction={() => router.push('/(tabs)/conectar')}
                />
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
