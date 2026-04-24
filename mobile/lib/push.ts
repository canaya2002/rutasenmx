import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { apiFetch } from '@/lib/api';

/**
 * Expo push notification helpers. Native side only — `Platform.OS === 'web'`
 * short-circuits to no-ops so the web export of the mobile app doesn't crash.
 *
 * Token lifecycle:
 *   1. `configurePushHandler()` — run once at app boot, before any screen
 *      renders. Tells Expo how to present incoming notifications when the app
 *      is in the foreground.
 *   2. `registerPushToken()` — call after a user logs in. Asks permission,
 *      obtains the Expo token, POSTs it to `/api/push/register`.
 *   3. `unregisterPushToken()` — call on logout. Removes the token from our
 *      backend so the ex-user stops getting pushes on this device.
 */

let _handlerConfigured = false;
let _cachedToken: string | null = null;

export function configurePushHandler(): void {
  if (_handlerConfigured) return;
  if (Platform.OS === 'web') return;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android') {
      // Android requires a channel; without one, high-priority pushes fall
      // back to silent. Emerald = brand accent.
      void Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: '#06C167',
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    _handlerConfigured = true;
  } catch (err) {
    console.warn('[push] configure failed', err);
  }
}

/**
 * Get (or request) permission for notifications. Returns true if granted.
 * Silent no-op on web / simulator / Expo Go-without-physical-device.
 */
async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  if (existing === 'denied') return false;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return status === 'granted';
}

async function fetchExpoToken(): Promise<string | null> {
  if (_cachedToken) return _cachedToken;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId || projectId === 'TO_BE_CREATED_BY_EAS_INIT') {
    // No EAS project wired yet — tokens from a dev build will be dev tokens,
    // which still work against Expo's push API.
    try {
      const { data } = await Notifications.getExpoPushTokenAsync();
      _cachedToken = data;
      return data;
    } catch (err) {
      console.warn('[push] getExpoPushTokenAsync (no projectId) failed', err);
      return null;
    }
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    _cachedToken = data;
    return data;
  } catch (err) {
    console.warn('[push] getExpoPushTokenAsync failed', err);
    return null;
  }
}

/**
 * Ask for permission, obtain the Expo token, and register it with the
 * backend. Returns the token on success, null on any failure (never throws).
 */
export async function registerPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const ok = await ensurePermission();
  if (!ok) return null;

  const token = await fetchExpoToken();
  if (!token) return null;

  try {
    await apiFetch('/api/push/register', {
      method: 'POST',
      body: {
        token,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        locale: undefined,
        appVersion: Constants.expoConfig?.version,
      },
    });
    return token;
  } catch (err) {
    console.warn('[push] register failed', err);
    return null;
  }
}

/**
 * Tell the backend to stop sending pushes to this device. Called on logout
 * so the next signed-in user doesn't inherit the old user's notifications.
 */
export async function unregisterPushToken(): Promise<void> {
  if (Platform.OS === 'web') return;
  const token = _cachedToken ?? (await fetchExpoToken().catch(() => null));
  if (!token) return;
  try {
    await apiFetch(`/api/push/register?token=${encodeURIComponent(token)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('[push] unregister failed', err);
  } finally {
    _cachedToken = null;
  }
}

/** Extract the route path encoded by the server inside `notification.data.path`. */
export function pathFromNotificationData(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const path = (data as Record<string, unknown>).path;
  if (typeof path === 'string' && path.startsWith('/')) return path;
  return null;
}
