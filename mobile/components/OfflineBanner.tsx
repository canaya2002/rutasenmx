import { useEffect, useState } from 'react';
import { Text, View, Platform } from 'react-native';
import { onlineManager } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

/**
 * Thin bar that appears at the top when TanStack Query considers the device
 * offline. We don't drive it from `expo-network` directly — `QueryProvider`
 * already bridges network state into `onlineManager`, and driving this
 * banner from the same source avoids the two-sources-of-truth problem where
 * the UI says "offline" while queries still try to fire.
 *
 * Hidden on web (there's no offline-mobile-launch scenario for the web build).
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(() => onlineManager.isOnline());

  useEffect(() => {
    return onlineManager.subscribe((next) => setOnline(next));
  }, []);

  if (Platform.OS === 'web') return null;
  if (online) return null;

  return (
    <View
      className="flex-row items-center gap-2 bg-amber-500/90 px-4 py-1.5"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Ionicons name="cloud-offline" size={14} color="#0A0F14" />
      <Text className="flex-1 text-xs font-semibold text-background">
        Sin conexión — mostrando datos guardados
      </Text>
    </View>
  );
}
