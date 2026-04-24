import { Text } from 'react-native';

import { MotionPressable } from './MotionPressable';
import type { PlaceCategoryMeta } from '@shared/index';

interface Props {
  meta: PlaceCategoryMeta;
  selected?: boolean;
  onPress?: () => void;
}

/**
 * Glass chip used for category filters. When selected, fills with the
 * category's accent color at 20% so the brand stays visible.
 */
export function CategoryChip({ meta, selected = false, onPress }: Props) {
  return (
    <MotionPressable
      onPress={onPress}
      hapticOnPressIn
      className="mr-2 flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
      style={{
        borderColor: selected ? meta.color : 'rgba(255,255,255,0.1)',
        backgroundColor: selected ? `${meta.color}33` : 'rgba(255,255,255,0.05)',
      }}
    >
      <Text className="text-sm">{meta.emoji}</Text>
      <Text
        className="text-xs font-semibold"
        style={{ color: selected ? meta.color : '#E2E8F0' }}
      >
        {meta.name}
      </Text>
    </MotionPressable>
  );
}
