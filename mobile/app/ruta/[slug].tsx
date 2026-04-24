import { ScrollView, Text, View, Linking } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from '@/components/MotionPressable';
import { GlassCard } from '@/components/GlassCard';
import { EmptyState } from '@/components/EmptyState';
import { ListSkeleton } from '@/components/ListSkeleton';
import { useRoute } from '@/hooks/useRoutes';
import { imageUrl } from '@/lib/images';
import { haptics } from '@/lib/haptics';
import type { RouteStopView } from '@shared/index';

const BLURHASH = 'L5H2EC=PM+yV0g-mq.wG9c010J}I';

const DIFFICULTY_LABEL: Record<string, string> = {
  facil: 'Fácil',
  moderada: 'Moderada',
  avanzada: 'Avanzada',
};

export default function RouteDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { data: route, isLoading, isError, refetch } = useRoute(slug);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="p-5">
          <ListSkeleton rows={1} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !route) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="p-5">
          <EmptyState
            icon="alert-circle-outline"
            title="Ruta no encontrada"
            actionLabel="Reintentar"
            onAction={() => void refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const hero = imageUrl(route.image);

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="aspect-[16/10] w-full bg-slate-800">
          {hero ? (
            <Image
              source={{ uri: hero }}
              placeholder={BLURHASH}
              contentFit="cover"
              transition={250}
              style={{ width: '100%', height: '100%' }}
            />
          ) : null}
          <View className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent" />

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

        <View className="-mt-10 px-5">
          <GlassCard intensity={70} className="p-5">
            <Text className="text-[11px] font-semibold uppercase tracking-wider text-emerald">
              {route.origin} → {route.destination}
            </Text>
            <Text className="mt-1 text-3xl font-bold text-foreground">
              {route.name}
            </Text>
            <Text className="mt-2 text-sm text-foreground/70">
              {route.description}
            </Text>

            <View className="mt-4 flex-row flex-wrap gap-4">
              <Stat
                icon="car-outline"
                label="Distancia"
                value={`${route.distanceKm} km`}
              />
              <Stat
                icon="time-outline"
                label="Manejo"
                value={`${route.drivingHours}h`}
              />
              <Stat
                icon="calendar-outline"
                label="Duración"
                value={`${route.durationDays}d`}
              />
              <Stat
                icon="trending-up-outline"
                label="Dificultad"
                value={DIFFICULTY_LABEL[route.difficulty] ?? route.difficulty}
              />
              <Stat
                icon="cash-outline"
                label="Presupuesto"
                value={`$${route.estimatedCostMXN.toLocaleString('es-MX')} MXN`}
              />
            </View>
          </GlassCard>
        </View>

        {/* Highlights */}
        {route.highlights.length > 0 && (
          <View className="mt-4 px-5">
            <Text className="mb-2 text-lg font-bold text-foreground">
              Lo mejor
            </Text>
            <GlassCard intensity={60} className="p-4">
              {route.highlights.map((h) => (
                <View key={h} className="flex-row items-start gap-2 py-1">
                  <Ionicons
                    name="star"
                    size={14}
                    color="#06C167"
                    style={{ marginTop: 3 }}
                  />
                  <Text className="flex-1 text-sm text-foreground/80">{h}</Text>
                </View>
              ))}
            </GlassCard>
          </View>
        )}

        {/* Stops */}
        {route.stops.length > 0 && (
          <View className="mt-5 px-5">
            <Text className="mb-2 text-lg font-bold text-foreground">
              Paradas ({route.stops.length})
            </Text>
            {route.stops
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((stop, idx) => (
                <StopRow key={stop.placeSlug} stop={stop} index={idx + 1} />
              ))}
          </View>
        )}

        {/* Open first stop in Google Maps */}
        {route.stops[0]?.lat != null && route.stops[0]?.lng != null && (
          <View className="mt-4 px-5">
            <MotionPressable
              onPress={() => {
                void haptics.tap();
                const coords = route.stops
                  .map((s) => (s.lat != null && s.lng != null ? `${s.lat},${s.lng}` : null))
                  .filter(Boolean)
                  .join('/');
                void Linking.openURL(
                  `https://www.google.com/maps/dir/${coords}`,
                );
              }}
              className="flex-row items-center justify-center gap-2 rounded-full bg-emerald py-3"
            >
              <Ionicons name="navigate" size={18} color="#0A0F14" />
              <Text className="text-sm font-bold text-background">
                Abrir ruta en Google Maps
              </Text>
            </MotionPressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="mr-4">
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

function StopRow({ stop, index }: { stop: RouteStopView; index: number }) {
  const img = imageUrl(stop.image);
  const hours = Math.floor(stop.stayMinutes / 60);
  const minutes = stop.stayMinutes % 60;
  const stayLabel =
    hours > 0 && minutes > 0
      ? `${hours}h ${minutes}m`
      : hours > 0
        ? `${hours}h`
        : `${minutes}m`;

  const content = (
    <View className="mb-3 flex-row items-start gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3">
      <View className="items-center">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-emerald">
          <Text className="text-xs font-bold text-background">{index}</Text>
        </View>
      </View>
      {img ? (
        <Image
          source={{ uri: img }}
          placeholder={BLURHASH}
          contentFit="cover"
          style={{ width: 56, height: 56, borderRadius: 12 }}
        />
      ) : (
        <View className="h-14 w-14 rounded-xl bg-slate-800" />
      )}
      <View className="flex-1">
        <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
          {stop.placeName}
        </Text>
        {stop.stateName ? (
          <Text className="text-[11px] text-foreground/60">{stop.stateName}</Text>
        ) : null}
        <Text
          className="mt-1 text-xs text-foreground/70"
          numberOfLines={2}
        >
          {stop.note}
        </Text>
        <Text className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-emerald">
          Estadía: {stayLabel}
        </Text>
      </View>
    </View>
  );

  return (
    <Link href={`/lugar/${stop.placeSlug}`} asChild>
      <MotionPressable>{content}</MotionPressable>
    </Link>
  );
}
