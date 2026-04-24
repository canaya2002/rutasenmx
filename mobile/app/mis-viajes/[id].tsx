import { ScrollView, Text, View, Alert, Linking, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

import { MotionPressable } from '@/components/MotionPressable';
import { GlassCard } from '@/components/GlassCard';
import { InteractiveMap } from '@/components/InteractiveMap';
import { EmptyState } from '@/components/EmptyState';
import { ListSkeleton } from '@/components/ListSkeleton';
import { useTrip, useDeleteTrip } from '@/hooks/useTrips';
import { useExportTrip } from '@/hooks/useExportTrip';
import { haptics } from '@/lib/haptics';
import { useAuth } from '@/providers/AuthProvider';
import { apiFetch, ApiError } from '@/lib/api';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: trip, isLoading, isError, refetch } = useTrip(id);
  const del = useDeleteTrip();
  const exporter = useExportTrip();
  const [sharing, setSharing] = useState(false);

  async function onShare() {
    if (!trip || sharing) return;
    setSharing(true);
    try {
      const data = await apiFetch<{ ok: true; url: string; token: string }>(
        `/api/trips/${trip.id}/share`,
        { method: 'POST' },
      );
      void haptics.success();
      await Share.share({
        message: `Mira mi viaje por México: ${trip.title}\n${data.url}`,
        url: data.url, // iOS uses this for preview
        title: trip.title,
      });
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'No se pudo generar el enlace.';
      Alert.alert('Compartir viaje', msg);
    } finally {
      setSharing(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="p-5">
          <ListSkeleton rows={3} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !trip) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="p-5">
          <EmptyState
            icon="alert-circle-outline"
            title="Viaje no encontrado"
            actionLabel="Reintentar"
            onAction={() => void refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const markers = [
    trip.originLat != null && trip.originLng != null
      ? {
          id: 'origin',
          lat: trip.originLat,
          lng: trip.originLng,
          title: trip.originName ?? 'Origen',
        }
      : null,
    trip.destinationLat != null && trip.destinationLng != null
      ? {
          id: 'destination',
          lat: trip.destinationLat,
          lng: trip.destinationLng,
          title: trip.destinationName ?? 'Destino',
        }
      : null,
  ].filter((m): m is NonNullable<typeof m> => m != null);

  const onDelete = () => {
    Alert.alert(
      '¿Eliminar este viaje?',
      'Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            void haptics.warning();
            try {
              await del.mutateAsync(trip.id);
              router.back();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el viaje.');
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const onExport = async () => {
    void haptics.tap();
    await exporter.run({
      title: trip.title,
      description: trip.description ?? undefined,
      originName: trip.originName,
      destinationName: trip.destinationName,
      totalDistanceKm: trip.totalDistanceKm,
      totalDurationMinutes: trip.totalDurationMinutes,
      plan: user?.plan ?? 'free',
      // Without trip_stops API yet, we render origin/destination as waypoints.
      stops: [
        trip.originLat != null && trip.originLng != null
          ? {
              name: trip.originName ?? 'Origen',
              lat: trip.originLat,
              lng: trip.originLng,
              day: 1,
            }
          : null,
        trip.destinationLat != null && trip.destinationLng != null
          ? {
              name: trip.destinationName ?? 'Destino',
              lat: trip.destinationLat,
              lng: trip.destinationLng,
              day: 1,
            }
          : null,
      ].filter((s): s is NonNullable<typeof s> => s != null),
    });
  };

  const onOpenMaps = () => {
    void haptics.tap();
    if (markers.length >= 2) {
      const coords = markers
        .map((m) => `${m.lat},${m.lng}`)
        .join('/');
      void Linking.openURL(`https://www.google.com/maps/dir/${coords}`);
    } else if (markers.length === 1) {
      const m = markers[0];
      void Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lng}`,
      );
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center justify-between px-5 py-2">
            <MotionPressable
              onPress={() => {
                void haptics.tap();
                router.back();
              }}
              accessibilityLabel="Volver"
              className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
            >
              <Ionicons name="chevron-back" size={22} color="#F8FAFC" />
            </MotionPressable>
            <View className="flex-row items-center gap-2">
              <MotionPressable
                onPress={() => void onShare()}
                accessibilityLabel="Compartir viaje"
                accessibilityState={{ busy: sharing }}
                className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
                style={{ opacity: sharing ? 0.5 : 1 }}
              >
                <Ionicons name="share-outline" size={18} color="#F8FAFC" />
              </MotionPressable>
              <MotionPressable
                onPress={onDelete}
                accessibilityLabel="Eliminar viaje"
                accessibilityHint="Elimina este itinerario permanentemente"
                className="h-10 w-10 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10"
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </MotionPressable>
            </View>
          </View>
        </SafeAreaView>

        <View className="px-5">
          <Text className="text-[11px] font-semibold uppercase tracking-wider text-emerald">
            {trip.status}
          </Text>
          <Text className="mt-1 text-3xl font-bold text-foreground">
            {trip.title}
          </Text>
          {(trip.originName || trip.destinationName) && (
            <Text className="mt-1 text-sm text-foreground/70">
              {trip.originName ?? '—'} → {trip.destinationName ?? '—'}
            </Text>
          )}
          {trip.description ? (
            <Text className="mt-3 text-sm leading-6 text-foreground/80">
              {trip.description}
            </Text>
          ) : null}

          {/* Stats */}
          <View className="mt-4 flex-row flex-wrap gap-4">
            {trip.totalDistanceKm != null && (
              <StatItem
                icon="car-outline"
                label="Distancia"
                value={`${Math.round(trip.totalDistanceKm)} km`}
              />
            )}
            {trip.totalDurationMinutes != null && (
              <StatItem
                icon="time-outline"
                label="Manejo"
                value={`${Math.round(trip.totalDurationMinutes / 60)}h`}
              />
            )}
          </View>
        </View>

        {/* Map */}
        {markers.length > 0 && (
          <View className="mt-5 px-5">
            <InteractiveMap markers={markers} polyline={markers.length >= 2} />
          </View>
        )}

        {/* Actions */}
        <View className="mt-5 flex-row gap-2 px-5">
          <MotionPressable
            onPress={onExport}
            disabled={exporter.exporting}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-emerald py-3"
            style={{ opacity: exporter.exporting ? 0.6 : 1 }}
          >
            <Ionicons name="document-text-outline" size={16} color="#0A0F14" />
            <Text className="text-sm font-bold text-background">
              {exporter.exporting ? 'Generando…' : 'Exportar PDF'}
            </Text>
          </MotionPressable>
          <MotionPressable
            onPress={onOpenMaps}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-3"
          >
            <Ionicons name="navigate-outline" size={16} color="#06C167" />
            <Text className="text-sm font-semibold text-foreground">
              Google Maps
            </Text>
          </MotionPressable>
        </View>

        {exporter.error ? (
          <GlassCard
            intensity={60}
            className="mx-5 mt-3 border-red-500/40 bg-red-500/10 p-3"
          >
            <Text className="text-sm text-red-200">{exporter.error}</Text>
          </GlassCard>
        ) : null}

        {user?.plan === 'free' && (
          <View className="mt-4 px-5">
            <GlassCard intensity={50} className="p-4">
              <View className="flex-row items-start gap-2">
                <Ionicons name="information-circle" size={16} color="#06C167" />
                <Text className="flex-1 text-xs text-foreground/70">
                  Tu PDF se exporta con marca de agua porque estás en el plan
                  gratuito. Actualiza a Pro para exportar sin marca.
                </Text>
              </View>
            </GlassCard>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View>
      <View className="flex-row items-center gap-1">
        <Ionicons name={icon} size={14} color="#94A3B8" />
        <Text className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60">
          {label}
        </Text>
      </View>
      <Text className="mt-0.5 text-sm font-bold text-foreground">{value}</Text>
    </View>
  );
}
