import { FlatList, View, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from '@/components/MotionPressable';
import { TripCard } from '@/components/TripCard';
import { EmptyState } from '@/components/EmptyState';
import { ListSkeleton } from '@/components/ListSkeleton';
import { useTrips } from '@/hooks/useTrips';
import { haptics } from '@/lib/haptics';
import type { TripSummary } from '@shared/index';

export default function MisViajesScreen() {
  const router = useRouter();
  const { data, isLoading, isError, isRefetching, refetch } = useTrips();

  const trips = data?.trips ?? [];

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
          <Text className="text-2xl font-bold text-foreground">Mis viajes</Text>
          {data?.limit ? (
            <Text className="text-xs text-foreground/60">
              {trips.length} de {data.limit} guardados
            </Text>
          ) : (
            <Text className="text-xs text-foreground/60">
              {trips.length} guardados
            </Text>
          )}
        </View>
        <MotionPressable
          onPress={() => {
            void haptics.tap();
            router.push('/(tabs)/autopilot');
          }}
          className="flex-row items-center gap-1 rounded-full bg-emerald px-3 py-2"
        >
          <Ionicons name="sparkles" size={14} color="#0A0F14" />
          <Text className="text-xs font-bold text-background">Autopilot</Text>
        </MotionPressable>
      </View>

      {isLoading ? (
        <View className="flex-1 px-5 pt-2">
          <ListSkeleton rows={4} />
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(t: TripSummary) => t.id}
          renderItem={({ item }) => <TripCard trip={item} />}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 120,
            paddingTop: 4,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#06C167"
            />
          }
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon="cloud-offline-outline"
                title="No pudimos cargar tus viajes"
                actionLabel="Reintentar"
                onAction={() => void refetch()}
              />
            ) : (
              <EmptyState
                icon="map-outline"
                title="Aún no tienes viajes"
                subtitle="Usa Autopilot para generar tu primera ruta en 30 segundos."
                actionLabel="Empezar con Autopilot"
                onAction={() => router.push('/(tabs)/autopilot')}
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}
