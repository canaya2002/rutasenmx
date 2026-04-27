import { ScrollView, Text, View, Linking, Alert } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from '@/components/MotionPressable';
import { GlassCard } from '@/components/GlassCard';
import { StaticMap } from '@/components/StaticMap';
import { EmptyState } from '@/components/EmptyState';
import { ListSkeleton } from '@/components/ListSkeleton';
import { usePlace } from '@/hooks/usePlace';
import { useIsFavorite, useToggleFavorite } from '@/hooks/useFavorites';
import { useAuth } from '@/providers/AuthProvider';
import { imageUrl } from '@/lib/images';
import { haptics } from '@/lib/haptics';
import { addDraftStop } from '@/lib/trip-draft';

const BLURHASH = 'L5H2EC=PM+yV0g-mq.wG9c010J}I';

export default function PlaceDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: place, isLoading, isError, refetch } = usePlace(slug);
  const isFavorite = useIsFavorite(slug);
  const toggleFavorite = useToggleFavorite();

  async function onAddToRoute() {
    if (!place || !slug) return;
    void haptics.tap();
    const result = await addDraftStop({
      slug,
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      stateName: place.stateName,
      category: place.category,
    });
    if (result.ok) {
      void haptics.success();
      Alert.alert(
        'Agregado a tu ruta',
        `Llevas ${result.count} parada${result.count === 1 ? '' : 's'}. Continúa armando tu ruta.`,
        [
          { text: 'Seguir explorando', style: 'cancel' },
          {
            text: 'Ver ruta',
            onPress: () => router.push('/mis-viajes'),
          },
        ],
      );
    } else {
      void haptics.warning();
      Alert.alert(
        'Ya está en tu ruta',
        `Esta parada ya formaba parte de las ${result.count} que llevas.`,
      );
    }
  }

  function onToggleFavorite() {
    if (!place || !slug) return;
    if (!user) {
      Alert.alert(
        'Inicia sesión',
        'Crea una cuenta gratis para guardar tus lugares favoritos.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ingresar', onPress: () => router.push('/(auth)/login') },
        ],
      );
      return;
    }
    void haptics.tap();
    toggleFavorite.mutate({
      slug,
      add: !isFavorite,
      meta: {
        name: place.name,
        category: place.category,
        categoryName: place.categoryName,
        stateName: place.stateName,
        image: place.image,
        description: place.description,
      },
    });
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="p-5">
          <ListSkeleton rows={1} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !place) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="p-5">
          <EmptyState
            icon="alert-circle-outline"
            title="Lugar no encontrado"
            subtitle="El enlace puede estar roto o el lugar fue removido."
            actionLabel="Reintentar"
            onAction={() => void refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const hero = imageUrl(place.image);
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero image */}
        <View className="aspect-[4/3] w-full bg-slate-800">
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

          {/* Back + favorite buttons */}
          <SafeAreaView
            edges={['top']}
            className="absolute inset-x-0 top-0 flex-row items-center justify-between px-2"
          >
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

            <MotionPressable
              onPress={onToggleFavorite}
              accessibilityLabel={
                isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'
              }
              accessibilityState={{ selected: isFavorite }}
              hapticOnPressIn={false}
              className="mr-2 mt-2 h-10 w-10 items-center justify-center rounded-full bg-black/50"
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? '#EF4444' : '#F8FAFC'}
              />
            </MotionPressable>
          </SafeAreaView>
        </View>

        <View className="-mt-10 px-5">
          <GlassCard intensity={70} className="p-5">
            <Text className="text-[11px] font-semibold uppercase tracking-wider text-emerald">
              {place.categoryName}
            </Text>
            <Text className="mt-1 text-3xl font-bold text-foreground">
              {place.name}
            </Text>
            <Text className="mt-1 text-sm text-foreground/70">
              {place.stateName}
              {place.address ? ` · ${place.address}` : ''}
            </Text>

            {place.badges.length > 0 && (
              <View className="mt-3 flex-row flex-wrap gap-1.5">
                {place.badges.map((b) => (
                  <View
                    key={b}
                    className="rounded-full bg-white/10 px-2.5 py-1"
                  >
                    <Text className="text-[11px] font-medium text-foreground/80">
                      {b}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </GlassCard>
        </View>

        {/* Description */}
        <View className="mt-4 px-5">
          <Text className="text-sm leading-6 text-foreground/80">
            {place.longDescription || place.description}
          </Text>
        </View>

        {/* Practical info */}
        {(place.openingHours || place.price || place.telephone) && (
          <View className="mt-4 px-5">
            <GlassCard intensity={60} className="p-4">
              {place.openingHours && (
                <InfoRow
                  icon="time-outline"
                  label="Horario"
                  value={place.openingHours}
                />
              )}
              {place.price && (
                <InfoRow
                  icon="cash-outline"
                  label="Entrada"
                  value={place.price}
                />
              )}
              {place.telephone && (
                <InfoRow
                  icon="call-outline"
                  label="Teléfono"
                  value={place.telephone}
                  onPress={() => void Linking.openURL(`tel:${place.telephone}`)}
                />
              )}
              {place.website && (
                <InfoRow
                  icon="globe-outline"
                  label="Sitio web"
                  value={place.website}
                  onPress={() => void Linking.openURL(place.website!)}
                />
              )}
            </GlassCard>
          </View>
        )}

        {/* Map */}
        <View className="mt-4 px-5">
          <StaticMap lat={place.lat} lng={place.lng} />
          <MotionPressable
            onPress={() => {
              void haptics.tap();
              void Linking.openURL(mapsLink);
            }}
            className="mt-3 flex-row items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-3"
          >
            <Ionicons name="navigate-outline" size={18} color="#06C167" />
            <Text className="text-sm font-semibold text-foreground">
              Abrir en Google Maps
            </Text>
          </MotionPressable>

          {/* Add-to-route — saves to AsyncStorage so /planear can pick it up. */}
          <MotionPressable
            onPress={() => {
              void onAddToRoute();
            }}
            accessibilityLabel="Agregar a ruta"
            className="mt-2 flex-row items-center justify-center gap-2 rounded-full bg-emerald-500/85 py-3"
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text className="text-sm font-semibold text-white">
              Agregar a ruta
            </Text>
          </MotionPressable>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const content = (
    <View className="flex-row items-center gap-3 py-2">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-white/5">
        <Ionicons name={icon} size={16} color="#06C167" />
      </View>
      <View className="flex-1">
        <Text className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
          {label}
        </Text>
        <Text className="text-sm text-foreground" numberOfLines={1}>
          {value}
        </Text>
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
      ) : null}
    </View>
  );
  if (onPress) {
    return (
      <MotionPressable onPress={onPress} hapticOnPressIn={false}>
        {content}
      </MotionPressable>
    );
  }
  return content;
}
