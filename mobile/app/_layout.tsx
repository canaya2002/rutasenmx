import '../global.css';

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';

import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { IAPProvider } from '@/providers/IAPProvider';
import { PushProvider } from '@/providers/PushProvider';
import { DeepLinkProvider } from '@/providers/DeepLinkProvider';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Route-group gate. Uses `useSegments()` to know which group the current
 * screen belongs to and redirects based on auth state.
 *
 *   - User not logged in + navigating outside `(auth)` → push `/login`.
 *   - User logged in + still inside `(auth)` → push `/` (tabs).
 *
 * Splash stays on top until the first auth check completes so the user
 * never sees a flash of the wrong screen.
 */
function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
    SplashScreen.hideAsync().catch(() => {});
  }, [loading, user, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryProvider>
            <AuthProvider>
              <IAPProvider>
                <PushProvider>
                  <DeepLinkProvider>
                    <RouteGuard>
                      <View className="flex-1 bg-background">
                        <OfflineBanner />
                        <Stack
                          screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: '#0A0F14' },
                            animation: 'fade',
                          }}
                        />
                      </View>
                    </RouteGuard>
                    <StatusBar style="light" />
                  </DeepLinkProvider>
                </PushProvider>
              </IAPProvider>
            </AuthProvider>
          </QueryProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
