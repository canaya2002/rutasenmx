import { useRef, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from '@/components/MotionPressable';
import { SwipeCard, type SwipeCardHandle } from '@/components/SwipeCard';
import { MatchModal } from '@/components/MatchModal';
import { FilterSheet } from '@/components/FilterSheet';
import { ReportDialog } from '@/components/ReportDialog';
import { EmptyState } from '@/components/EmptyState';
import { haptics } from '@/lib/haptics';
import { useEntitlements } from '@/hooks/useEntitlements';
import {
  useDiscoveryQueue,
  useSwipe,
  type DiscoveryFilters,
} from '@/hooks/useSocial';
import type { SocialProfileView } from '@shared/index';

/**
 * The Tinder-style discovery screen. The queue is the source of truth; we
 * pop cards from the front as the user swipes. When the stack runs below 3,
 * we refetch to prefetch the next batch. Match modal fires when the server
 * reports `matched: true`.
 */
export default function ConectarScreen() {
  const router = useRouter();
  const topRef = useRef<SwipeCardHandle>(null);
  const [filters, setFilters] = useState<DiscoveryFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<SocialProfileView | null>(null);
  const [match, setMatch] = useState<{
    matchId: string;
    other: SocialProfileView;
  } | null>(null);
  /** Local deck — we remove profiles as the user swipes rather than
   * re-rendering the whole queue. Server order is preserved. */
  const [deck, setDeck] = useState<SocialProfileView[]>([]);
  const [lastQueueId, setLastQueueId] = useState<string>('');

  const { data: ent } = useEntitlements();
  const { data, isLoading, isError, refetch, isRefetching } = useDiscoveryQueue(filters);
  const swipe = useSwipe();

  // Merge server queue into the local deck when the server returns a new
  // batch. We key by the first profile's userId so refetches of the same
  // batch don't duplicate.
  const serverQueue = data?.queue ?? [];
  const queueId = serverQueue.map((p) => p.userId).join(',');
  if (queueId && queueId !== lastQueueId) {
    // Append new unseen profiles to the deck.
    const existing = new Set(deck.map((p) => p.userId));
    const fresh = serverQueue.filter((p) => !existing.has(p.userId));
    if (fresh.length > 0) setDeck((d) => [...d, ...fresh]);
    setLastQueueId(queueId);
  }

  async function onSwipe(action: 'like' | 'pass') {
    const current = deck[0];
    if (!current) return;
    // Optimistic pop so the card doesn't linger during network.
    setDeck((d) => d.slice(1));
    try {
      const result = await swipe.mutateAsync({
        toUserId: current.userId,
        action,
      });
      if (result.matched && result.matchId && result.otherProfile) {
        setMatch({ matchId: result.matchId, other: result.otherProfile });
      }
      if (deck.length <= 3) void refetch();
    } catch {
      // If the server rejected (e.g., rate limit), restore the card.
      void haptics.error();
      setDeck((d) => [current, ...d]);
    }
  }

  // ── Premium gate ─────────────────────────────────────────────────────────
  if (ent && ent.plan === 'free') {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 items-center justify-center px-6">
          <EmptyState
            icon="heart-outline"
            title="Conectar es una función de Pro"
            subtitle="Haz match con viajeros que van a tu destino. Disponible desde el plan Pro ($99 MXN/mes)."
            actionLabel="Ver planes"
            onAction={() => router.push('/(tabs)/perfil')}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Profile missing ─────────────────────────────────────────────────────
  if (data?.needsProfile) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 items-center justify-center px-6">
          <EmptyState
            icon="person-circle-outline"
            title="Crea tu perfil social"
            subtitle="Necesitas un perfil público para descubrir a otras personas."
            actionLabel="Crear mi perfil"
            onAction={() => router.push('/conectar/perfil')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const current = deck[0];
  const filterCount =
    (filters.destinoEstadoSlug ? 1 : 0) + (filters.intent ? 1 : 0);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Top bar */}
      <View className="flex-row items-center gap-2 px-5 pb-2 pt-2">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-foreground">Conectar</Text>
          <Text className="text-xs text-foreground/60">
            Desliza, conecta, arma tu próximo viaje acompañado.
          </Text>
        </View>
        <MotionPressable
          onPress={() => router.push('/conectar/perfil')}
          className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
        >
          <Ionicons name="person-outline" size={18} color="#F8FAFC" />
        </MotionPressable>
        <MotionPressable
          onPress={() => router.push('/conectar/matches')}
          className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
        >
          <Ionicons name="chatbubbles-outline" size={18} color="#F8FAFC" />
        </MotionPressable>
        <MotionPressable
          onPress={() => setFilterOpen(true)}
          className="h-10 flex-row items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3"
        >
          <Ionicons name="options-outline" size={16} color="#F8FAFC" />
          {filterCount > 0 ? (
            <Text className="text-xs font-bold text-emerald">
              {filterCount}
            </Text>
          ) : null}
        </MotionPressable>
      </View>

      {/* Card stack */}
      <View className="flex-1 px-5 py-3">
        {isLoading && deck.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#06C167" />
            <Text className="mt-3 text-sm text-foreground/60">
              Buscando viajeros…
            </Text>
          </View>
        ) : isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="No pudimos cargar"
            subtitle="Revisa tu conexión y reintenta."
            actionLabel="Reintentar"
            onAction={() => void refetch()}
          />
        ) : !current ? (
          <EmptyState
            icon="heart-outline"
            title="Por hoy terminaste"
            subtitle="Ajusta los filtros o vuelve más tarde para ver nuevos perfiles."
            actionLabel={isRefetching ? 'Cargando…' : 'Recargar'}
            onAction={() => void refetch()}
          />
        ) : (
          <View className="flex-1">
            {/* Render up to 3 cards bottom-up; top card is last in JSX so it receives taps. */}
            {deck
              .slice(0, 3)
              .map((p, i) => i)
              .reverse()
              .map((i) => {
                const p = deck[i];
                if (!p) return null;
                return (
                  <SwipeCard
                    key={p.userId}
                    ref={i === 0 ? topRef : undefined}
                    profile={p}
                    stackIndex={i}
                    onSwipe={(action) => void onSwipe(action)}
                    onReport={() => setReportTarget(p)}
                  />
                );
              })}
          </View>
        )}
      </View>

      {/* Bottom action buttons */}
      {current ? (
        <View className="flex-row items-center justify-center gap-6 pb-5 pt-2">
          <MotionPressable
            onPress={() => topRef.current?.swipeLeft()}
            accessibilityLabel="Pasar"
            accessibilityHint="Descarta este perfil"
            className="h-14 w-14 items-center justify-center rounded-full border-2 border-white/15 bg-white/5"
          >
            <Ionicons name="close" size={26} color="#F8FAFC" />
          </MotionPressable>
          <MotionPressable
            onPress={() => topRef.current?.swipeRight()}
            accessibilityLabel="Me gusta"
            accessibilityHint="Si ambos se dan like, hacen match"
            className="h-16 w-16 items-center justify-center rounded-full bg-emerald shadow-lg"
          >
            <Ionicons name="heart" size={30} color="#0A0F14" />
          </MotionPressable>
        </View>
      ) : null}

      <FilterSheet
        visible={filterOpen}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFilterOpen(false)}
      />

      <MatchModal
        visible={!!match}
        other={match?.other ?? null}
        matchId={match?.matchId ?? null}
        onClose={() => setMatch(null)}
      />

      <ReportDialog
        visible={!!reportTarget}
        reportedUserId={reportTarget?.userId ?? null}
        displayName={reportTarget?.displayName ?? ''}
        onClose={() => setReportTarget(null)}
      />
    </SafeAreaView>
  );
}
