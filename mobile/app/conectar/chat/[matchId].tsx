import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from '@/components/MotionPressable';
import { Avatar } from '@/components/Avatar';
import { MessageBubble } from '@/components/MessageBubble';
import { ChatInput } from '@/components/ChatInput';
import { ReportDialog } from '@/components/ReportDialog';
import { EmptyState } from '@/components/EmptyState';
import { ListSkeleton } from '@/components/ListSkeleton';
import {
  useMatches,
  useMessages,
  useSendMessage,
  useCloseMatch,
} from '@/hooks/useSocial';
import { useAuth } from '@/providers/AuthProvider';
import { haptics } from '@/lib/haptics';
import type { SocialMessageView } from '@shared/index';

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const listRef = useRef<FlatList<SocialMessageView>>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // We already have the match list cached; grab our match from there so the
  // chat header doesn't need a separate request.
  const { data: matches } = useMatches();
  const match = useMemo(
    () => matches?.find((m) => m.matchId === matchId) ?? null,
    [matches, matchId],
  );

  const messagesQuery = useMessages(matchId);
  const send = useSendMessage(matchId ?? '');
  const close = useCloseMatch();

  const messages = messagesQuery.data ?? [];

  // Auto-scroll to bottom on new message.
  useEffect(() => {
    if (messages.length === 0) return;
    const t = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(t);
  }, [messages.length]);

  async function onSend(body: string) {
    await send.mutateAsync(body);
  }

  function onCloseMatch() {
    Alert.alert(
      '¿Cerrar conversación?',
      'No podrás enviar más mensajes. Los mensajes previos se conservarán.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar',
          style: 'destructive',
          onPress: async () => {
            void haptics.warning();
            try {
              await close.mutateAsync(matchId ?? '');
              router.back();
            } catch {
              Alert.alert('Error', 'No se pudo cerrar la conversación.');
            }
          },
        },
      ],
    );
  }

  if (!matchId) return null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center gap-2 border-b border-white/5 px-3 pb-2 pt-1">
        <MotionPressable
          onPress={() => {
            void haptics.tap();
            router.back();
          }}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/5"
        >
          <Ionicons name="chevron-back" size={22} color="#F8FAFC" />
        </MotionPressable>
        <Avatar
          uri={match?.other.photoUrl}
          name={match?.other.displayName ?? 'Usuario'}
          size={36}
        />
        <View className="flex-1">
          <Text
            className="text-sm font-bold text-foreground"
            numberOfLines={1}
          >
            {match?.other.displayName ?? 'Usuario'}
          </Text>
          {match?.other.destinoEstadoName ? (
            <Text className="text-[10px] text-foreground/60" numberOfLines={1}>
              Va a {match.other.destinoEstadoName}
            </Text>
          ) : null}
        </View>
        <MotionPressable
          onPress={() => setMenuOpen((v) => !v)}
          accessibilityLabel="Más opciones"
          accessibilityHint="Reportar, bloquear o cerrar el chat"
          className="h-10 w-10 items-center justify-center rounded-full bg-white/5"
        >
          <Ionicons name="ellipsis-vertical" size={18} color="#F8FAFC" />
        </MotionPressable>
      </View>

      {/* Menu dropdown */}
      {menuOpen ? (
        <View className="absolute right-3 top-16 z-10 w-48 overflow-hidden rounded-2xl border border-white/10 bg-background shadow-xl">
          <MotionPressable
            hapticOnPressIn={false}
            onPress={() => {
              setMenuOpen(false);
              setReportOpen(true);
            }}
            className="flex-row items-center gap-2 px-3 py-3"
          >
            <Ionicons name="flag-outline" size={14} color="#F8FAFC" />
            <Text className="text-sm text-foreground">Reportar</Text>
          </MotionPressable>
          <View className="h-px bg-white/5" />
          <MotionPressable
            hapticOnPressIn={false}
            onPress={() => {
              setMenuOpen(false);
              onCloseMatch();
            }}
            className="flex-row items-center gap-2 px-3 py-3"
          >
            <Ionicons name="ban-outline" size={14} color="#EF4444" />
            <Text className="text-sm text-red-400">Cerrar conversación</Text>
          </MotionPressable>
        </View>
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        className="flex-1"
      >
        {messagesQuery.isLoading ? (
          <View className="flex-1 px-4 py-3">
            <ListSkeleton variant="row" rows={4} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                mine={item.senderId === user?.id}
              />
            )}
            contentContainerStyle={{
              padding: 12,
              paddingBottom: 20,
              flexGrow: 1,
              justifyContent: messages.length === 0 ? 'center' : 'flex-start',
            }}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
            ListEmptyComponent={
              <EmptyState
                icon="chatbubble-outline"
                title="¡Conectaron!"
                subtitle="Rompe el hielo con el primer mensaje."
              />
            }
          />
        )}

        {match?.isClosed ? (
          <View className="border-t border-white/5 bg-background p-4">
            <Text className="text-center text-xs text-foreground/60">
              Esta conversación está cerrada.
            </Text>
          </View>
        ) : (
          <ChatInput onSend={onSend} />
        )}
      </KeyboardAvoidingView>

      <ReportDialog
        visible={reportOpen}
        reportedUserId={match?.other.userId ?? null}
        displayName={match?.other.displayName ?? ''}
        onClose={() => setReportOpen(false)}
      />
    </SafeAreaView>
  );
}
