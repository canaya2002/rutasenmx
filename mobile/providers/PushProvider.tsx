import { useEffect, useRef, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

import { useAuth } from './AuthProvider';
import {
  configurePushHandler,
  registerPushToken,
  unregisterPushToken,
  pathFromNotificationData,
} from '@/lib/push';

/**
 * Binds push notifications to the current user:
 *   - Registers the Expo token with the backend when a user logs in.
 *   - Unregisters on logout so the next signed-in user on this device doesn't
 *     inherit the old user's notifications.
 *   - Navigates to `data.path` when the user taps a notification — this is
 *     how deep links FROM pushes work (match/message → chat screen).
 *
 * Web is a no-op: push notifications aren't relevant on the web export.
 */
export function PushProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const lastUserRef = useRef<string | null>(null);

  // Configure the foreground-presentation handler once.
  useEffect(() => {
    configurePushHandler();
  }, []);

  // Register on login, unregister on logout.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const currentId = user?.id ?? null;
    const prevId = lastUserRef.current;

    // Same identity — nothing to do.
    if (prevId === currentId) return;

    if (prevId && !currentId) {
      // Logged out: unregister the token.
      void unregisterPushToken();
    }

    if (currentId) {
      // Logged in (or identity switched): register fresh.
      void registerPushToken();
    }

    lastUserRef.current = currentId;
  }, [user?.id]);

  // Navigate when the user taps a notification.
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const path = pathFromNotificationData(
          response.notification.request.content.data,
        );
        if (path) {
          try {
            router.push(path as never);
          } catch (err) {
            console.warn('[push] tap navigation failed', err);
          }
        }
      },
    );

    // Handle the "app was cold-launched from a notification" case.
    void (async () => {
      const last = await Notifications.getLastNotificationResponseAsync();
      if (!last) return;
      const path = pathFromNotificationData(
        last.notification.request.content.data,
      );
      if (path) {
        try {
          router.push(path as never);
        } catch {
          /* ignore */
        }
      }
    })();

    return () => sub.remove();
  }, [router]);

  return <>{children}</>;
}
