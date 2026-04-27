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
    <View
      className="flex-row items-center gap-2.5 rounded-full border border-white/15 bg-black/40 px-4 py-3"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
    >
      <Ionicons name="search" size={18} color="#A8B0BD" />
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
          className="rounded-full bg-white/15 p-1.5"
        >
          <Ionicons name="close" size={14} color="#F8FAFC" />
        </MotionPressable>
      )}
    </View>
  );
}
