import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';

import { MotionPressable } from './MotionPressable';
import { imageUrl } from '@/lib/images';
import type { PlaceView } from '@shared/index';

const BLURHASH =
  'L5H2EC=PM+yV0g-mq.wG9c010J}I'; // generic warm-travel placeholder

interface Props {
  place: Pick<
    PlaceView,
    'slug' | 'name' | 'stateName' | 'categoryName' | 'image' | 'badges'
  >;
  /** Compact variant used inside horizontal rails. */
  variant?: 'default' | 'compact';
}

export function PlaceCard({ place, variant = 'default' }: Props) {
  const src = imageUrl(place.image);
  const isCompact = variant === 'compact';

  return (
    <Link href={`/lugar/${place.slug}`} asChild>
      <MotionPressable
        className={
          isCompact
            ? 'mr-3 w-44 overflow-hidden rounded-2xl border border-white/10 bg-white/5'
            : 'mb-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5'
        }
      >
        <View
          className={
            isCompact
              ? 'aspect-[4/5] w-full bg-slate-800'
              : 'aspect-[4/3] w-full bg-slate-800'
          }
        >
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
        <View className="p-3">
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-emerald">
            {place.categoryName}
          </Text>
          <Text
            className={
              isCompact
                ? 'mt-1 text-sm font-bold text-foreground'
                : 'mt-1 text-lg font-bold text-foreground'
            }
            numberOfLines={isCompact ? 1 : 2}
          >
            {place.name}
          </Text>
          <Text className="mt-0.5 text-xs text-foreground/60">
            {place.stateName}
          </Text>
        </View>
      </MotionPressable>
    </Link>
  );
}
