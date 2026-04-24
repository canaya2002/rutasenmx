import { BlurView } from 'expo-blur';
import { View, type ViewProps, Platform } from 'react-native';
import { type ReactNode } from 'react';

interface GlassCardProps extends ViewProps {
  children: ReactNode;
  /** BlurView intensity 0–100. Default 70 matches the web's backdrop-blur feel. */
  intensity?: number;
  /** Tint of the glass. `dark` suits our default theme. */
  tint?: 'light' | 'dark' | 'default';
  className?: string;
}

/**
 * Reusable glassmorphic surface. Combines BlurView with a subtle white ring
 * and rounded corners. On Android < 12 BlurView falls back to a translucent
 * solid; the ring + corner radius keep the visual consistent.
 */
export function GlassCard({
  children,
  intensity = 70,
  tint = 'dark',
  className,
  style,
  ...rest
}: GlassCardProps) {
  const content = (
    <View
      className={`overflow-hidden rounded-3xl border border-white/10 ${className ?? ''}`}
      style={style}
      {...rest}
    >
      {children}
    </View>
  );

  // BlurView on web is a no-op; render plain translucent div.
  if (Platform.OS === 'web') {
    return (
      <View
        className={`overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl ${className ?? ''}`}
        style={style}
        {...rest}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      className={`overflow-hidden rounded-3xl border border-white/10 ${className ?? ''}`}
      style={style}
    >
      {children}
    </BlurView>
  );
}
