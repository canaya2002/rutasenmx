import { useEffect } from 'react';
import { Modal, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from './MotionPressable';
import { Avatar } from './Avatar';
import { ConfettiBurst } from './ConfettiBurst';
import { haptics } from '@/lib/haptics';
import type { SocialProfileView } from '@shared/index';

interface Props {
  visible: boolean;
  other: SocialProfileView | null;
  matchId: string | null;
  onClose: () => void;
}

/**
 * Full-screen celebration modal fired after a reciprocated like. Renders the
 * confetti layer + two avatars + two CTAs. Triggers a success haptic on open.
 */
export function MatchModal({ visible, other, matchId, onClose }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (visible) void haptics.success();
  }, [visible]);

  if (!other) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/85 px-6">
        <ConfettiBurst count={90} />

        <View className="items-center">
          <Text className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald">
            ✨ Match ✨
          </Text>
          <Text className="mt-3 text-center text-4xl font-extrabold text-white">
            ¡Conectaste con{'\n'}
            {other.displayName}!
          </Text>
          <Text className="mt-3 text-center text-sm text-white/70">
            Ambos se dieron like. Rompe el hielo.
          </Text>

          <View className="mt-8 flex-row items-center gap-3">
            <Avatar uri={other.photoUrl} name={other.displayName} size={110} />
          </View>

          <View className="mt-10 w-full gap-3">
            <MotionPressable
              onPress={() => {
                void haptics.tap();
                onClose();
                if (matchId) router.push(`/conectar/chat/${matchId}`);
              }}
              className="flex-row items-center justify-center gap-2 rounded-full bg-emerald py-4"
            >
              <Ionicons name="chatbubble" size={16} color="#0A0F14" />
              <Text className="text-base font-bold text-background">
                Escribir mensaje
              </Text>
            </MotionPressable>
            <MotionPressable
              onPress={() => {
                void haptics.tap();
                onClose();
              }}
              hapticOnPressIn={false}
              className="items-center justify-center rounded-full border border-white/20 py-4"
            >
              <Text className="text-sm font-semibold text-white">
                Seguir descubriendo
              </Text>
            </MotionPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
