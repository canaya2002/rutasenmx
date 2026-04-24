import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops' }} />
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-4xl font-bold text-foreground">🧭</Text>
          <Text className="mt-4 text-center text-xl font-bold text-foreground">
            Esta pantalla no existe
          </Text>
          <Text className="mt-2 text-center text-sm text-foreground/60">
            Quizá cambiaste de ruta a mitad del viaje.
          </Text>
          <Link
            href="/"
            className="mt-6 rounded-full bg-emerald px-5 py-2 font-bold text-background"
          >
            Volver al inicio
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}
