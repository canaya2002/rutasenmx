import { FlatList, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { MotionPressable } from '@/components/MotionPressable';
import { EmptyState } from '@/components/EmptyState';
import { useFavoritesList, useToggleFavorite } from '@/hooks/useFavorites';
import { useAuth } from '@/providers/AuthProvider';
import { imageUrl } from '@/lib/images';
import { haptics } from '@/lib/haptics';

/**
 * "Mis favoritos" screen — read + unfavorite from a single list. The heart
 * on each row does an optimistic remove (cache-backed) so the UI animates
 * smoothly even on a slow connection.
 */
export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useFavoritesList();
  const toggle = useToggleFavorite();

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title="Favoritos" onBack={() => router.back()} />
        <View className="flex-1 p-5">
          <EmptyState
            icon="heart-outline"
            title="Inicia sesión para guardar favoritos"
            subtitle="Guarda tus lugares preferidos y vuelve a ellos desde cualquier dispositivo."
            actionLabel="Iniciar sesión"
            onAction={() => router.push('/(auth)/login')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="Favoritos" onBack={() => router.back()} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#06C167" />
        </View>
      ) : isError ? (
        <View className="p-5">
          <EmptyState
            icon="alert-circle-outline"
            title="No pudimos cargar tus favoritos"
            actionLabel="Reintentar"
            onAction={() => void refetch()}
          />
        </View>
      ) : !data || data.length === 0 ? (
        <View className="p-5">
          <EmptyState
            icon="heart-outline"
            title="Sin favoritos todavía"
            subtitle="Toca el corazón en cualquier lugar que te interese y lo verás aquí."
            actionLabel="Explorar lugares"
            onAction={() => router.push('/(tabs)')}
          />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => {
            const img = imageUrl(item.image);
            return (
              <View className="flex-row gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <MotionPressable
                  hapticOnPressIn={false}
                  onPress={() => router.push(`/lugar/${item.slug}`)}
                  accessibilityLabel={item.name}
                  className="flex-1 flex-row gap-3 p-3"
                >
                  <View className="h-16 w-16 overflow-hidden rounded-xl bg-slate-800">
                    {img ? (
                      <Image
                        source={{ uri: img }}
                        contentFit="cover"
                        transition={200}
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : null}
                  </View>
                  <View className="flex-1 justify-center">
                    <Text
                      className="text-sm font-bold text-foreground"
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text className="mt-0.5 text-xs text-foreground/60">
                      {item.categoryName} · {item.stateName}
                    </Text>
                  </View>
                </MotionPressable>

                <MotionPressable
                  onPress={() => {
                    void haptics.tap();
                    toggle.mutate({ slug: item.slug, add: false });
                  }}
                  accessibilityLabel="Quitar de favoritos"
                  className="h-full justify-center px-4"
                >
                  <Ionicons name="heart" size={20} color="#EF4444" />
                </MotionPressable>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View className="flex-row items-center gap-2 px-5 pb-2 pt-1">
      <MotionPressable
        onPress={() => {
          void haptics.tap();
          onBack();
        }}
        accessibilityLabel="Volver"
        className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
      >
        <Ionicons name="chevron-back" size={20} color="#F8FAFC" />
      </MotionPressable>
      <Text
        className="flex-1 text-xl font-bold text-foreground"
        accessibilityRole="header"
      >
        {title}
      </Text>
    </View>
  );
}
