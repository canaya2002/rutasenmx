import { useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from '@/components/MotionPressable';
import { GlassCard } from '@/components/GlassCard';
import { PlanCard } from '@/components/PlanCard';
import { EmptyState } from '@/components/EmptyState';
import { useOfferings, usePurchase, useRestorePurchases } from '@/hooks/useIAP';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useIAPContext } from '@/providers/IAPProvider';
import { haptics } from '@/lib/haptics';
import type { IAPPackage } from '@/lib/iap';
import type { PlanSlug } from '@shared/index';

/**
 * Paywall / subscription-management screen.
 *
 *   - Free user with IAP available → shows offerings from RevenueCat.
 *   - Already subscribed via IAP → shows current plan + manage link to
 *     App Store / Google Play native subscription settings.
 *   - Already subscribed via Stripe web → shows a "Manage on rutasenmx.com"
 *     message + disables all purchase buttons (anti-double-billing).
 *   - Native module unavailable (Expo Go) → friendly message, not a crash.
 */
const PLAN_FEATURES: Record<PlanSlug, string[]> = {
  free: [
    'Hasta 1 viaje guardado',
    '7 paradas por viaje',
    'PDF con marca de agua',
  ],
  pro: [
    '10 viajes guardados',
    '50 paradas por viaje',
    'IA Autopilot (3 por mes)',
    'Exportación sin marca de agua',
    'Sin anuncios',
    'Conectar con viajeros',
    'Colaboración en viajes',
  ],
  premium: [
    'Viajes ilimitados',
    '150 paradas por viaje',
    'IA Autopilot (15 por mes)',
    'Modo offline en carretera',
    'Todo lo de Pro',
  ],
};

export default function SuscripcionScreen() {
  const router = useRouter();
  const { available } = useIAPContext();
  const offerings = useOfferings();
  const entitlements = useEntitlements();
  const purchase = usePurchase();
  const restore = useRestorePurchases();
  const [busyPkg, setBusyPkg] = useState<string | null>(null);

  const activePlan = entitlements.data?.plan ?? 'free';
  const activeSource = entitlements.data?.activeSource ?? 'none';
  const canUpgradeInApp = entitlements.data?.canUpgradeInApp ?? true;

  const groupedByPlan = useMemo(() => {
    const groups: Record<'pro' | 'premium', IAPPackage[]> = {
      pro: [],
      premium: [],
    };
    for (const pkg of offerings.data?.packages ?? []) {
      if (pkg.planSlug === 'pro') groups.pro.push(pkg);
      else if (pkg.planSlug === 'premium') groups.premium.push(pkg);
    }
    // Prefer annual on top (higher anchor price).
    for (const key of ['pro', 'premium'] as const) {
      groups[key].sort((a, b) => {
        if (a.interval === b.interval) return 0;
        if (a.interval === 'annual') return -1;
        return 1;
      });
    }
    return groups;
  }, [offerings.data]);

  async function onPurchase(pkg: IAPPackage) {
    if (!canUpgradeInApp) {
      Alert.alert(
        'Ya tienes una suscripción',
        entitlements.data?.message ??
          'Administras tu plan desde otra plataforma.',
      );
      return;
    }
    setBusyPkg(pkg.identifier);
    try {
      const result = await purchase.mutateAsync({
        packageId: pkg.identifier,
        planSlug: pkg.planSlug,
      });
      if (result.kind === 'success') {
        void haptics.success();
        Alert.alert(
          '¡Gracias!',
          'Tu suscripción está activa. Puede tardar unos segundos en reflejarse.',
        );
      } else if (result.kind === 'cancelled') {
        // Silent — user chose to cancel.
      } else if (result.kind === 'unavailable') {
        Alert.alert(
          'Compras no disponibles',
          'Las compras en la app requieren una versión instalada desde App Store o Google Play.',
        );
      } else {
        void haptics.error();
        Alert.alert('No se pudo completar', result.message);
      }
    } finally {
      setBusyPkg(null);
    }
  }

  async function onRestore() {
    void haptics.tap();
    try {
      const snap = await restore.mutateAsync();
      if (snap?.restoredPlan) {
        Alert.alert(
          'Suscripción restaurada',
          `Plan ${snap.restoredPlan} activo.`,
        );
      } else {
        Alert.alert(
          'Nada que restaurar',
          'No encontramos compras previas en esta cuenta de App Store / Google Play.',
        );
      }
    } catch {
      Alert.alert('Error', 'No pudimos restaurar las compras.');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center gap-2 px-5 pb-2 pt-1">
        <MotionPressable
          onPress={() => {
            void haptics.tap();
            router.back();
          }}
          accessibilityLabel="Cerrar"
          className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
        >
          <Ionicons name="close" size={18} color="#F8FAFC" />
        </MotionPressable>
        <Text className="flex-1 text-xl font-bold text-foreground">
          Suscripción
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
      >
        {/* Current plan card */}
        <GlassCard intensity={60} className="mb-5 p-4">
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60">
            Plan actual
          </Text>
          <Text className="mt-1 text-2xl font-extrabold capitalize text-foreground">
            {activePlan}
          </Text>
          {activeSource !== 'none' && (
            <Text className="mt-0.5 text-xs text-foreground/70">
              Administrado desde{' '}
              {activeSource === 'stripe_web'
                ? 'rutasenmx.com'
                : activeSource === 'apple_iap'
                  ? 'App Store'
                  : 'Google Play'}
            </Text>
          )}
          {entitlements.data?.message ? (
            <Text className="mt-2 text-xs text-foreground/60">
              {entitlements.data.message}
            </Text>
          ) : null}
        </GlassCard>

        {/* Cross-platform lock banner */}
        {!canUpgradeInApp && activeSource === 'stripe_web' ? (
          <GlassCard
            intensity={60}
            className="mb-5 border-amber-500/30 bg-amber-500/10 p-4"
          >
            <View className="flex-row items-start gap-2">
              <Ionicons
                name="shield-checkmark"
                size={16}
                color="#F59E0B"
                style={{ marginTop: 1 }}
              />
              <View className="flex-1">
                <Text className="text-sm font-bold text-amber-200">
                  Protección anti-doble-cobro
                </Text>
                <Text className="mt-0.5 text-xs text-amber-100">
                  Tu suscripción actual se gestiona en rutasenmx.com. No
                  dejamos que se te cobre otra vez por la app móvil. Si quieres
                  cambiarte a IAP, cancela primero en la web.
                </Text>
              </View>
            </View>
          </GlassCard>
        ) : null}

        {/* Unavailability */}
        {!available ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Compras no disponibles aquí"
            subtitle="Para suscribirte desde la app necesitas la versión oficial instalada desde App Store o Google Play. En Expo Go no podemos procesar pagos."
          />
        ) : offerings.isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator color="#06C167" />
            <Text className="mt-3 text-xs text-foreground/60">
              Cargando planes…
            </Text>
          </View>
        ) : !offerings.data || offerings.data.packages.length === 0 ? (
          <EmptyState
            icon="pricetag-outline"
            title="Sin planes disponibles"
            subtitle="Estamos configurando los productos. Vuelve en unos minutos."
          />
        ) : (
          <>
            {/* Pro group */}
            {groupedByPlan.pro.length > 0 ? (
              <View className="mb-3">
                <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                  Pro
                </Text>
                {groupedByPlan.pro.map((pkg, i) => (
                  <PlanCard
                    key={pkg.identifier}
                    pkg={pkg}
                    features={PLAN_FEATURES.pro}
                    recommended={i === 0}
                    disabled={
                      !canUpgradeInApp ||
                      busyPkg !== null ||
                      activePlan === 'pro' ||
                      activePlan === 'premium'
                    }
                    ctaLabel={
                      busyPkg === pkg.identifier
                        ? 'Procesando…'
                        : activePlan === 'pro' || activePlan === 'premium'
                          ? 'Ya incluido'
                          : 'Suscribirme'
                    }
                    onPurchase={() => void onPurchase(pkg)}
                  />
                ))}
              </View>
            ) : null}

            {/* Premium group */}
            {groupedByPlan.premium.length > 0 ? (
              <View>
                <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                  Premium
                </Text>
                {groupedByPlan.premium.map((pkg, i) => (
                  <PlanCard
                    key={pkg.identifier}
                    pkg={pkg}
                    features={PLAN_FEATURES.premium}
                    recommended={i === 0}
                    disabled={
                      !canUpgradeInApp ||
                      busyPkg !== null ||
                      activePlan === 'premium'
                    }
                    ctaLabel={
                      busyPkg === pkg.identifier
                        ? 'Procesando…'
                        : activePlan === 'premium'
                          ? 'Plan actual'
                          : 'Suscribirme'
                    }
                    onPurchase={() => void onPurchase(pkg)}
                  />
                ))}
              </View>
            ) : null}
          </>
        )}

        {/* Restore purchases */}
        <MotionPressable
          onPress={() => void onRestore()}
          disabled={restore.isPending || !available}
          hapticOnPressIn={false}
          className="mt-4 items-center py-3"
        >
          <Text className="text-xs font-semibold text-foreground/70 underline">
            {restore.isPending
              ? 'Restaurando…'
              : 'Restaurar compras'}
          </Text>
        </MotionPressable>

        <Text className="mt-3 text-center text-[10px] leading-4 text-foreground/50">
          Al suscribirte aceptas nuestros Términos. Las suscripciones se
          renuevan automáticamente hasta que las canceles desde los ajustes de
          tu tienda de apps al menos 24h antes del siguiente período.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
