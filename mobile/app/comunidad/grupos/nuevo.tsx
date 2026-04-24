import { useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from '@/components/MotionPressable';
import { GlassCard } from '@/components/GlassCard';
import { useCreateCommunity } from '@/hooks/useCommunity';
import { haptics } from '@/lib/haptics';

export default function NewGroupScreen() {
  const router = useRouter();
  const create = useCreateCommunity();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);

  const canSubmit = name.trim().length >= 3 && !create.isPending;

  async function submit() {
    if (!canSubmit) return;
    try {
      const res = await create.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        requiresApproval,
      });
      void haptics.success();
      router.replace(`/comunidad/${res.community.slug}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear';
      Alert.alert('No se pudo crear', msg);
      void haptics.error();
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center gap-2 px-5 pb-2 pt-1">
        <MotionPressable
          onPress={() => {
            void haptics.tap();
            router.back();
          }}
          accessibilityLabel="Cerrar"
          className="h-10 w-10 items-center justify-center rounded-full bg-white/5"
        >
          <Ionicons name="close" size={18} color="#F8FAFC" />
        </MotionPressable>
        <Text
          className="flex-1 text-xl font-bold text-foreground"
          accessibilityRole="header"
        >
          Crear grupo
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
        style={{ flex: 1 }}
      >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 140,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-4 text-xs text-foreground/60">
          Un grupo es un espacio privado o abierto donde viajeros con intereses
          comunes comparten publicaciones y fotos. Como dueño, moderas el
          contenido.
        </Text>

        <Label>Nombre del grupo *</Label>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ej. Road trippers CDMX–Oaxaca"
          placeholderTextColor="#64748B"
          maxLength={160}
          className="mb-4 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-foreground"
        />

        <Label>Descripción ({description.length}/600)</Label>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="¿Sobre qué se habla aquí? ¿Qué se comparte?"
          placeholderTextColor="#64748B"
          multiline
          maxLength={600}
          className="mb-4 min-h-24 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-foreground"
        />

        <GlassCard intensity={50} className="flex-row items-center gap-3 p-4">
          <View className="flex-1">
            <Text className="text-sm font-bold text-foreground">
              Requiere aprobación para unirse
            </Text>
            <Text className="text-xs text-foreground/60">
              Revisas cada solicitud antes de que alguien se una.
            </Text>
          </View>
          <Switch
            value={requiresApproval}
            onValueChange={setRequiresApproval}
            trackColor={{ false: '#334155', true: '#06C167' }}
            thumbColor="#F8FAFC"
          />
        </GlassCard>
      </ScrollView>

      <View className="border-t border-white/5 px-5 py-3">
        <MotionPressable
          onPress={() => void submit()}
          disabled={!canSubmit}
          accessibilityLabel="Crear grupo"
          accessibilityState={{ disabled: !canSubmit, busy: create.isPending }}
          className="items-center justify-center rounded-full bg-emerald py-3"
          style={{ opacity: canSubmit ? 1 : 0.5 }}
        >
          {create.isPending ? (
            <ActivityIndicator color="#0A0F14" />
          ) : (
            <Text className="text-base font-bold text-background">
              Crear grupo
            </Text>
          )}
        </MotionPressable>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
      {children}
    </Text>
  );
}
