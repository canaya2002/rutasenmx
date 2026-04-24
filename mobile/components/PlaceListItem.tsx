import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from './MotionPressable';
import { imageUrl } from '@/lib/images';
import type { PlaceView } from '@shared/index';

const BLURHASH = 'L5H2EC=PM+yV0g-mq.wG9c010J}I';

interface Props {
  place: Pick<
    PlaceView,
    'slug' | 'name' | 'stateName' | 'categoryName' | 'image'
  >;
}

/** Compact horizontal row used in category lists + search results. */
export function PlaceListItem({ place }: Props) {
  const src = imageUrl(place.image);

  return (
    <Link href={`/lugar/${place.slug}`} asChild>
      <MotionPressable className="mb-3 flex-row items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 pr-3">
        <View className="h-16 w-16 overflow-hidden rounded-xl bg-slate-800">
          {src ? (
            <Image
              source={{ uri: src }}
              placeholder={BLURHASH}
              contentFit="cover"
              transition={200}
              style={{ width: '100%', height: '100%' }}
            />
          ) : null}
        </View>
        <View className="flex-1">
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-emerald">
            {place.categoryName}
          </Text>
          <Text
            className="mt-0.5 text-base font-semibold text-foreground"
            numberOfLines={1}
          >
            {place.name}
          </Text>
          <Text className="text-xs text-foreground/60" numberOfLines={1}>
            {place.stateName}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </MotionPressable>
    </Link>
  );
}
