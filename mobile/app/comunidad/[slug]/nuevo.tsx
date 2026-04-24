import { useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { MotionPressable } from '@/components/MotionPressable';
import { useCreatePost } from '@/hooks/useCommunity';
import { uploadPhoto } from '@/hooks/useSocial';
import { haptics } from '@/lib/haptics';
import { imageUrl } from '@/lib/images';

interface UploadedPhoto {
  url: string;
  sha256: string;
}

export default function NewPostScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);

  const createPost = useCreatePost(slug ?? '');

  const canSubmit =
    title.trim().length >= 3 && body.trim().length >= 3 && !createPost.isPending;

  async function pickPhotos() {
    if (photos.length >= 4) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Permite el acceso a fotos para subir.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 4 - photos.length,
      quality: 0.85,
    });
    if (res.canceled) return;
    setUploading(true);
    try {
      const uploaded: UploadedPhoto[] = [];
      for (const asset of res.assets) {
        const up = await uploadPhoto(asset.uri, 'post');
        uploaded.push({ url: up.url, sha256: up.sha256 });
      }
      setPhotos((p) => [...p, ...uploaded]);
      void haptics.success();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir';
      Alert.alert('No se pudo subir', msg);
      void haptics.error();
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(idx: number) {
    setPhotos((p) => p.filter((_, i) => i !== idx));
  }

  async function submit() {
    if (!canSubmit || !slug) return;
    try {
      const res = await createPost.mutateAsync({
        title: title.trim(),
        body: body.trim(),
        photoUrls: photos.map((p) => p.url),
        photoHashes: photos.map((p) => p.sha256),
      });
      void haptics.success();
      router.replace(`/comunidad/post/${res.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al publicar';
      Alert.alert('No se pudo publicar', msg);
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
          className="h-10 w-10 items-center justify-center rounded-full bg-white/5"
        >
          <Ionicons name="close" size={18} color="#F8FAFC" />
        </MotionPressable>
        <Text className="flex-1 text-xl font-bold text-foreground">
          Nueva publicación
        </Text>
        <MotionPressable
          onPress={() => void submit()}
          disabled={!canSubmit}
          className="rounded-full bg-emerald px-4 py-2"
          style={{ opacity: canSubmit ? 1 : 0.4 }}
        >
          {createPost.isPending ? (
            <ActivityIndicator color="#0A0F14" />
          ) : (
            <Text className="text-sm font-bold text-background">Publicar</Text>
          )}
        </MotionPressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Título"
          placeholderTextColor="#64748B"
          maxLength={200}
          accessibilityLabel="Título del post"
          className="mb-3 border-b border-white/10 py-2 text-xl font-bold text-foreground"
        />
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Comparte tu experiencia, recomendación o pregunta…"
          placeholderTextColor="#64748B"
          multiline
          maxLength={8000}
          accessibilityLabel="Contenido del post"
          className="min-h-48 text-base text-foreground"
          style={{ textAlignVertical: 'top' }}
        />

        {/* Photos */}
        {photos.length > 0 ? (
          <View className="mt-4 flex-row flex-wrap gap-2">
            {photos.map((p, i) => (
              <View
                key={p.sha256 + i}
                className="relative h-20 w-20 overflow-hidden rounded-xl"
              >
                <Image
                  source={{ uri: imageUrl(p.url) ?? p.url }}
                  contentFit="cover"
                  style={{ width: '100%', height: '100%' }}
                />
                <MotionPressable
                  onPress={() => removePhoto(i)}
                  hapticOnPressIn={false}
                  className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-black/70"
                >
                  <Ionicons name="close" size={10} color="#F8FAFC" />
                </MotionPressable>
              </View>
            ))}
          </View>
        ) : null}

        <MotionPressable
          onPress={() => void pickPhotos()}
          disabled={uploading || photos.length >= 4}
          className="mt-4 flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3"
          style={{ opacity: photos.length >= 4 ? 0.4 : 1 }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#06C167" />
          ) : (
            <>
              <Ionicons name="camera-outline" size={16} color="#94A3B8" />
              <Text className="text-sm font-semibold text-foreground/70">
                Agregar fotos ({photos.length}/4)
              </Text>
            </>
          )}
        </MotionPressable>
      </ScrollView>
    </SafeAreaView>
  );
}
