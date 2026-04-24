import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { type ReactNode } from 'react';

import { haptics } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MotionPressableProps extends Omit<PressableProps, 'children'> {
  children: ReactNode;
  /** Adds a light haptic tap on press-in. Default true. */
  hapticOnPressIn?: boolean;
}

/**
 * Button-like pressable that scales 0.97 on press-in + fires a haptic.
 * Replacement for bare `<Pressable>` everywhere we want "feels alive" UX.
 *
 * Defaults `accessibilityRole="button"` and a reasonable hit-slop so tap
 * targets pass the 44×44 pt minimum Apple + Google require.
 */
export function MotionPressable({
  children,
  hapticOnPressIn = true,
  onPressIn,
  onPressOut,
  style,
  accessibilityRole,
  hitSlop,
  ...rest
}: MotionPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole={accessibilityRole ?? 'button'}
      hitSlop={hitSlop ?? 8}
      style={[animatedStyle, style]}
      onPressIn={(e) => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
        if (hapticOnPressIn) void haptics.tap();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        onPressOut?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
