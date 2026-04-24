import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from './MotionPressable';
import { imageUrl } from '@/lib/images';
import type { RouteSummary } from '@shared/index';

const BLURHASH = 'L5H2EC=PM+yV0g-mq.wG9c010J}I';

const DIFFICULTY_STYLE: Record<
  RouteSummary['difficulty'],
  { label: string; color: string }
> = {
  facil: { label: 'Fácil', color: '#06C167' },
  moderada: { label: 'Moderada', color: '#F59E0B' },
  avanzada: { label: 'Avanzada', color: '#EF4444' },
};

interface Props {
  route: RouteSummary;
}

export function RouteCard({ route }: Props) {
  const src = imageUrl(route.image);
  const diff = DIFFICULTY_STYLE[route.difficulty];

  return (
    <Link href={`/ruta/${route.slug}`} asChild>
      <MotionPressable className="mb-4 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <View className="aspect-[16/10] w-full bg-slate-800">
          {src ? (
            <Image
              source={{ uri: src }}
              placeholder={BLURHASH}
              contentFit="cover"
              transition={200}
              style={{ width: '100%', height: '100%' }}
            />
          ) : null}
          <View
            className="absolute right-3 top-3 rounded-full px-2.5 py-1"
            style={{ backgroundColor: `${diff.color}CC` }}
          >
            <Text className="text-[10px] font-bold uppercase tracking-wider text-white">
              {diff.label}
            </Text>
          </View>
        </View>

        <View className="p-4">
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-emerald">
            {route.origin} → {route.destination}
          </Text>
          <Text className="mt-1 text-xl font-bold text-foreground" numberOfLines={2}>
            {route.name}
          </Text>
          <Text className="mt-1 text-sm text-foreground/70" numberOfLines={2}>
            {route.description}
          </Text>

          <View className="mt-3 flex-row gap-4">
            <Stat icon="car-outline" value={`${route.distanceKm} km`} />
            <Stat icon="time-outline" value={`${route.drivingHours}h`} />
            <Stat icon="calendar-outline" value={`${route.durationDays}d`} />
          </View>
        </View>
      </MotionPressable>
    </Link>
  );
}

function Stat({
  icon,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name={icon} size={14} color="#94A3B8" />
      <Text className="text-xs text-foreground/70">{value}</Text>
    </View>
  );
}
