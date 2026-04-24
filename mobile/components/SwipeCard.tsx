import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { Dimensions, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from './MotionPressable';
import { haptics } from '@/lib/haptics';
import { imageUrl } from '@/lib/images';
import {
  SOCIAL_INTENT_LABELS_ES,
  SOCIAL_INTENT_EMOJIS,
  type SocialProfileView,
} from '@shared/index';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.3;
const ROTATION_MAX = 12; // degrees at full drag

export interface SwipeCardHandle {
  swipeLeft: () => void;
  swipeRight: () => void;
}

interface Props {
  profile: SocialProfileView;
  onSwipe: (action: 'like' | 'pass') => void;
  onReport: () => void;
  /** Layer index: 0 = top card (interactive), 1+ = stacked behind (static). */
  stackIndex?: number;
}

/**
 * Swipe-to-match card. Top card owns the pan gesture; cards behind it render
 * as scaled-down / translated-down placeholders so the stack looks like a
 * deck. Respect:
 *   - Haptics on cross the threshold line for the first time per drag.
 *   - Rotation + LIKE/PASS overlay opacity interpolated from drag x.
 *   - Spring-back animation if the drag didn't cross the threshold.
 *   - Fly-off animation to the right/left on commit; onSwipe fires at the end.
 *   - Imperative `swipeLeft/swipeRight()` so the ♥ / × buttons share the path.
 */
export const SwipeCard = forwardRef<SwipeCardHandle, Props>(function SwipeCard(
  { profile, onSwipe, onReport, stackIndex = 0 },
  ref,
) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // When this card is NOT on top, render it scaled down behind the top card.
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
  }, [profile.userId, translateX, translateY]);

  // Commit = fly off screen and then notify parent.
  function commit(action: 'like' | 'pass') {
    void haptics.success();
    const toX = action === 'like' ? SCREEN_W * 1.5 : -SCREEN_W * 1.5;
    translateX.value = withTiming(toX, { duration: 220 }, (finished) => {
      if (finished) runOnJS(onSwipe)(action);
    });
  }

  function snapBack() {
    translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
    translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
  }

  useImperativeHandle(ref, () => ({
    swipeLeft: () => commit('pass'),
    swipeRight: () => commit('like'),
  }));

  const pan = Gesture.Pan()
    .enabled(stackIndex === 0)
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = startX.value + e.translationX;
      translateY.value = startY.value + e.translationY * 0.3;
    })
    .onEnd(() => {
      if (translateX.value > SWIPE_THRESHOLD) {
        runOnJS(commit)('like');
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        runOnJS(commit)('pass');
      } else {
        runOnJS(snapBack)();
      }
    });

  const animated = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_W / 2, 0, SCREEN_W / 2],
      [-ROTATION_MAX, 0, ROTATION_MAX],
      Extrapolation.CLAMP,
    );
    // Stacked cards scale down + translate down so they peek behind the top.
    const stackOffset = stackIndex * 8;
    const stackScale = 1 - stackIndex * 0.04;
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + stackOffset },
        { rotate: `${rotate}deg` },
        { scale: stackScale },
      ],
      opacity: stackIndex > 1 ? 0 : 1,
    };
  });

  const likeBadge = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SCREEN_W * 0.25],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const passBadge = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SCREEN_W * 0.25, 0],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const photo = imageUrl(profile.photoUrl);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          },
          animated,
        ]}
        pointerEvents={stackIndex === 0 ? 'auto' : 'none'}
      >
        <View className="flex-1 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          {/* Photo */}
          <View className="flex-1 bg-slate-800">
            {photo ? (
              <Image
                source={{ uri: photo }}
                contentFit="cover"
                transition={200}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-6xl font-bold text-emerald/40">
                  {profile.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {/* Bottom gradient scrim for legibility */}
            <View
              className="absolute inset-x-0 bottom-0 h-2/3"
              style={{
                backgroundColor: 'transparent',
                // Simple linear gradient via overlapping views (no deps)
              }}
            >
              <View className="absolute inset-0 bg-black/50" />
            </View>

            {/* Report button */}
            <MotionPressable
              onPress={onReport}
              hapticOnPressIn
              className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-black/40"
            >
              <Ionicons name="flag-outline" size={16} color="#F8FAFC" />
            </MotionPressable>

            {/* LIKE / PASS overlays */}
            <Animated.View
              pointerEvents="none"
              style={likeBadge}
              className="absolute left-5 top-6 rounded-2xl border-4 border-emerald px-4 py-1"
            >
              <Text
                className="text-3xl font-extrabold tracking-widest text-emerald"
              >
                LIKE
              </Text>
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={passBadge}
              className="absolute right-5 top-6 rounded-2xl border-4 border-red-500 px-4 py-1"
            >
              <Text className="text-3xl font-extrabold tracking-widest text-red-500">
                NOPE
              </Text>
            </Animated.View>

            {/* Info overlay */}
            <View className="absolute inset-x-0 bottom-0 p-5">
              <View className="flex-row items-baseline gap-2">
                <Text className="text-3xl font-extrabold text-white drop-shadow-lg">
                  {profile.displayName}
                </Text>
                {profile.age != null && (
                  <Text className="text-2xl text-white/90">
                    · {profile.age}
                  </Text>
                )}
              </View>
              {profile.destinoEstadoName && (
                <View className="mt-1 flex-row items-center gap-1">
                  <Ionicons name="location" size={14} color="#E5E7EB" />
                  <Text className="text-sm text-white/90">
                    Va a {profile.destinoEstadoName}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Lower body */}
          <View className="gap-2 bg-background/95 p-4">
            {profile.intent ? (
              <View className="flex-row items-center gap-1.5 self-start rounded-full bg-emerald/20 px-3 py-1">
                <Text className="text-sm">
                  {SOCIAL_INTENT_EMOJIS[profile.intent]}
                </Text>
                <Text className="text-xs font-semibold text-emerald">
                  {SOCIAL_INTENT_LABELS_ES[profile.intent]}
                </Text>
              </View>
            ) : null}
            {profile.bio ? (
              <Text className="text-sm leading-5 text-foreground/80" numberOfLines={3}>
                {profile.bio}
              </Text>
            ) : null}
            {profile.interests.length > 0 ? (
              <View className="mt-1 flex-row flex-wrap gap-1">
                {profile.interests.slice(0, 6).map((tag) => (
                  <View
                    key={tag}
                    className="rounded-full bg-white/10 px-2 py-0.5"
                  >
                    <Text className="text-[10px] font-medium text-foreground/80">
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
});
