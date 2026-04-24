import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GlassCard } from './GlassCard';
import type { AutopilotDay } from '@shared/index';

function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

interface Props {
  day: AutopilotDay;
}

/**
 * Renders one day of an itinerary: header with stats + vertical stop list
 * with a connecting line to convey sequence.
 */
export function ItineraryDay({ day }: Props) {
  return (
    <GlassCard intensity={60} className="mb-4 p-4">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-lg font-bold text-foreground">
          Día {day.dayNumber}
          {day.title ? ` · ${day.title}` : ''}
        </Text>
        <View className="flex-row items-center gap-1">
          <Ionicons name="time-outline" size={12} color="#94A3B8" />
          <Text className="text-[10px] text-foreground/60">
            {fmtDuration(day.drivingMinutes)} · {Math.round(day.drivingKm)} km
          </Text>
        </View>
      </View>
      {day.description ? (
        <Text className="mt-1 text-xs text-foreground/70">
          {day.description}
        </Text>
      ) : null}

      <View className="mt-3">
        {day.stops.map((stop, idx) => {
          const isLast = idx === day.stops.length - 1;
          return (
            <View key={stop.placeId} className="flex-row">
              <View className="mr-3 items-center">
                <View className="h-6 w-6 items-center justify-center rounded-full bg-emerald">
                  <Text className="text-[10px] font-bold text-background">
                    {idx + 1}
                  </Text>
                </View>
                {!isLast && (
                  <View className="my-0.5 w-0.5 flex-1 bg-white/10" />
                )}
              </View>
              <View className="flex-1 pb-3">
                <Text className="text-sm font-semibold text-foreground">
                  {stop.placeName}
                </Text>
                {stop.category ? (
                  <Text className="text-[10px] uppercase tracking-wider text-emerald">
                    {stop.category}
                  </Text>
                ) : null}
                {stop.reason ? (
                  <Text className="mt-1 text-xs text-foreground/70">
                    {stop.reason}
                  </Text>
                ) : null}
                <Text className="mt-1 text-[10px] text-foreground/50">
                  {fmtDuration(stop.suggestedDuration)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}
