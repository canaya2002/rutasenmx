import { useState } from 'react';
import {
  Text,
  TextInput,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/providers/AuthProvider';
import { MotionPressable } from '@/components/MotionPressable';
import { GlassCard } from '@/components/GlassCard';
import { haptics } from '@/lib/haptics';
import { ApiError } from '@/lib/api';
import {
  registerSchema,
  isWeakPassword,
  PASSWORD_MIN,
  APP_URL,
} from '@shared/index';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const canSubmit =
    name.length > 0 &&
    email.length > 0 &&
    password.length >= PASSWORD_MIN &&
    !submitting;

  async function onSubmit() {
    if (!canSubmit) return;
    setError(null);
    setFieldErrors({});

    const parsed = registerSchema.safeParse({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (typeof path === 'string') errs[path] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    if (isWeakPassword(parsed.data.password)) {
      setFieldErrors({ password: 'Contraseña muy débil. Elige una distinta.' });
      return;
    }

    setSubmitting(true);
    try {
      await register(parsed.data.name, parsed.data.email, parsed.data.password);
      void haptics.success();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Error al crear la cuenta';
      setError(msg);
      void haptics.error();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingVertical: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <GlassCard intensity={80} className="w-full max-w-md self-center p-6">
            <Text
              className="mb-1 text-center text-3xl font-bold text-foreground"
              accessibilityRole="header"
            >
              Crear cuenta
            </Text>
            <Text className="mb-6 text-center text-sm text-foreground/60">
              Gratis para siempre. Sin tarjeta.
            </Text>

            <Text
              nativeID="reg-name-label"
              className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/60"
            >
              Nombre
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              placeholderTextColor="#64748B"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              accessibilityLabel="Nombre"
              accessibilityLabelledBy="reg-name-label"
              className="mb-1 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-foreground"
            />
            {fieldErrors.name ? (
              <Text className="mb-3 text-xs text-red-300">{fieldErrors.name}</Text>
            ) : (
              <View className="mb-3" />
            )}

            <Text
              nativeID="reg-email-label"
              className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/60"
            >
              Correo
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="tu@correo.com"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              accessibilityLabel="Correo electrónico"
              accessibilityLabelledBy="reg-email-label"
              className="mb-1 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-foreground"
            />
            {fieldErrors.email ? (
              <Text className="mb-3 text-xs text-red-300">{fieldErrors.email}</Text>
            ) : (
              <View className="mb-3" />
            )}

            <Text
              nativeID="reg-password-label"
              className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/60"
            >
              Contraseña (mín {PASSWORD_MIN} caracteres)
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#64748B"
              secureTextEntry
              autoComplete="password-new"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={onSubmit}
              accessibilityLabel="Contraseña"
              accessibilityLabelledBy="reg-password-label"
              className="mb-1 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-foreground"
            />
            {fieldErrors.password ? (
              <Text className="mb-3 text-xs text-red-300">
                {fieldErrors.password}
              </Text>
            ) : (
              <View className="mb-5" />
            )}

            {error ? (
              <Text
                className="mb-3 rounded-lg bg-red-500/20 px-3 py-2 text-center text-sm text-red-200"
                accessibilityLiveRegion="assertive"
                accessibilityRole="alert"
              >
                {error}
              </Text>
            ) : null}

            <MotionPressable
              onPress={onSubmit}
              disabled={!canSubmit}
              accessibilityLabel="Crear cuenta"
              accessibilityState={{ disabled: !canSubmit, busy: submitting }}
              className="mb-3 items-center justify-center rounded-full bg-emerald py-3"
              style={{ opacity: canSubmit ? 1 : 0.5 }}
            >
              {submitting ? (
                <ActivityIndicator color="#0A0F14" />
              ) : (
                <Text className="text-base font-bold text-background">
                  Crear cuenta
                </Text>
              )}
            </MotionPressable>

            <Link href="/(auth)/login" asChild>
              <MotionPressable
                className="items-center justify-center rounded-full border border-white/10 py-3"
                hapticOnPressIn={false}
                accessibilityLabel="Ya tengo cuenta"
              >
                <Text className="text-sm font-semibold text-foreground/80">
                  Ya tengo cuenta
                </Text>
              </MotionPressable>
            </Link>

            <Text className="mt-5 text-center text-[10px] leading-4 text-foreground/50">
              Al crear cuenta aceptas nuestros{' '}
              <Text
                className="underline"
                onPress={() => void Linking.openURL(`${APP_URL}/terminos`)}
                accessibilityRole="link"
              >
                Términos
              </Text>
              {' '}y{' '}
              <Text
                className="underline"
                onPress={() => void Linking.openURL(`${APP_URL}/privacidad`)}
                accessibilityRole="link"
              >
                Privacidad
              </Text>
              .
            </Text>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
