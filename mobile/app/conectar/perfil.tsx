import { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { MotionPressable } from '@/components/MotionPressable';
import { GlassCard } from '@/components/GlassCard';
import { haptics } from '@/lib/haptics';
import { imageUrl } from '@/lib/images';
import {
  useSocialProfile,
  useUpsertSocialProfile,
  uploadPhoto,
} from '@/hooks/useSocial';
import {
  SOCIAL_INTENT_EMOJIS,
  SOCIAL_INTENT_LABELS_ES,
  type SocialIntent,
} from '@shared/index';

const INTENTS: SocialIntent[] = ['convivir', 'salir', 'explorar', 'conocer'];

const INTERESTS = [
  'naturaleza',
  'playa',
  'cultura',
  'gastronomía',
  'fiesta',
  'fotografía',
  'senderismo',
  'mezcal',
  'surf',
  'arqueología',
  'pueblos-mágicos',
  'road-trip',
  'café',
  'festivales',
  'aventura',
  'yoga',
  'artesanías',
  'música',
  'historia',
  'arte',
];

const LANGUAGES = ['Español', 'Inglés', 'Francés', 'Portugués', 'Alemán'];

const BIO_MAX = 280;
const NAME_MAX = 80;

export default function SocialProfileScreen() {
  const router = useRouter();
  const { data: existing, isLoading } = useSocialProfile();
  const upsert = useUpsertSocialProfile();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [destino, setDestino] = useState('');
  const [intent, setIntent] = useState<SocialIntent | null>(null);
  const [age, setAge] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(['Español']);
  const [isVisible, setIsVisible] = useState(true);

  // Hydrate once the server profile loads.
  useEffect(() => {
    if (existing) {
      setDisplayName(existing.displayName);
      setBio(existing.bio ?? '');
      setPhotoUrl(existing.photoUrl);
      setDestino(existing.destinoEstadoSlug ?? '');
      setIntent(existing.intent ?? null);
      setAge(existing.age != null ? String(existing.age) : '');
      setInterests(existing.interests);
      setLanguages(existing.languages.length > 0 ? existing.languages : ['Español']);
      setIsVisible(existing.isVisible);
    }
  }, [existing]);

  function toggleInterest(tag: string) {
    setInterests((cur) =>
      cur.includes(tag)
        ? cur.filter((x) => x !== tag)
        : cur.length < 10
          ? [...cur, tag]
          : cur,
    );
  }
  function toggleLanguage(lang: string) {
    setLanguages((cur) =>
      cur.includes(lang) ? cur.filter((x) => x !== lang) : [...cur, lang],
    );
  }

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permiso requerido',
        'Permite el acceso a fotos para subir una imagen de perfil.',
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (res.canceled || !res.assets?.[0]) return;
    setUploading(true);
    try {
      const uploaded = await uploadPhoto(res.assets[0].uri, 'avatar');
      setPhotoUrl(uploaded.url);
      void haptics.success();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir foto';
      Alert.alert('No se pudo subir', msg);
      void haptics.error();
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (displayName.trim().length < 2) {
      Alert.alert('Nombre muy corto', 'Ingresa al menos 2 caracteres.');
      return;
    }
    try {
      await upsert.mutateAsync({
        displayName: displayName.trim(),
        bio: bio.trim() || null,
        photoUrl: photoUrl ?? null,
        destinoEstadoSlug: destino || null,
        interests,
        intent,
        age: age ? Number(age) : null,
        languages,
        travelFrom: null,
        travelTo: null,
        isVisible,
      });
      void haptics.success();
      router.replace('/(tabs)/conectar');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      Alert.alert('No se pudo guardar', msg);
      void haptics.error();
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#06C167" />
      </SafeAreaView>
    );
  }

  const photo = imageUrl(photoUrl);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center gap-2 px-5 pb-2 pt-1">
        <MotionPressable
          onPress={() => {
            void haptics.tap();
            router.back();
          }}
          className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
        >
          <Ionicons name="chevron-back" size={22} color="#F8FAFC" />
        </MotionPressable>
        <Text className="flex-1 text-xl font-bold text-foreground">
          {existing ? 'Editar perfil social' : 'Crear perfil social'}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 140,
          paddingTop: 8,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo picker */}
        <View className="mb-5 items-center">
          <MotionPressable
            onPress={() => void pickPhoto()}
            className="relative h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-white/15 bg-white/5"
          >
            {photo ? (
              <Image
                source={{ uri: photo }}
                contentFit="cover"
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Ionicons name="camera" size={24} color="#94A3B8" />
            )}
            {uploading ? (
              <View className="absolute inset-0 items-center justify-center bg-black/50">
                <ActivityIndicator color="#06C167" />
              </View>
            ) : null}
          </MotionPressable>
          <Text className="mt-2 text-xs text-foreground/60">
            Toca para cambiar · se revisa automáticamente
          </Text>
        </View>

        <Label>Nombre visible</Label>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={NAME_MAX}
          placeholder="Ana"
          placeholderTextColor="#64748B"
          accessibilityLabel="Nombre visible"
          className="mb-4 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-foreground"
        />

        <Label>Edad (opcional)</Label>
        <TextInput
          value={age}
          onChangeText={(t) => setAge(t.replace(/\D/g, '').slice(0, 2))}
          placeholder="28"
          placeholderTextColor="#64748B"
          keyboardType="number-pad"
          accessibilityLabel="Edad"
          className="mb-4 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-foreground"
        />

        <Label>Bio ({bio.length}/{BIO_MAX})</Label>
        <TextInput
          value={bio}
          onChangeText={setBio}
          maxLength={BIO_MAX}
          multiline
          placeholder="¿Qué te define? ¿Qué buscas en este viaje?"
          placeholderTextColor="#64748B"
          accessibilityLabel="Biografía"
          className="mb-4 min-h-24 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-foreground"
        />

        <Label>Qué buscas</Label>
        <View className="mb-5 flex-row flex-wrap gap-2">
          {INTENTS.map((i) => {
            const active = intent === i;
            return (
              <MotionPressable
                key={i}
                onPress={() => setIntent(active ? null : i)}
                className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${
                  active ? 'border-emerald bg-emerald/20' : 'border-white/10 bg-white/5'
                }`}
              >
                <Text>{SOCIAL_INTENT_EMOJIS[i]}</Text>
                <Text
                  className={`text-xs font-semibold ${
                    active ? 'text-emerald' : 'text-foreground'
                  }`}
                >
                  {SOCIAL_INTENT_LABELS_ES[i]}
                </Text>
              </MotionPressable>
            );
          })}
        </View>

        <Label>Intereses · {interests.length}/10</Label>
        <View className="mb-5 flex-row flex-wrap gap-1.5">
          {INTERESTS.map((tag) => {
            const active = interests.includes(tag);
            const disabled = !active && interests.length >= 10;
            return (
              <MotionPressable
                key={tag}
                onPress={() => toggleInterest(tag)}
                hapticOnPressIn={false}
                disabled={disabled}
                className={`rounded-full px-3 py-1 ${
                  active
                    ? 'bg-emerald'
                    : disabled
                      ? 'bg-white/5'
                      : 'border border-white/10 bg-white/5'
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    active
                      ? 'text-background'
                      : disabled
                        ? 'text-foreground/40'
                        : 'text-foreground/80'
                  }`}
                >
                  #{tag}
                </Text>
              </MotionPressable>
            );
          })}
        </View>

        <Label>Idiomas</Label>
        <View className="mb-5 flex-row flex-wrap gap-1.5">
          {LANGUAGES.map((lang) => {
            const active = languages.includes(lang);
            return (
              <MotionPressable
                key={lang}
                onPress={() => toggleLanguage(lang)}
                hapticOnPressIn={false}
                className={`rounded-full px-3 py-1 ${
                  active ? 'bg-foreground' : 'border border-white/10 bg-white/5'
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    active ? 'text-background' : 'text-foreground/80'
                  }`}
                >
                  {lang}
                </Text>
              </MotionPressable>
            );
          })}
        </View>

        <Label>Estado al que vas (slug, ej. oaxaca)</Label>
        <TextInput
          value={destino}
          onChangeText={(t) =>
            setDestino(
              t
                .toLowerCase()
                .replace(/[^a-z\-]/g, '')
                .slice(0, 40),
            )
          }
          placeholder="oaxaca"
          placeholderTextColor="#64748B"
          className="mb-4 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-foreground"
        />

        <GlassCard intensity={50} className="mt-2 flex-row items-center gap-3 p-4">
          <View className="flex-1">
            <Text className="text-sm font-bold text-foreground">
              Perfil visible
            </Text>
            <Text className="text-xs text-foreground/60">
              Cuando desactivas, nadie te ve en descubrimiento.
            </Text>
          </View>
          <Switch
            value={isVisible}
            onValueChange={setIsVisible}
            trackColor={{ false: '#334155', true: '#06C167' }}
            thumbColor="#F8FAFC"
          />
        </GlassCard>
      </ScrollView>

      <View className="border-t border-white/5 bg-background px-5 py-3">
        <MotionPressable
          onPress={() => void submit()}
          disabled={upsert.isPending || displayName.trim().length < 2}
          className="items-center justify-center rounded-full bg-emerald py-3"
          style={{ opacity: upsert.isPending || displayName.trim().length < 2 ? 0.6 : 1 }}
        >
          {upsert.isPending ? (
            <ActivityIndicator color="#0A0F14" />
          ) : (
            <Text className="text-base font-bold text-background">
              {existing ? 'Guardar cambios' : 'Crear perfil social'}
            </Text>
          )}
        </MotionPressable>
      </View>
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
