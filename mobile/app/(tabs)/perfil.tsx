import { ScrollView, Text, View, ActivityIndicator, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { GlassCard } from '@/components/GlassCard';
import { MotionPressable } from '@/components/MotionPressable';
import { useAuth } from '@/providers/AuthProvider';
import { haptics } from '@/lib/haptics';
import { useEntitlements } from '@/hooks/useEntitlements';
import { APP_URL } from '@shared/index';

const SOURCE_LABELS: Record<string, string> = {
  stripe_web: 'Web (Stripe)',
  apple_iap: 'App Store',
  google_iap: 'Google Play',
  none: '—',
};

export default function PerfilScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: entitlements, isLoading: entLoading } = useEntitlements();

  function confirmLogout() {
    Alert.alert(
      'Cerrar sesión',
      '¿Seguro que quieres salir de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            void haptics.select();
            await logout();
          },
        },
      ],
      { cancelable: true },
    );
  }

  function confirmDeleteAccount() {
    // App Store Guideline 5.1.1(v) requires in-app account deletion for any
    // app that creates accounts. The actual delete lives on the web until
    // we build /api/account/delete — see pending/ for why this is a link.
    Alert.alert(
      'Eliminar cuenta',
      'La eliminación de cuenta se procesa desde rutasenmx.com/perfil para poder confirmar tu identidad. Se borrarán tus viajes, perfil social y suscripción activa.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Abrir en web',
          onPress: () => void Linking.openURL(`${APP_URL}/perfil?delete=1`),
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text className="mt-4 text-3xl font-bold text-foreground">Perfil</Text>

        <GlassCard intensity={70} className="mt-6 p-5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
            Usuario
          </Text>
          <Text className="mt-1 text-lg font-bold text-foreground">
            {user?.name ?? '—'}
          </Text>
          <Text className="mt-0.5 text-sm text-foreground/60">
            {user?.email ?? '—'}
          </Text>
        </GlassCard>

        <GlassCard intensity={70} className="mt-4 p-5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
            Plan
          </Text>

          {entLoading ? (
            <View className="mt-2">
              <ActivityIndicator color="#06C167" />
            </View>
          ) : entitlements ? (
            <>
              <Text className="mt-1 text-2xl font-bold capitalize text-foreground">
                {entitlements.plan}
              </Text>
              <Text className="mt-0.5 text-xs text-foreground/60">
                Administrado desde: {SOURCE_LABELS[entitlements.activeSource] ?? entitlements.activeSource}
              </Text>
              {entitlements.expiresAt && (
                <Text className="mt-0.5 text-xs text-foreground/60">
                  Renueva el{' '}
                  {new Date(entitlements.expiresAt).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              )}
              {entitlements.message && (
                <Text className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-xs text-foreground/70">
                  {entitlements.message}
                </Text>
              )}
            </>
          ) : (
            <Text className="mt-1 text-2xl font-bold capitalize text-foreground">
              {user?.plan ?? 'free'}
            </Text>
          )}
        </GlassCard>

        {/* Mis viajes quick link */}
        <GlassCard intensity={70} className="mt-4">
          <MotionPressable
            onPress={() => {
              void haptics.tap();
              router.push('/mis-viajes');
            }}
            accessibilityLabel="Mis viajes"
            className="flex-row items-center gap-3 p-5"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald/20">
              <Ionicons name="map-outline" size={20} color="#06C167" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">
                Mis viajes
              </Text>
              <Text className="text-xs text-foreground/60">
                Itinerarios guardados y exportaciones
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </MotionPressable>
        </GlassCard>

        {/* Favoritos */}
        <GlassCard intensity={70} className="mt-4">
          <MotionPressable
            onPress={() => {
              void haptics.tap();
              router.push('/favoritos');
            }}
            accessibilityLabel="Mis favoritos"
            className="flex-row items-center gap-3 p-5"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
              <Ionicons name="heart-outline" size={20} color="#EF4444" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">
                Favoritos
              </Text>
              <Text className="text-xs text-foreground/60">
                Lugares que guardaste
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </MotionPressable>
        </GlassCard>

        {/* Paywall / planes link — hidden when the plan can't be changed from the app */}
        {entitlements?.activeSource !== 'stripe_web' && (
          <GlassCard intensity={70} className="mt-4">
            <MotionPressable
              onPress={() => {
                void haptics.tap();
                router.push('/suscripcion');
              }}
              className="flex-row items-center gap-3 p-5"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald/20">
                <Ionicons name="sparkles-outline" size={20} color="#06C167" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground">
                  {entitlements?.plan === 'premium'
                    ? 'Ver mi plan Premium'
                    : entitlements?.plan === 'pro'
                      ? 'Mejorar a Premium'
                      : 'Ver planes'}
                </Text>
                <Text className="text-xs text-foreground/60">
                  Pro, Premium y beneficios
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </MotionPressable>
          </GlassCard>
        )}

        {entitlements?.activeSource === 'stripe_web' && (
          <GlassCard intensity={70} className="mt-4 p-5">
            <Text className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
              Gestionar suscripción
            </Text>
            <Text className="mt-2 text-sm text-foreground/70">
              Tu suscripción se administra en rutasenmx.com para evitar cargos
              duplicados entre plataformas.
            </Text>
            <MotionPressable
              onPress={() => {
                void haptics.tap();
                void Linking.openURL(`${APP_URL}/suscripcion`);
              }}
              className="mt-4 items-center justify-center rounded-full bg-white/10 py-3"
            >
              <Text className="text-sm font-semibold text-foreground">
                Abrir rutasenmx.com
              </Text>
            </MotionPressable>
          </GlassCard>
        )}

        {/* Ayuda / soporte / legal */}
        <GlassCard intensity={70} className="mt-4">
          <MotionPressable
            onPress={() => {
              void haptics.tap();
              void Linking.openURL(`${APP_URL}/ayuda`);
            }}
            accessibilityLabel="Ayuda y soporte"
            accessibilityHint="Abre la página de ayuda en rutasenmx.com"
            className="flex-row items-center gap-3 p-5"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white/5">
              <Ionicons name="help-circle-outline" size={20} color="#94A3B8" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">Ayuda</Text>
              <Text className="text-xs text-foreground/60">
                Preguntas frecuentes y contacto
              </Text>
            </View>
            <Ionicons name="open-outline" size={16} color="#94A3B8" />
          </MotionPressable>
        </GlassCard>

        <View className="mt-3 flex-row items-center justify-center gap-4">
          <Text
            className="text-xs text-foreground/60 underline"
            onPress={() => void Linking.openURL(`${APP_URL}/terminos`)}
            accessibilityRole="link"
          >
            Términos
          </Text>
          <View className="h-1 w-1 rounded-full bg-foreground/30" />
          <Text
            className="text-xs text-foreground/60 underline"
            onPress={() => void Linking.openURL(`${APP_URL}/privacidad`)}
            accessibilityRole="link"
          >
            Privacidad
          </Text>
          <View className="h-1 w-1 rounded-full bg-foreground/30" />
          <Text
            className="text-xs text-red-300/80 underline"
            onPress={confirmDeleteAccount}
            accessibilityRole="button"
            accessibilityLabel="Eliminar cuenta"
          >
            Eliminar cuenta
          </Text>
        </View>

        <View className="mt-6">
          <MotionPressable
            onPress={confirmLogout}
            accessibilityLabel="Cerrar sesión"
            className="items-center justify-center rounded-full border border-white/10 bg-white/5 py-3"
          >
            <Text className="text-sm font-semibold text-foreground/80">
              Cerrar sesión
            </Text>
          </MotionPressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
