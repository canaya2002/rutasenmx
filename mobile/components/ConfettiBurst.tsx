import { useEffect } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const COLORS = [
  '#06C167', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#0EA5E9', // sky
  '#D97706', // oaxaca
];

interface ParticleProps {
  color: string;
  delay: number;
}

function Particle({ color, delay }: ParticleProps) {
  const ty = useSharedValue(-20);
  const tx = useSharedValue(0);
  const rot = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const drift = (Math.random() - 0.5) * SCREEN_W * 0.9;
    const spin = (Math.random() - 0.5) * 720;
    const fallDistance = SCREEN_H * 0.9;

    opacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withTiming(1, { duration: 1400 }),
      withTiming(0, { duration: 400 }),
    );
    ty.value = withTiming(fallDistance, {
      duration: 1800 + Math.random() * 800,
      easing: Easing.out(Easing.cubic),
    });
    tx.value = withTiming(drift, {
      duration: 1800 + Math.random() * 800,
      easing: Easing.out(Easing.quad),
    });
    rot.value = withTiming(spin, { duration: 1800 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rot.value}deg` },
    ],
  }));

  void delay; // reserved for future staggering

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: SCREEN_W / 2 - 4,
          width: 8,
          height: 14,
          borderRadius: 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

/**
 * Dependency-free confetti burst. Spawns N small colored rectangles at the
 * top-center, then animates them falling with slight drift and spin. Cheap
 * enough to run at 60fps on low-end Android.
 */
export function ConfettiBurst({ count = 80 }: { count?: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Particle
          key={i}
          color={COLORS[i % COLORS.length]}
          delay={(i * 6) % 500}
        />
      ))}
    </View>
  );
}
