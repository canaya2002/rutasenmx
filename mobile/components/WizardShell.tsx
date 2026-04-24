import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';

import { MotionPressable } from './MotionPressable';
import { GlassCard } from './GlassCard';

interface Props {
  title: string;
  subtitle?: string;
  step: number;
  totalSteps: number;
  onBack?: () => void;
  onPrev: () => void;
  onNext: () => void;
  nextLabel?: string;
  canGoNext: boolean;
  submitting?: boolean;
  error?: string | null;
  children: ReactNode;
}

/**
 * Shared frame for the Autopilot wizard:
 *   - Top bar with close + step title + step counter
 *   - Progress bar (segmented, tints filled for visited steps)
 *   - Scrollable content
 *   - Sticky footer with "Anterior" / "Siguiente" (last step = "Generar")
 *
 * The content slot owns its own layout — shell doesn't constrain it beyond
 * edge padding.
 */
export function WizardShell({
  title,
  subtitle,
  step,
  totalSteps,
  onBack,
  onPrev,
  onNext,
  nextLabel,
  canGoNext,
  submitting = false,
  error,
  children,
}: Props) {
  const isLast = step === totalSteps;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        {/* Top bar */}
        <View className="flex-row items-center gap-2 px-4 pt-1">
          {onBack ? (
            <MotionPressable
              onPress={onBack}
              accessibilityLabel="Cerrar"
              className="h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5"
            >
              <Ionicons name="close" size={18} color="#F8FAFC" />
            </MotionPressable>
          ) : (
            <View className="h-9 w-9" />
          )}
          <View className="flex-1 items-center">
            <Text
              className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60"
              accessibilityLabel={`Paso ${step} de ${totalSteps}`}
            >
              Paso {step} de {totalSteps}
            </Text>
          </View>
          <View className="h-9 w-9" />
        </View>

        {/* Progress bar */}
        <View
          className="mt-3 flex-row gap-1 px-4"
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: totalSteps, now: step }}
        >
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < step ? 'bg-emerald' : 'bg-white/10'
              }`}
            />
          ))}
        </View>

        {/* Scrollable body */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 20,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            className="text-3xl font-bold text-foreground"
            accessibilityRole="header"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-1 text-sm text-foreground/60">{subtitle}</Text>
          ) : null}
          <View className="mt-5">{children}</View>

          {error ? (
            <GlassCard
              intensity={60}
              className="mt-4 border-red-500/40 bg-red-500/10 p-3"
            >
              <Text
                className="text-sm text-red-200"
                accessibilityLiveRegion="assertive"
                accessibilityRole="alert"
              >
                {error}
              </Text>
            </GlassCard>
          ) : null}
        </ScrollView>

        {/* Sticky footer */}
        <View className="flex-row gap-2 border-t border-white/5 bg-background px-4 py-3">
          <MotionPressable
            onPress={onPrev}
            disabled={step === 1 || submitting}
            accessibilityLabel="Paso anterior"
            accessibilityState={{ disabled: step === 1 || submitting }}
            className="flex-1 items-center justify-center rounded-full border border-white/10 bg-white/5 py-3"
            style={{ opacity: step === 1 ? 0.4 : 1 }}
          >
            <Text className="text-sm font-semibold text-foreground/80">
              Anterior
            </Text>
          </MotionPressable>
          <MotionPressable
            onPress={onNext}
            disabled={!canGoNext || submitting}
            accessibilityLabel={
              nextLabel ?? (isLast ? 'Generar itinerario' : 'Siguiente paso')
            }
            accessibilityState={{
              disabled: !canGoNext || submitting,
              busy: submitting,
            }}
            className="flex-[2] items-center justify-center rounded-full bg-emerald py-3"
            style={{ opacity: canGoNext && !submitting ? 1 : 0.5 }}
          >
            {submitting ? (
              <ActivityIndicator color="#0A0F14" />
            ) : (
              <Text className="text-base font-bold text-background">
                {nextLabel ?? (isLast ? 'Generar' : 'Siguiente')}
              </Text>
            )}
          </MotionPressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
