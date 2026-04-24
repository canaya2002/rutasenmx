import { useState } from 'react';
import { View, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from './MotionPressable';

interface Props {
  onSend: (body: string) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

/**
 * WhatsApp-style composer. Grows from 1 to 4 lines. Disables the send button
 * while the message is being POSTed so the user can't double-submit.
 */
export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Escribe un mensaje…',
  maxLength = 2000,
}: Props) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const trimmed = body.trim();
  const canSend = trimmed.length > 0 && !sending && !disabled;

  async function submit() {
    if (!canSend) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setBody('');
    } finally {
      setSending(false);
    }
  }

  return (
    <View className="flex-row items-end gap-2 border-t border-white/5 bg-background px-3 py-2">
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        multiline
        maxLength={maxLength}
        editable={!disabled}
        accessibilityLabel="Escribir mensaje"
        className="max-h-28 min-h-[40px] flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground"
        style={{ paddingTop: 10, paddingBottom: 10 }}
      />
      <MotionPressable
        onPress={submit}
        disabled={!canSend}
        accessibilityLabel="Enviar"
        accessibilityState={{ disabled: !canSend, busy: sending }}
        className="h-10 w-10 items-center justify-center rounded-full bg-emerald"
        style={{ opacity: canSend ? 1 : 0.4 }}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#0A0F14" />
        ) : (
          <Ionicons name="send" size={16} color="#0A0F14" />
        )}
      </MotionPressable>
    </View>
  );
}
