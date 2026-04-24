import { View, Text } from 'react-native';

import { MotionPressable } from './MotionPressable';

interface Option<V extends string> {
  value: V;
  label: string;
  emoji?: string;
}

interface Props<V extends string> {
  options: Option<V>[];
  value: V | null;
  onChange: (v: V) => void;
  /** Multiple columns look better than a single row for 3-4 options. */
  columns?: number;
}

/**
 * Large touch-friendly segmented control used across the Autopilot wizard
 * (pace, travelers type, budget, style). Each cell is a glass tile that
 * inverts tint when active.
 */
export function SegmentedControl<V extends string>({
  options,
  value,
  onChange,
  columns = 3,
}: Props<V>) {
  return (
    <View className="flex-row flex-wrap -mx-1">
      {options.map((opt) => {
        const active = value === opt.value;
        const widthPercent = 100 / columns;
        return (
          <View
            key={opt.value}
            style={{ width: `${widthPercent}%` }}
            className="px-1 pb-2"
          >
            <MotionPressable
              onPress={() => onChange(opt.value)}
              className={`items-center justify-center rounded-2xl border p-3 ${
                active
                  ? 'border-emerald bg-emerald/20'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {opt.emoji ? (
                <Text className="text-2xl">{opt.emoji}</Text>
              ) : null}
              <Text
                className={`mt-1 text-center text-[11px] font-semibold ${
                  active ? 'text-emerald' : 'text-foreground/80'
                }`}
              >
                {opt.label}
              </Text>
            </MotionPressable>
          </View>
        );
      })}
    </View>
  );
}
