import { FlatList, View, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RouteCard } from '@/components/RouteCard';
import { EmptyState } from '@/components/EmptyState';
import { ListSkeleton } from '@/components/ListSkeleton';
import { useRoutes } from '@/hooks/useRoutes';
import type { RouteSummary } from '@shared/index';

export default function RutasScreen() {
  const { data, isLoading, isError, isRefetching, refetch } = useRoutes();

  const renderItem = ({ item }: { item: RouteSummary }) => (
    <RouteCard route={item} />
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {isLoading ? (
        <View className="flex-1 px-5 pt-4">
          <Header />
          <ListSkeleton rows={3} />
        </View>
      ) : (
        <FlatList
          data={data?.routes ?? []}
          keyExtractor={(r) => r.slug}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          ListHeaderComponent={<Header />}
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
                title="No pudimos cargar rutas"
                subtitle="Revisa tu conexión y reintenta."
                actionLabel="Reintentar"
                onAction={() => void refetch()}
              />
            ) : (
              <EmptyState
                icon="map-outline"
                title="Sin rutas curadas"
                subtitle="El equipo editorial está preparando las primeras rutas."
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View className="mb-4 mt-2">
      <Text className="text-3xl font-bold text-foreground">Rutas</Text>
      <Text className="mt-1 text-sm text-foreground/60">
        Viajes curados por nuestro equipo. Paradas, tiempos y presupuestos.
      </Text>
    </View>
  );
}
