import { View, Text } from 'react-native';
import { Image } from 'expo-image';

import { imageUrl } from '@/lib/images';

interface Props {
  uri: string | null | undefined;
  name: string;
  size?: number;
  /** Tailwind class for background tint of the fallback. */
  tintClass?: string;
}

/**
 * Circular avatar with graceful fallback to a monogram. Used across every
 * social surface so a single place controls how avatars look on mobile.
 */
export function Avatar({
  uri,
  name,
  size = 40,
  tintClass = 'bg-emerald/20',
}: Props) {
  const resolved = imageUrl(uri ?? undefined);
  const letter = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View
      className={`items-center justify-center overflow-hidden rounded-full ${tintClass}`}
      style={{ width: size, height: size }}
    >
      {resolved ? (
        <Image
          source={{ uri: resolved }}
          contentFit="cover"
          transition={150}
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <Text
          className="font-bold text-emerald"
          style={{ fontSize: size * 0.42 }}
        >
          {letter}
        </Text>
      )}
    </View>
  );
}
