import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from './MotionPressable';
import type { TripSummary } from '@shared/index';

const STATUS_STYLES: Record<
  TripSummary['status'],
  { label: string; color: string }
> = {
  draft: { label: 'Borrador', color: '#94A3B8' },
  planning: { label: 'Planeando', color: '#F59E0B' },
  active: { label: 'Activo', color: '#06C167' },
  completed: { label: 'Completado', color: '#3B82F6' },
  archived: { label: 'Archivado', color: '#64748B' },
};

interface Props {
  trip: TripSummary;
}

export function TripCard({ trip }: Props) {
  const status = STATUS_STYLES[trip.status];

  return (
    <Link href={`/mis-viajes/${trip.id}`} asChild>
      <MotionPressable className="mb-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4">
        <View className="flex-row items-center gap-2">
          <View
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: `${status.color}33` }}
          >
            <Text
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: status.color }}
            >
              {status.label}
            </Text>
          </View>
          {trip.totalDistanceKm != null && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="car-outline" size={12} color="#94A3B8" />
              <Text className="text-[10px] text-foreground/60">
                {Math.round(trip.totalDistanceKm)} km
              </Text>
            </View>
          )}
        </View>

        <Text
          className="mt-2 text-base font-bold text-foreground"
          numberOfLines={2}
        >
          {trip.title}
        </Text>

        {(trip.originName || trip.destinationName) && (
          <Text className="mt-0.5 text-xs text-foreground/60" numberOfLines={1}>
            {trip.originName ?? '—'} → {trip.destinationName ?? '—'}
          </Text>
        )}

        <Text className="mt-2 text-[10px] text-foreground/50">
          Editado {new Date(trip.updatedAt).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
      </MotionPressable>
    </Link>
  );
}
