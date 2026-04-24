import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface Props {
  /** Number of skeleton rows. */
  rows?: number;
  /** "card" = full-width photo-style skeleton; "row" = compact list row. */
  variant?: 'card' | 'row';
}

/**
 * Shimmer placeholder while a list is loading. Breathes opacity 0.4–0.8 so
 * the user sees the app is alive, not frozen.
 */
export function ListSkeleton({ rows = 4, variant = 'card' }: Props) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 800 }),
      -1,
      true,
    );
  }, [opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View>
      {Array.from({ length: rows }).map((_, i) => (
        <Animated.View
          key={i}
          style={animated}
          className={
            variant === 'card'
              ? 'mb-4 h-48 rounded-2xl border border-white/5 bg-white/5'
              : 'mb-3 h-20 rounded-2xl border border-white/5 bg-white/5'
          }
        />
      ))}
    </View>
  );
}
