import { useState } from 'react';
import { Modal, View, Text, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from './MotionPressable';
import { useReportUser, useBlockUser } from '@/hooks/useSocial';
import {
  REPORT_REASONS,
  REPORT_REASON_LABELS_ES,
  type ReportReason,
} from '@shared/index';

interface Props {
  visible: boolean;
  reportedUserId: string | null;
  displayName: string;
  /** When true, this report is for a post, not a user. */
  onClose: () => void;
}

/**
 * Consent-first report flow: pick reason → optional note → submit. Block is
 * a companion action defaulting ON, because "report but keep showing me this
 * person" is almost never the right UX.
 */
export function ReportDialog({
  visible,
  reportedUserId,
  displayName,
  onClose,
}: Props) {
  const [reason, setReason] = useState<ReportReason>('harassment');
  const [note, setNote] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const report = useReportUser();
  const block = useBlockUser();

  const submitting = report.isPending || block.isPending;

  async function submit() {
    if (!reportedUserId) return;
    setError(null);
    try {
      await report.mutateAsync({
        reportedId: reportedUserId,
        reason,
        note: note.trim() || undefined,
      });
      if (alsoBlock) {
        try {
          await block.mutateAsync({ userId: reportedUserId });
        } catch {
          /* already blocked is fine */
        }
      }
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      setError(msg);
    }
  }

  function handleClose() {
    setDone(false);
    setNote('');
    setReason('harassment');
    setAlsoBlock(true);
    setError(null);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 items-center justify-center bg-black/70 p-5">
        <View className="w-full max-w-md rounded-3xl border border-white/10 bg-background p-6">
          <View className="mb-3 flex-row items-center">
            <Text className="flex-1 text-xl font-bold text-foreground">
              {done ? 'Reporte enviado' : `Reportar a ${displayName}`}
            </Text>
            <MotionPressable
              onPress={handleClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/5"
            >
              <Ionicons name="close" size={14} color="#F8FAFC" />
            </MotionPressable>
          </View>

          {done ? (
            <>
              <Text className="mt-1 text-sm text-foreground/70">
                Nuestro equipo revisará el caso.{' '}
                {alsoBlock ? 'Bloqueamos al usuario para que no lo vuelvas a ver.' : ''}
              </Text>
              <MotionPressable
                onPress={handleClose}
                className="mt-5 items-center justify-center rounded-full bg-emerald py-3"
              >
                <Text className="text-base font-bold text-background">Cerrar</Text>
              </MotionPressable>
            </>
          ) : (
            <>
              <Text className="mb-3 text-xs text-foreground/60">
                Cuéntanos qué pasó para revisar la cuenta.
              </Text>
              <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                Motivo
              </Text>
              <View className="mb-4 gap-1.5">
                {REPORT_REASONS.map((r) => {
                  const active = reason === r;
                  return (
                    <MotionPressable
                      key={r}
                      onPress={() => setReason(r)}
                      hapticOnPressIn={false}
                      className={`flex-row items-center gap-2 rounded-xl border p-3 ${
                        active
                          ? 'border-emerald bg-emerald/20'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <Ionicons
                        name={active ? 'radio-button-on' : 'radio-button-off'}
                        size={16}
                        color={active ? '#06C167' : '#94A3B8'}
                      />
                      <Text
                        className={`text-sm ${
                          active ? 'text-emerald' : 'text-foreground'
                        }`}
                      >
                        {REPORT_REASON_LABELS_ES[r]}
                      </Text>
                    </MotionPressable>
                  );
                })}
              </View>

              <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                Contexto (opcional)
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                multiline
                placeholder="¿Qué pasó exactamente?"
                placeholderTextColor="#64748B"
                maxLength={1000}
                className="mb-3 min-h-20 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground"
              />

              <View className="mb-4 flex-row items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <Text className="flex-1 text-sm text-foreground">
                  También bloquear a este usuario
                </Text>
                <Switch
                  value={alsoBlock}
                  onValueChange={setAlsoBlock}
                  trackColor={{ false: '#334155', true: '#06C167' }}
                  thumbColor="#F8FAFC"
                />
              </View>

              {error ? (
                <Text className="mb-3 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-200">
                  {error}
                </Text>
              ) : null}

              <View className="flex-row gap-2">
                <MotionPressable
                  onPress={handleClose}
                  hapticOnPressIn={false}
                  className="flex-1 items-center justify-center rounded-full border border-white/10 bg-white/5 py-3"
                >
                  <Text className="text-sm font-semibold text-foreground/80">
                    Cancelar
                  </Text>
                </MotionPressable>
                <MotionPressable
                  onPress={submit}
                  disabled={submitting}
                  className="flex-1 items-center justify-center rounded-full bg-red-600 py-3"
                  style={{ opacity: submitting ? 0.6 : 1 }}
                >
                  <Text className="text-sm font-bold text-white">
                    {submitting ? 'Enviando…' : 'Enviar reporte'}
                  </Text>
                </MotionPressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
