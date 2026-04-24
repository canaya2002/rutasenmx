import { useState } from 'react';
import {
  FlatList,
  View,
  Text,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { MotionPressable } from '@/components/MotionPressable';
import { GlassCard } from '@/components/GlassCard';
import { EmptyState } from '@/components/EmptyState';
import { ListSkeleton } from '@/components/ListSkeleton';
import { SearchBar } from '@/components/SearchBar';
import { useCommunities, type CommunityView } from '@/hooks/useCommunity';
import { useDebouncedValue } from '@/hooks/useSearch';
import { imageUrl } from '@/lib/images';
import { haptics } from '@/lib/haptics';

const TYPE_META: Record<
  CommunityView['type'],
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  forum: { label: 'Foro', icon: 'chatbubbles-outline', color: '#06C167' },
  group: { label: 'Grupo', icon: 'people-outline', color: '#3B82F6' },
  channel: { label: 'Canal', icon: 'megaphone-outline', color: '#8B5CF6' },
};

export default function ComunidadIndexScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 250);
  const { data, isLoading, isError, isRefetching, refetch } = useCommunities({
    q: debounced.trim() || undefined,
  });

  const all = data ?? [];
  const forums = all.filter((c) => c.type === 'forum');
  const groups = all.filter((c) => c.type === 'group');
  const channels = all.filter((c) => c.type === 'channel');

  const sections = [
    { key: 'channels', title: 'Canales editoriales', items: channels },
    { key: 'forums', title: 'Foros temáticos', items: forums },
    { key: 'groups', title: 'Grupos', items: groups },
  ].filter((s) => s.items.length > 0 || debounced.length === 0);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center gap-2 px-5 pb-2 pt-1">
        <MotionPressable
          onPress={() => {
            void haptics.tap();
            router.back();
          }}
          className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
        >
          <Ionicons name="chevron-back" size={22} color="#F8FAFC" />
        </MotionPressable>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-foreground">Comunidad</Text>
          <Text className="text-[11px] text-foreground/60">
            Foros, grupos y canales de viajeros en México
          </Text>
        </View>
        <Link href="/comunidad/grupos/nuevo" asChild>
          <MotionPressable className="flex-row items-center gap-1 rounded-full bg-emerald px-3 py-2">
            <Ionicons name="add" size={14} color="#0A0F14" />
            <Text className="text-xs font-bold text-background">Grupo</Text>
          </MotionPressable>
        </Link>
      </View>

      <View className="px-5 pb-2">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Buscar foros, grupos…"
        />
      </View>

      {isLoading ? (
        <View className="flex-1 px-5 pt-3">
          <ListSkeleton rows={4} />
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.key}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#06C167"
            />
          }
          renderItem={({ item: section }) => (
            <View className="mt-3">
              <Text className="mx-5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                {section.title}
              </Text>
              {section.items.length === 0 ? (
                <View className="mx-5">
                  <EmptyState
                    icon="search-outline"
                    title={`Sin ${section.title.toLowerCase()}`}
                  />
                </View>
              ) : (
                section.items.map((c) => <CommunityRow key={c.id} c={c} />)
              )}
            </View>
          )}
          ListEmptyComponent={
            isError ? (
              <View className="mx-5 mt-5">
                <EmptyState
                  icon="cloud-offline-outline"
                  title="No pudimos cargar"
                  actionLabel="Reintentar"
                  onAction={() => void refetch()}
                />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function CommunityRow({ c }: { c: CommunityView }) {
  const meta = TYPE_META[c.type];
  const cover = imageUrl(c.coverPhotoUrl);
  return (
    <Link href={`/comunidad/${c.slug}`} asChild>
      <MotionPressable className="mx-5 mb-2 flex-row items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3">
        <View className="h-14 w-14 overflow-hidden rounded-xl bg-slate-800">
          {cover ? (
            <Image
              source={{ uri: cover }}
              contentFit="cover"
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name={meta.icon} size={20} color={meta.color} />
            </View>
          )}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <View
              className="rounded-full px-1.5 py-0.5"
              style={{ backgroundColor: `${meta.color}33` }}
            >
              <Text
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: meta.color }}
              >
                {meta.label}
              </Text>
            </View>
            {c.isMember ? (
              <Text className="text-[9px] font-bold uppercase tracking-wider text-emerald">
                · Unido
              </Text>
            ) : null}
          </View>
          <Text className="mt-0.5 text-base font-bold text-foreground" numberOfLines={1}>
            {c.name}
          </Text>
          {c.description ? (
            <Text
              className="text-xs text-foreground/60"
              numberOfLines={1}
            >
              {c.description}
            </Text>
          ) : null}
          <Text className="mt-0.5 text-[10px] text-foreground/50">
            {c.memberCount} miembros · {c.postCount} publicaciones
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
      </MotionPressable>
    </Link>
  );
}
