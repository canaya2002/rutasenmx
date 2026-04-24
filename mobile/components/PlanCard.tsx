import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from './MotionPressable';
import type { IAPPackage } from '@/lib/iap';
import type { PlanSlug } from '@shared/index';

const PLAN_NAMES: Record<PlanSlug, string> = {
  free: 'Gratis',
  pro: 'Pro',
  premium: 'Premium',
};

const PLAN_TAGS: Record<PlanSlug, string> = {
  free: 'Empieza aquí',
  pro: 'Más popular',
  premium: 'Sin límites',
};

const INTERVAL_LABELS: Record<IAPPackage['interval'], string> = {
  monthly: '/ mes',
  annual: '/ año',
  one_time: '',
};

interface Props {
  pkg: IAPPackage;
  features: string[];
  recommended?: boolean;
  disabled?: boolean;
  ctaLabel: string;
  onPurchase: () => void;
}

/**
 * Single-plan card in the paywall. The recommended variant gets an emerald
 * outline + "Más popular" badge so the eye lands on it first.
 */
export function PlanCard({
  pkg,
  features,
  recommended = false,
  disabled = false,
  ctaLabel,
  onPurchase,
}: Props) {
  const planName = pkg.planSlug ? PLAN_NAMES[pkg.planSlug] : pkg.productId;

  return (
    <View
      className={`mb-3 overflow-hidden rounded-3xl border p-5 ${
        recommended
          ? 'border-emerald bg-emerald/10'
          : 'border-white/10 bg-white/5'
      }`}
    >
      {recommended ? (
        <View className="mb-2 self-start rounded-full bg-emerald px-2.5 py-0.5">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-background">
            {PLAN_TAGS[pkg.planSlug ?? 'pro']}
          </Text>
        </View>
      ) : null}

      <View className="flex-row items-baseline gap-1">
        <Text className="text-2xl font-extrabold text-foreground">
          {planName}
        </Text>
        <Text className="text-xs uppercase tracking-wider text-foreground/60">
          · {pkg.interval === 'monthly' ? 'Mensual' : pkg.interval === 'annual' ? 'Anual' : ''}
        </Text>
      </View>

      <View className="mt-2 flex-row items-baseline gap-1">
        <Text className="text-3xl font-extrabold text-foreground">
          {pkg.priceString}
        </Text>
        <Text className="text-xs text-foreground/70">
          {INTERVAL_LABELS[pkg.interval]}
        </Text>
      </View>

      <View className="mt-4 gap-1.5">
        {features.map((f) => (
          <View key={f} className="flex-row items-start gap-2">
            <Ionicons
              name="checkmark-circle"
              size={14}
              color="#06C167"
              style={{ marginTop: 2 }}
            />
            <Text className="flex-1 text-xs text-foreground/85">{f}</Text>
          </View>
        ))}
      </View>

      <MotionPressable
        onPress={onPurchase}
        disabled={disabled}
        className={`mt-5 items-center justify-center rounded-full py-3 ${
          recommended ? 'bg-emerald' : 'border border-white/10 bg-white/5'
        }`}
        style={{ opacity: disabled ? 0.4 : 1 }}
      >
        <Text
          className={`text-sm font-bold ${
            recommended ? 'text-background' : 'text-foreground'
          }`}
        >
          {ctaLabel}
        </Text>
      </MotionPressable>
    </View>
  );
}
