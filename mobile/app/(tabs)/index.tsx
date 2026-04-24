import { useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SearchBar } from '@/components/SearchBar';
import { CategoryChip } from '@/components/CategoryChip';
import { PlaceCard } from '@/components/PlaceCard';
import { PlaceListItem } from '@/components/PlaceListItem';
import { SectionHeader } from '@/components/SectionHeader';
import { ListSkeleton } from '@/components/ListSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { MotionPressable } from '@/components/MotionPressable';
import { useAuth } from '@/providers/AuthProvider';
import { usePlacesList } from '@/hooks/usePlaces';
import { useSearch } from '@/hooks/useSearch';
import { haptics } from '@/lib/haptics';
import { PLACE_CATEGORY_CATALOG, type PlaceCategorySlug } from '@shared/index';

/**
 * Explorar (home tab):
 *   - Greeting
 *   - SearchBar (debounced; shows inline results when the user types)
 *   - Category chips (filter rail)
 *   - Featured places (horizontal rail)
 *   - One vertical per-category rail for each category, showing top 6
 *
 * Empty states + skeletons baked in so loading never looks broken.
 */
export default function ExplorarScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<PlaceCategorySlug | null>(null);

  const { data: searchData, isFetching: searching } = useSearch(query);

  // Featured feed — filter by selected category if any, otherwise show top 6.
  const {
    data: placesData,
    isLoading: placesLoading,
    isError: placesError,
    refetch: refetchPlaces,
  } = usePlacesList(
    { category: selectedCategory ?? undefined },
    { limit: 6 },
  );

  const showSearch = query.trim().length >= 2;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="px-5 pt-2">
          <Text className="text-2xl font-bold text-foreground">
            Hola, {user?.name?.split(' ')[0] ?? 'viajero'}
          </Text>
          <Text className="mt-1 text-sm text-foreground/60">
            ¿A dónde vas hoy?
          </Text>
        </View>

        <View className="mt-4 px-5">
          <SearchBar value={query} onChange={setQuery} />
        </View>

        {/* Quick shortcuts row — visible when not searching. */}
        {!showSearch && user ? (
          <View className="mt-3 flex-row gap-2 px-5">
            <MotionPressable
              onPress={() => {
                void haptics.tap();
                router.push('/favoritos');
              }}
              accessibilityLabel="Mis favoritos"
              className="flex-1 flex-row items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5"
            >
              <Ionicons name="heart-outline" size={16} color="#EF4444" />
              <Text className="text-sm font-semibold text-foreground">
                Favoritos
              </Text>
            </MotionPressable>
            <MotionPressable
              onPress={() => {
                void haptics.tap();
                router.push('/mis-viajes');
              }}
              accessibilityLabel="Mis viajes"
              className="flex-1 flex-row items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5"
            >
              <Ionicons name="map-outline" size={16} color="#06C167" />
              <Text className="text-sm font-semibold text-foreground">
                Mis viajes
              </Text>
            </MotionPressable>
          </View>
        ) : null}

        {showSearch ? (
          <View className="px-5 pt-5">
            <SectionHeader
              title="Resultados"
              subtitle={searching ? 'Buscando…' : undefined}
            />
            {searching && !searchData ? (
              <ListSkeleton variant="row" rows={3} />
            ) : !searchData?.results?.length ? (
              <EmptyState
                title="Sin resultados"
                subtitle="Prueba con otro nombre o estado."
              />
            ) : (
              searchData.results.map((r) =>
                r.type === 'place' ? (
                  <PlaceListItem
                    key={`p-${r.slug}`}
                    place={{
                      slug: r.slug,
                      name: r.name,
                      stateName: r.stateName ?? '',
                      categoryName: r.category ?? '',
                      image: r.image ?? '',
                    }}
                  />
                ) : r.type === 'route' ? (
                  <Link
                    key={`r-${r.slug}`}
                    href={`/ruta/${r.slug}`}
                    className="mb-3 block rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-foreground"
                  >
                    Ruta: {r.name}
                  </Link>
                ) : (
                  <Link
                    key={`s-${r.slug}`}
                    href={`/categoria/pueblos-magicos`}
                    className="mb-3 block rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-foreground"
                  >
                    Estado: {r.name}
                  </Link>
                ),
              )
            )}
          </View>
        ) : (
          <>
            {/* Category chips */}
            <View className="mt-5">
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                data={PLACE_CATEGORY_CATALOG}
                keyExtractor={(c) => c.slug}
                renderItem={({ item }) => (
                  <CategoryChip
                    meta={item}
                    selected={selectedCategory === item.slug}
                    onPress={() =>
                      setSelectedCategory((cur) =>
                        cur === item.slug ? null : item.slug,
                      )
                    }
                  />
                )}
              />
            </View>

            {/* Featured rail */}
            <View className="mt-6 px-5">
              <SectionHeader
                title={
                  selectedCategory
                    ? (PLACE_CATEGORY_CATALOG.find(
                        (c) => c.slug === selectedCategory,
                      )?.name ?? 'Lugares')
                    : 'Destacados'
                }
                subtitle={
                  selectedCategory
                    ? 'Los más populares en esta categoría'
                    : 'Selección editorial'
                }
                seeAllHref={
                  selectedCategory
                    ? `/categoria/${selectedCategory}`
                    : undefined
                }
              />
            </View>
            <View className="pl-5">
              {placesLoading ? (
                <View className="pr-5">
                  <ListSkeleton rows={1} />
                </View>
              ) : placesError ? (
                <View className="pr-5">
                  <EmptyState
                    title="No pudimos cargar lugares"
                    subtitle="Revisa tu conexión y reintenta."
                    actionLabel="Reintentar"
                    onAction={() => void refetchPlaces()}
                  />
                </View>
              ) : !placesData?.places?.length ? (
                <View className="pr-5">
                  <EmptyState title="Sin lugares por ahora" />
                </View>
              ) : (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 20 }}
                  data={placesData.places}
                  keyExtractor={(p) => p.slug}
                  renderItem={({ item }) => (
                    <PlaceCard place={item} variant="compact" />
                  )}
                />
              )}
            </View>

            {/* Quick links to catalog hubs */}
            <View className="mt-8 px-5">
              <SectionHeader title="Categorías" />
              <View className="flex-row flex-wrap gap-2">
                {PLACE_CATEGORY_CATALOG.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/categoria/${c.slug}`}
                    className="flex-1 min-w-[48%] rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <Text className="text-xl">{c.emoji}</Text>
                    <Text className="mt-2 text-sm font-semibold text-foreground">
                      {c.name}
                    </Text>
                  </Link>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
