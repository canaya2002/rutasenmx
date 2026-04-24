import { FlatList, View, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from '@/components/MotionPressable';
import { PlaceListItem } from '@/components/PlaceListItem';
import { ListSkeleton } from '@/components/ListSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { usePlacesInfinite } from '@/hooks/usePlaces';
import { haptics } from '@/lib/haptics';
import {
  PLACE_CATEGORY_CATALOG,
  type PlaceCategorySlug,
  type PlaceView,
} from '@shared/index';

/**
 * Generic category hub. One route handles all seven categories (and can grow
 * to 30+ without adding files). Infinite-scroll paginated, pull-to-refresh,
 * empty + error states, glass back button over the hero.
 */
export default function CategoriaScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const meta = PLACE_CATEGORY_CATALOG.find((c) => c.slug === slug);
  const validCategory = meta?.slug as PlaceCategorySlug | undefined;

  const {
    data,
    isLoading,
    isError,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = usePlacesInfinite(
    validCategory ? { category: validCategory } : {},
    { enabled: Boolean(validCategory) },
  );

  if (!meta || !validCategory) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="p-5">
          <EmptyState
            icon="help-circle-outline"
            title="Categoría no encontrada"
            subtitle="Ese link no corresponde a ninguna de nuestras categorías."
            actionLabel="Volver"
            onAction={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const places: PlaceView[] = data?.pages.flatMap((p) => p.places) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center gap-2 px-5 pb-3 pt-2">
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
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60">
            Categoría
          </Text>
          <Text className="text-2xl font-bold text-foreground">
            {meta.emoji} {meta.name}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 px-5">
          <ListSkeleton variant="row" rows={6} />
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(p) => p.slug}
          renderItem={({ item }) => <PlaceListItem place={item} />}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 120,
            paddingTop: 4,
          }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#06C167"
            />
          }
          ListHeaderComponent={
            total > 0 ? (
              <Text className="mb-3 text-xs text-foreground/60">
                {total} {total === 1 ? 'lugar' : 'lugares'}
              </Text>
            ) : null
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4">
                <ListSkeleton variant="row" rows={2} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon="cloud-offline-outline"
                title="No pudimos cargar lugares"
                subtitle="Revisa tu conexión y reintenta."
                actionLabel="Reintentar"
                onAction={() => void refetch()}
              />
            ) : (
              <EmptyState
                icon="map-outline"
                title={`Sin ${meta.name.toLowerCase()} por ahora`}
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}
