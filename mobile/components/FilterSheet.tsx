import { Modal, View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from './MotionPressable';
import { GlassCard } from './GlassCard';
import type { DiscoveryFilters } from '@/hooks/useSocial';
import {
  SOCIAL_INTENT_EMOJIS,
  SOCIAL_INTENT_LABELS_ES,
  type SocialIntent,
} from '@shared/index';

// Small state list. The full 32-state list exists in shared/constants, but
// we keep the most-traveled ones at the top for quick selection. Selecting
// "Todos" clears the filter.
const TOP_STATES: Array<{ slug: string; name: string }> = [
  { slug: 'oaxaca', name: 'Oaxaca' },
  { slug: 'quintana-roo', name: 'Quintana Roo' },
  { slug: 'jalisco', name: 'Jalisco' },
  { slug: 'yucatan', name: 'Yucatán' },
  { slug: 'baja-california-sur', name: 'Baja California Sur' },
  { slug: 'chiapas', name: 'Chiapas' },
  { slug: 'guanajuato', name: 'Guanajuato' },
  { slug: 'puebla', name: 'Puebla' },
  { slug: 'nayarit', name: 'Nayarit' },
  { slug: 'michoacan', name: 'Michoacán' },
];

const INTENTS: SocialIntent[] = ['convivir', 'salir', 'explorar', 'conocer'];

interface Props {
  visible: boolean;
  filters: DiscoveryFilters;
  onChange: (next: DiscoveryFilters) => void;
  onClose: () => void;
}

export function FilterSheet({ visible, filters, onChange, onClose }: Props) {
  function toggleIntent(i: SocialIntent) {
    onChange({
      ...filters,
      intent: filters.intent === i ? undefined : i,
    });
  }
  function setState(slug: string | undefined) {
    onChange({ ...filters, destinoEstadoSlug: slug });
  }

  const count =
    (filters.destinoEstadoSlug ? 1 : 0) + (filters.intent ? 1 : 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="max-h-[80%] rounded-t-3xl border-t border-white/10 bg-background p-5">
          <View className="mb-4 flex-row items-center">
            <Text className="flex-1 text-xl font-bold text-foreground">
              Filtros{count > 0 ? ` · ${count}` : ''}
            </Text>
            <MotionPressable
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5"
            >
              <Ionicons name="close" size={16} color="#F8FAFC" />
            </MotionPressable>
          </View>

          <ScrollView className="max-h-[70vh]">
            {/* Intent */}
            <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
              Intención
            </Text>
            <View className="mb-5 flex-row flex-wrap gap-2">
              {INTENTS.map((i) => {
                const active = filters.intent === i;
                return (
                  <MotionPressable
                    key={i}
                    onPress={() => toggleIntent(i)}
                    className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${
                      active
                        ? 'border-emerald bg-emerald/20'
                        : 'border-white/10 bg-white/5'
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

            {/* Destino */}
            <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
              Estado destino
            </Text>
            <View className="mb-5 flex-row flex-wrap gap-2">
              <MotionPressable
                onPress={() => setState(undefined)}
                className={`rounded-full border px-3 py-1.5 ${
                  !filters.destinoEstadoSlug
                    ? 'border-emerald bg-emerald/20'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    !filters.destinoEstadoSlug
                      ? 'text-emerald'
                      : 'text-foreground'
                  }`}
                >
                  Todos
                </Text>
              </MotionPressable>
              {TOP_STATES.map((s) => {
                const active = filters.destinoEstadoSlug === s.slug;
                return (
                  <MotionPressable
                    key={s.slug}
                    onPress={() => setState(s.slug)}
                    className={`rounded-full border px-3 py-1.5 ${
                      active
                        ? 'border-emerald bg-emerald/20'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active ? 'text-emerald' : 'text-foreground'
                      }`}
                    >
                      {s.name}
                    </Text>
                  </MotionPressable>
                );
              })}
            </View>
          </ScrollView>

          <GlassCard intensity={40} className="mt-2">
            <MotionPressable
              onPress={() => {
                onChange({});
              }}
              hapticOnPressIn={false}
              className="flex-row items-center justify-center gap-2 py-3"
            >
              <Ionicons name="refresh" size={14} color="#F59E0B" />
              <Text className="text-sm font-semibold text-amber-300">
                Limpiar filtros
              </Text>
            </MotionPressable>
          </GlassCard>
        </View>
      </View>
    </Modal>
  );
}
