import { TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MotionPressable } from './MotionPressable';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar lugares, estados, rutas…',
  onSubmit,
  autoFocus,
}: Props) {
  return (
    <View className="flex-row items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5">
      <Ionicons name="search" size={18} color="#94A3B8" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        className="flex-1 text-base text-foreground"
        style={{ paddingVertical: 0 }}
      />
      {value.length > 0 && (
        <MotionPressable
          onPress={() => onChange('')}
          hapticOnPressIn={false}
          className="rounded-full bg-white/10 p-1"
        >
          <Ionicons name="close" size={14} color="#F8FAFC" />
        </MotionPressable>
      )}
    </View>
  );
}
