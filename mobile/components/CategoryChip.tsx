import { Text, View } from 'react-native';

import { MotionPressable } from './MotionPressable';
import type { PlaceCategoryMeta } from '@shared/index';

interface Props {
  meta: PlaceCategoryMeta;
  selected?: boolean;
  onPress?: () => void;
}

/**
 * Glass chip used for category filters. When selected, fills solid with the
 * category accent color (matches the web explorar pill styling). Includes a
 * round emoji "puck" on the leading edge for stronger visual identity at
 * small sizes.
 */
export function CategoryChip({ meta, selected = false, onPress }: Props) {
  return (
    <MotionPressable
      onPress={onPress}
      hapticOnPressIn
      className="mr-2 flex-row items-center gap-1.5 rounded-full border px-3 py-2"
      style={{
        borderColor: selected ? 'transparent' : 'rgba(255,255,255,0.12)',
        backgroundColor: selected ? meta.color : 'rgba(255,255,255,0.06)',
        shadowColor: selected ? meta.color : 'transparent',
        shadowOpacity: selected ? 0.4 : 0,
        shadowRadius: selected ? 10 : 0,
        shadowOffset: { width: 0, height: 4 },
        elevation: selected ? 4 : 0,
      }}
    >
      <View
        className="h-5 w-5 items-center justify-center rounded-full"
        style={{
          backgroundColor: selected
            ? 'rgba(255,255,255,0.25)'
            : `${meta.color}22`,
        }}
      >
        <Text className="text-[12px]">{meta.emoji}</Text>
      </View>
      <Text
        className="text-xs font-semibold"
        style={{ color: selected ? '#FFFFFF' : '#E2E8F0' }}
      >
        {meta.name}
      </Text>
    </MotionPressable>
  );
}
