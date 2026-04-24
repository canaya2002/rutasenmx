import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from './MotionPressable';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Inline empty / error state used anywhere a list can come back empty.
 * Optionally surfaces a single action (e.g. "Reintentar").
 */
export function EmptyState({
  icon = 'map-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
}: Props) {
  return (
    <View className="items-center rounded-3xl border border-dashed border-white/15 bg-white/5 p-8">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-white/5">
        <Ionicons name={icon} size={26} color="#94A3B8" />
      </View>
      <Text className="mt-4 text-center text-base font-semibold text-foreground">
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-1 text-center text-sm text-foreground/60">
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <MotionPressable
          onPress={onAction}
          className="mt-4 rounded-full border border-white/15 bg-white/10 px-4 py-2"
        >
          <Text className="text-sm font-semibold text-foreground">
            {actionLabel}
          </Text>
        </MotionPressable>
      ) : null}
    </View>
  );
}
