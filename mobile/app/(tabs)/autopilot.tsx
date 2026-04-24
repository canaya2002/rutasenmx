import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { WizardShell } from '@/components/WizardShell';
import { SegmentedControl } from '@/components/SegmentedControl';
import { MotionPressable } from '@/components/MotionPressable';
import { GlassCard } from '@/components/GlassCard';
import { ItineraryDay } from '@/components/ItineraryDay';
import { InteractiveMap, type MapMarkerInput } from '@/components/InteractiveMap';
import { apiFetch, ApiError } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import { useAuth } from '@/providers/AuthProvider';
import {
  useRunAutopilot,
  useSaveFromAutopilot,
} from '@/hooks/useAutopilot';
import { useExportTrip } from '@/hooks/useExportTrip';
import {
  API,
  PLACE_CATEGORY_CATALOG,
  type AutopilotInput,
  type AutopilotOutput,
  type PlaceCategorySlug,
} from '@shared/index';

type WizardState = {
  origin: { name: string; lat: number; lng: number } | null;
  destination: { name: string; lat: number; lng: number } | null;
  originSearch: string;
  destSearch: string;
  dateStart: string;
  dateEnd: string;
  pace: AutopilotInput['pace'];
  travelerType: AutopilotInput['travelers']['type'];
  travelerCount: number;
  hasChildren: boolean;
  hasPets: boolean;
  budget: AutopilotInput['budget'];
  interests: PlaceCategorySlug[];
  avoidTolls: boolean;
  avoidHighways: boolean;
  avoidDirtRoads: boolean;
  avoidFerries: boolean;
  maxDrivingHours: number;
  mustVisit: Array<{ name: string; lat: number; lng: number }>;
  mustVisitSearch: string;
  style: AutopilotInput['style'];
};

const TOTAL_STEPS = 10;

const PACE_OPTIONS = [
  { value: 'relajado' as const, label: 'Relajado', emoji: '☕' },
  { value: 'moderado' as const, label: 'Moderado', emoji: '⛰️' },
  { value: 'intenso' as const, label: 'Intenso', emoji: '⚡' },
];

const TRAVELER_OPTIONS = [
  { value: 'solo' as const, label: 'Solo', emoji: '🧑' },
  { value: 'pareja' as const, label: 'Pareja', emoji: '💑' },
  { value: 'familia' as const, label: 'Familia', emoji: '👨‍👩‍👧' },
  { value: 'amigos' as const, label: 'Amigos', emoji: '🤝' },
  { value: 'grupo' as const, label: 'Grupo', emoji: '👥' },
];

const BUDGET_OPTIONS = [
  { value: 'economico' as const, label: 'Económico', emoji: '💰' },
  { value: 'moderado' as const, label: 'Moderado', emoji: '💵' },
  { value: 'premium' as const, label: 'Premium', emoji: '💎' },
  { value: 'lujo' as const, label: 'Lujo', emoji: '✨' },
];

const STYLE_OPTIONS = [
  { value: 'cultural' as const, label: 'Cultural', emoji: '🏛️' },
  { value: 'foodie' as const, label: 'Foodie', emoji: '🌮' },
  { value: 'familiar' as const, label: 'Familiar', emoji: '🎠' },
  { value: 'naturaleza' as const, label: 'Naturaleza', emoji: '🌿' },
  { value: 'express' as const, label: 'Express', emoji: '🚀' },
  { value: 'premium' as const, label: 'Premium', emoji: '⭐' },
];

const INITIAL_STATE: WizardState = {
  origin: null,
  destination: null,
  originSearch: '',
  destSearch: '',
  dateStart: '',
  dateEnd: '',
  pace: 'moderado',
  travelerType: 'pareja',
  travelerCount: 2,
  hasChildren: false,
  hasPets: false,
  budget: 'moderado',
  interests: [],
  avoidTolls: false,
  avoidHighways: false,
  avoidDirtRoads: false,
  avoidFerries: false,
  maxDrivingHours: 5,
  mustVisit: [],
  mustVisitSearch: '',
  style: 'cultural',
};

export default function AutopilotScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AutopilotOutput | null>(null);

  const run = useRunAutopilot();
  const save = useSaveFromAutopilot();
  const exporter = useExportTrip();

  const update = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  // ── Geocode on-demand via /api/geocode ────────────────────────────────────
  async function resolvePlace(
    q: string,
  ): Promise<{ name: string; lat: number; lng: number } | null> {
    if (!q.trim()) return null;
    try {
      const data = await apiFetch<{
        results?: Array<{ name: string; fullName: string; lat: number; lng: number }>;
      }>(`${API.geocode}?q=${encodeURIComponent(q.trim())}&limit=1`);
      const top = data.results?.[0];
      return top ? { name: top.fullName, lat: top.lat, lng: top.lng } : null;
    } catch {
      return null;
    }
  }

  async function setFromSearch(field: 'origin' | 'destination') {
    const q = field === 'origin' ? state.originSearch : state.destSearch;
    const place = await resolvePlace(q);
    if (!place) {
      setError(
        `No encontramos "${q}". Prueba con un nombre más completo (ciudad + estado).`,
      );
      return;
    }
    setError(null);
    update(field, place);
  }

  async function addMustVisit() {
    const place = await resolvePlace(state.mustVisitSearch);
    if (!place) {
      setError(
        `No encontramos "${state.mustVisitSearch}". Prueba con otro nombre.`,
      );
      return;
    }
    setError(null);
    setState((s) => ({
      ...s,
      mustVisit: [...s.mustVisit, place],
      mustVisitSearch: '',
    }));
  }

  function removeMustVisit(idx: number) {
    setState((s) => ({
      ...s,
      mustVisit: s.mustVisit.filter((_, i) => i !== idx),
    }));
  }

  function toggleInterest(slug: PlaceCategorySlug) {
    setState((s) => ({
      ...s,
      interests: s.interests.includes(slug)
        ? s.interests.filter((x) => x !== slug)
        : [...s.interests, slug],
    }));
  }

  const canAdvance = (() => {
    switch (step) {
      case 1:
        return state.origin !== null && state.destination !== null;
      case 4:
        return state.travelerCount > 0;
      case 6:
        return state.interests.length > 0;
      case 7:
        return state.maxDrivingHours >= 2 && state.maxDrivingHours <= 10;
      default:
        return true;
    }
  })();

  async function onGenerate() {
    if (!state.origin || !state.destination) {
      setError('Falta origen o destino.');
      setStep(1);
      return;
    }
    setError(null);
    const input: AutopilotInput = {
      origin: state.origin,
      destination: state.destination,
      dates:
        state.dateStart && state.dateEnd
          ? { start: state.dateStart, end: state.dateEnd }
          : undefined,
      pace: state.pace,
      travelers: {
        type: state.travelerType,
        count: state.travelerCount,
        hasChildren: state.hasChildren,
        hasPets: state.hasPets,
      },
      budget: state.budget,
      interests: state.interests,
      restrictions: {
        avoidTolls: state.avoidTolls,
        avoidHighways: state.avoidHighways,
        avoidDirtRoads: state.avoidDirtRoads,
        avoidFerries: state.avoidFerries,
        maxDrivingHoursPerDay: state.maxDrivingHours,
      },
      mustVisit: state.mustVisit,
      style: state.style,
    };

    try {
      const data = await run.mutateAsync(input);
      setResult(data.itinerary);
      void haptics.success();
    } catch (err) {
      const e = err as ApiError;
      if (e.status === 403) {
        const body = e.body as { upgradeRequired?: string } | null;
        setError(
          `Autopilot está disponible desde el plan ${
            body?.upgradeRequired ?? 'Pro'
          }. Actualiza para continuar.`,
        );
      } else if (e.status === 429) {
        setError('Alcanzaste tu límite mensual de Autopilot.');
      } else {
        setError(e.message ?? 'Error generando el itinerario.');
      }
      void haptics.error();
    }
  }

  async function onSaveResult() {
    if (!result) return;
    try {
      const data = await save.mutateAsync(result);
      void haptics.success();
      router.push(`/mis-viajes/${data.tripId}`);
    } catch (err) {
      const e = err as ApiError;
      if (e.status === 401) {
        router.push('/(auth)/login');
        return;
      }
      setError(e.message ?? 'No se pudo guardar el viaje.');
    }
  }

  async function onExportResult() {
    if (!result) return;
    void haptics.tap();
    const stops = result.days.flatMap((day) =>
      day.stops.map((s) => ({
        name: s.placeName,
        lat: s.lat,
        lng: s.lng,
        day: day.dayNumber,
        notes: s.reason || undefined,
        durationMinutes: s.suggestedDuration,
      })),
    );
    await exporter.run({
      title: result.tripTitle,
      description: result.tripDescription,
      originName: state.origin?.name ?? null,
      destinationName: state.destination?.name ?? null,
      totalDistanceKm: result.totalDistance,
      totalDurationMinutes: result.totalDuration,
      stops,
      plan: user?.plan ?? 'free',
    });
  }

  // ── Result screen (after generation) ──────────────────────────────────────
  if (result) {
    const isHeuristic = result.source === 'heuristic';
    const markers: MapMarkerInput[] = result.days.flatMap((d) =>
      d.stops.map((s) => ({
        id: s.placeId,
        lat: s.lat,
        lng: s.lng,
        title: s.placeName,
      })),
    );

    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
          <View className="flex-row items-center justify-between px-5 pt-2">
            <MotionPressable
              onPress={() => {
                void haptics.tap();
                setResult(null);
                setStep(1);
                setState(INITIAL_STATE);
              }}
              className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
            >
              <Ionicons name="close" size={18} color="#F8FAFC" />
            </MotionPressable>
          </View>

          <View className="mt-3 px-5">
            {/* Source badge — brand-safe honesty */}
            <View
              className="mb-3 self-start flex-row items-center gap-1.5 rounded-full px-3 py-1"
              style={{
                backgroundColor: isHeuristic
                  ? 'rgba(245, 158, 11, 0.2)'
                  : 'rgba(6, 193, 103, 0.2)',
              }}
            >
              <Ionicons
                name={isHeuristic ? 'warning-outline' : 'sparkles'}
                size={12}
                color={isHeuristic ? '#F59E0B' : '#06C167'}
              />
              <Text
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: isHeuristic ? '#F59E0B' : '#06C167' }}
              >
                {isHeuristic
                  ? 'Generado sin IA (sistema heurístico)'
                  : 'Generado con IA'}
              </Text>
            </View>

            <Text className="text-3xl font-bold text-foreground">
              {result.tripTitle}
            </Text>
            <Text className="mt-1 text-sm text-foreground/70">
              {result.tripDescription}
            </Text>

            <View className="mt-3 flex-row flex-wrap gap-4">
              <Text className="text-xs text-foreground/70">
                <Text className="font-bold text-foreground">
                  {result.days.length}
                </Text>{' '}
                días
              </Text>
              <Text className="text-xs text-foreground/70">
                <Text className="font-bold text-foreground">
                  {Math.round(result.totalDistance)}
                </Text>{' '}
                km
              </Text>
              <Text className="text-xs text-foreground/70">
                <Text className="font-bold text-foreground">
                  {Math.floor(result.totalDuration / 60)}h
                </Text>{' '}
                manejo
              </Text>
              {result.estimatedCost.max > 0 && (
                <Text className="text-xs text-foreground/70">
                  <Text className="font-bold text-foreground">
                    ${result.estimatedCost.min.toLocaleString()}–$
                    {result.estimatedCost.max.toLocaleString()}
                  </Text>{' '}
                  MXN
                </Text>
              )}
            </View>
          </View>

          {/* Map */}
          {markers.length > 0 && (
            <View className="mt-5 px-5">
              <InteractiveMap markers={markers} polyline />
            </View>
          )}

          {result.warnings.length > 0 && (
            <View className="mt-4 px-5">
              <GlassCard
                intensity={60}
                className="border-amber-500/40 bg-amber-500/10 p-4"
              >
                <Text className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Avisos
                </Text>
                {result.warnings.map((w, i) => (
                  <Text key={i} className="mt-1 text-sm text-amber-100">
                    • {w}
                  </Text>
                ))}
              </GlassCard>
            </View>
          )}

          <View className="mt-5 px-5">
            {result.days.map((day) => (
              <ItineraryDay key={day.dayNumber} day={day} />
            ))}
          </View>
        </ScrollView>

        {/* Sticky action bar */}
        <View className="flex-row gap-2 border-t border-white/5 bg-background px-5 py-3">
          <MotionPressable
            onPress={onExportResult}
            disabled={exporter.exporting}
            className="flex-1 items-center justify-center rounded-full border border-white/10 bg-white/5 py-3"
            style={{ opacity: exporter.exporting ? 0.6 : 1 }}
          >
            <Text className="text-sm font-semibold text-foreground">
              {exporter.exporting ? 'Generando…' : 'Exportar PDF'}
            </Text>
          </MotionPressable>
          <MotionPressable
            onPress={onSaveResult}
            disabled={save.isPending}
            className="flex-[2] items-center justify-center rounded-full bg-emerald py-3"
            style={{ opacity: save.isPending ? 0.6 : 1 }}
          >
            {save.isPending ? (
              <ActivityIndicator color="#0A0F14" />
            ) : (
              <Text className="text-base font-bold text-background">
                Guardar viaje
              </Text>
            )}
          </MotionPressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Generating screen (while mutation is pending) ─────────────────────────
  if (run.isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#06C167" size="large" />
        <Text className="mt-4 text-base font-semibold text-foreground">
          Planeando tu ruta…
        </Text>
        <Text className="mt-1 max-w-xs text-center text-xs text-foreground/60">
          Analizamos cientos de lugares para crear el itinerario perfecto
          (10-30 segundos).
        </Text>
      </SafeAreaView>
    );
  }

  // ── Step content ─────────────────────────────────────────────────────────
  const stepTitles: Record<number, { title: string; subtitle: string }> = {
    1: {
      title: 'Origen y destino',
      subtitle: 'Define de dónde sales y a dónde quieres llegar.',
    },
    2: { title: 'Fechas', subtitle: '¿Cuándo viajas? (opcional)' },
    3: { title: 'Ritmo', subtitle: '¿Qué tan rápido quieres ir?' },
    4: { title: 'Viajeros', subtitle: '¿Quién va en el viaje?' },
    5: { title: 'Presupuesto', subtitle: '¿Cuánto quieres gastar por día?' },
    6: { title: 'Intereses', subtitle: '¿Qué tipo de lugares te interesan?' },
    7: { title: 'Restricciones', subtitle: '¿Algo que prefieras evitar?' },
    8: {
      title: 'Paradas imperdibles',
      subtitle: 'Lugares que no pueden faltar (opcional).',
    },
    9: { title: 'Estilo', subtitle: '¿Qué experiencia buscas?' },
    10: {
      title: 'Listo para generar',
      subtitle: 'Revisa tus preferencias antes de continuar.',
    },
  };

  return (
    <WizardShell
      title={stepTitles[step].title}
      subtitle={stepTitles[step].subtitle}
      step={step}
      totalSteps={TOTAL_STEPS}
      onBack={() => router.back()}
      onPrev={() => setStep((s) => Math.max(1, s - 1))}
      onNext={() => {
        if (step === TOTAL_STEPS) void onGenerate();
        else setStep((s) => Math.min(TOTAL_STEPS, s + 1));
      }}
      nextLabel={step === TOTAL_STEPS ? 'Generar con Autopilot' : undefined}
      canGoNext={canAdvance}
      submitting={run.isPending}
      error={error}
    >
      {step === 1 && (
        <View>
          <Label>Origen</Label>
          <View className="flex-row gap-2">
            <TextInput
              value={state.originSearch}
              onChangeText={(v) => update('originSearch', v)}
              placeholder="Ej: Ciudad de México"
              placeholderTextColor="#64748B"
              autoCapitalize="words"
              accessibilityLabel="Origen"
              returnKeyType="search"
              onSubmitEditing={() => void setFromSearch('origin')}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-foreground"
            />
            <MotionPressable
              onPress={() => void setFromSearch('origin')}
              accessibilityLabel="Fijar origen"
              className="items-center justify-center rounded-xl bg-emerald px-4"
            >
              <Text className="text-xs font-bold text-background">Fijar</Text>
            </MotionPressable>
          </View>
          {state.origin ? (
            <Pill text={state.origin.name} onRemove={() => update('origin', null)} />
          ) : null}

          <View className="mt-5" />
          <Label>Destino</Label>
          <View className="flex-row gap-2">
            <TextInput
              value={state.destSearch}
              onChangeText={(v) => update('destSearch', v)}
              placeholder="Ej: Oaxaca"
              placeholderTextColor="#64748B"
              autoCapitalize="words"
              accessibilityLabel="Destino"
              returnKeyType="search"
              onSubmitEditing={() => void setFromSearch('destination')}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-foreground"
            />
            <MotionPressable
              onPress={() => void setFromSearch('destination')}
              accessibilityLabel="Fijar destino"
              className="items-center justify-center rounded-xl bg-emerald px-4"
            >
              <Text className="text-xs font-bold text-background">Fijar</Text>
            </MotionPressable>
          </View>
          {state.destination ? (
            <Pill
              text={state.destination.name}
              onRemove={() => update('destination', null)}
            />
          ) : null}
        </View>
      )}

      {step === 2 && (
        <View>
          <Text className="text-xs text-foreground/60">
            Formato: AAAA-MM-DD (ej. 2026-06-15). Si dejas vacío, calculamos
            la duración ideal automáticamente.
          </Text>
          <View className="mt-4">
            <Label>Fecha de salida</Label>
            <TextInput
              value={state.dateStart}
              onChangeText={(v) => update('dateStart', v)}
              placeholder="2026-06-15"
              placeholderTextColor="#64748B"
              accessibilityLabel="Fecha de salida en formato AAAA-MM-DD"
              autoCapitalize="none"
              autoCorrect={false}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-foreground"
            />
          </View>
          <View className="mt-4">
            <Label>Fecha de regreso</Label>
            <TextInput
              value={state.dateEnd}
              onChangeText={(v) => update('dateEnd', v)}
              placeholder="2026-06-20"
              placeholderTextColor="#64748B"
              accessibilityLabel="Fecha de regreso en formato AAAA-MM-DD"
              autoCapitalize="none"
              autoCorrect={false}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-foreground"
            />
          </View>
        </View>
      )}

      {step === 3 && (
        <SegmentedControl
          options={PACE_OPTIONS}
          value={state.pace}
          onChange={(v) => update('pace', v)}
          columns={3}
        />
      )}

      {step === 4 && (
        <View>
          <SegmentedControl
            options={TRAVELER_OPTIONS}
            value={state.travelerType}
            onChange={(v) => update('travelerType', v)}
            columns={5}
          />

          <View className="mt-5">
            <Label>Número de viajeros</Label>
            <View className="flex-row items-center gap-3">
              <MotionPressable
                onPress={() =>
                  update(
                    'travelerCount',
                    Math.max(1, state.travelerCount - 1),
                  )
                }
                className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5"
              >
                <Ionicons name="remove" size={18} color="#F8FAFC" />
              </MotionPressable>
              <Text className="w-10 text-center text-2xl font-bold text-foreground">
                {state.travelerCount}
              </Text>
              <MotionPressable
                onPress={() =>
                  update(
                    'travelerCount',
                    Math.min(20, state.travelerCount + 1),
                  )
                }
                className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5"
              >
                <Ionicons name="add" size={18} color="#F8FAFC" />
              </MotionPressable>
            </View>
          </View>

          <Toggle
            label="Viajamos con niños"
            value={state.hasChildren}
            onChange={(v) => update('hasChildren', v)}
          />
          <Toggle
            label="Viajamos con mascotas"
            value={state.hasPets}
            onChange={(v) => update('hasPets', v)}
          />
        </View>
      )}

      {step === 5 && (
        <SegmentedControl
          options={BUDGET_OPTIONS}
          value={state.budget}
          onChange={(v) => update('budget', v)}
          columns={2}
        />
      )}

      {step === 6 && (
        <View>
          <Text className="mb-3 text-xs text-foreground/60">
            Elige al menos uno. Puedes seleccionar varios.
          </Text>
          <View className="flex-row flex-wrap -mx-1">
            {PLACE_CATEGORY_CATALOG.map((c) => {
              const active = state.interests.includes(c.slug);
              return (
                <View key={c.slug} className="w-1/2 p-1">
                  <MotionPressable
                    onPress={() => toggleInterest(c.slug)}
                    className={`flex-row items-center gap-2 rounded-2xl border p-3 ${
                      active
                        ? 'border-emerald bg-emerald/20'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <Text className="text-base">{c.emoji}</Text>
                    <Text
                      className="flex-1 text-xs font-semibold"
                      style={{ color: active ? '#06C167' : '#E2E8F0' }}
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                  </MotionPressable>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {step === 7 && (
        <View>
          <Toggle
            label="Evitar casetas de peaje"
            value={state.avoidTolls}
            onChange={(v) => update('avoidTolls', v)}
          />
          <Toggle
            label="Evitar autopistas"
            value={state.avoidHighways}
            onChange={(v) => update('avoidHighways', v)}
          />
          <Toggle
            label="Evitar terracería"
            value={state.avoidDirtRoads}
            onChange={(v) => update('avoidDirtRoads', v)}
          />
          <Toggle
            label="Evitar transbordadores"
            value={state.avoidFerries}
            onChange={(v) => update('avoidFerries', v)}
          />
          <View className="mt-4">
            <Label>Máximo de horas de manejo por día: {state.maxDrivingHours}h</Label>
            <View className="flex-row items-center gap-3">
              <MotionPressable
                onPress={() =>
                  update(
                    'maxDrivingHours',
                    Math.max(2, state.maxDrivingHours - 1),
                  )
                }
                className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5"
              >
                <Ionicons name="remove" size={18} color="#F8FAFC" />
              </MotionPressable>
              <Text className="w-12 text-center text-xl font-bold text-foreground">
                {state.maxDrivingHours}h
              </Text>
              <MotionPressable
                onPress={() =>
                  update(
                    'maxDrivingHours',
                    Math.min(10, state.maxDrivingHours + 1),
                  )
                }
                className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5"
              >
                <Ionicons name="add" size={18} color="#F8FAFC" />
              </MotionPressable>
            </View>
          </View>
        </View>
      )}

      {step === 8 && (
        <View>
          <Text className="mb-3 text-xs text-foreground/60">
            Opcional. Agrega lugares específicos que no pueden faltar en la ruta.
          </Text>
          <View className="flex-row gap-2">
            <TextInput
              value={state.mustVisitSearch}
              onChangeText={(v) => update('mustVisitSearch', v)}
              placeholder="Ej: Chichén Itzá"
              placeholderTextColor="#64748B"
              autoCapitalize="words"
              accessibilityLabel="Lugar obligatorio"
              returnKeyType="done"
              onSubmitEditing={() => void addMustVisit()}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-foreground"
            />
            <MotionPressable
              onPress={() => void addMustVisit()}
              accessibilityLabel="Agregar lugar obligatorio"
              className="items-center justify-center rounded-xl bg-emerald px-4"
            >
              <Text className="text-xs font-bold text-background">Agregar</Text>
            </MotionPressable>
          </View>
          {state.mustVisit.length > 0 ? (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {state.mustVisit.map((p, idx) => (
                <Pill
                  key={`${p.name}-${idx}`}
                  text={p.name}
                  onRemove={() => removeMustVisit(idx)}
                />
              ))}
            </View>
          ) : null}
        </View>
      )}

      {step === 9 && (
        <SegmentedControl
          options={STYLE_OPTIONS}
          value={state.style}
          onChange={(v) => update('style', v)}
          columns={3}
        />
      )}

      {step === 10 && (
        <View>
          <Row label="Origen" value={state.origin?.name ?? '—'} />
          <Row label="Destino" value={state.destination?.name ?? '—'} />
          <Row
            label="Fechas"
            value={
              state.dateStart && state.dateEnd
                ? `${state.dateStart} al ${state.dateEnd}`
                : 'Automático'
            }
          />
          <Row
            label="Viajeros"
            value={`${state.travelerCount} ${state.travelerType}`}
          />
          <Row label="Ritmo" value={state.pace} />
          <Row label="Presupuesto" value={state.budget} />
          <Row label="Estilo" value={state.style} />
          <Row label="Manejo/día" value={`${state.maxDrivingHours}h`} />
          <Row label="Intereses" value={`${state.interests.length} seleccionados`} />
          {state.mustVisit.length > 0 ? (
            <Row label="Imperdibles" value={`${state.mustVisit.length} paradas`} />
          ) : null}
        </View>
      )}
    </WizardShell>
  );
}

// ── Reused micro-components ─────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground/60">
      {children}
    </Text>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View className="mt-3 flex-row items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
      <Text className="flex-1 text-sm text-foreground">{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#334155', true: '#06C167' }}
        thumbColor="#F8FAFC"
      />
    </View>
  );
}

function Pill({ text, onRemove }: { text: string; onRemove: () => void }) {
  return (
    <View className="mt-2 flex-row items-center gap-1.5 self-start rounded-full bg-emerald/20 px-3 py-1.5">
      <Text className="text-xs font-semibold text-emerald">{text}</Text>
      <MotionPressable
        onPress={onRemove}
        hapticOnPressIn={false}
        className="rounded-full bg-white/10 p-0.5"
      >
        <Ionicons name="close" size={12} color="#F8FAFC" />
      </MotionPressable>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-2 flex-row items-center justify-between border-b border-white/5 py-2">
      <Text className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
        {label}
      </Text>
      <Text className="text-sm capitalize text-foreground">{value}</Text>
    </View>
  );
}
