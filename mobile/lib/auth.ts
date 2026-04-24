/**
 * Authentication helpers. Session token lives in SecureStore (Keychain on iOS,
 * Keystore on Android). AsyncStorage is NEVER used for secrets.
 *
 * The web backend sets an HTTP-only cookie for Next.js sessions. For mobile
 * we surface the same session as a bearer JWT — the backend accepts both, so
 * mobile can authenticate without cookies.
 */
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

import { apiFetch } from './api';
import {
  BIOMETRIC_OPT_IN_KEY,
  SESSION_TOKEN_KEY,
} from './constants';
import type { PlanSlug } from '@shared/index';
import { API } from '@shared/index';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin' | 'editor';
  plan: PlanSlug;
  avatarUrl: string | null;
}

export async function getStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY).catch(() => {});
}

/**
 * POST /api/auth/login. Backend returns `{ user, token }` when the request
 * carries `X-Client-Platform: mobile` (apiFetch adds this automatically).
 * We persist the token in SecureStore; apiFetch re-attaches it as
 * `Authorization: Bearer` on every subsequent request.
 */
interface AuthResponse {
  user: SessionUser;
  token?: string;
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<SessionUser> {
  const data = await apiFetch<AuthResponse>(API.authLogin, {
    method: 'POST',
    anonymous: true,
    body: { email, password },
  });
  if (!data.token) {
    throw new Error('El servidor no devolvió un token de sesión');
  }
  await storeToken(data.token);
  return data.user;
}

export async function registerWithPassword(
  name: string,
  email: string,
  password: string,
): Promise<SessionUser> {
  const data = await apiFetch<AuthResponse>(API.authRegister, {
    method: 'POST',
    anonymous: true,
    body: { name, email, password },
  });
  if (!data.token) {
    throw new Error('El servidor no devolvió un token de sesión');
  }
  await storeToken(data.token);
  return data.user;
}

export async function fetchCurrentUser(): Promise<SessionUser | null> {
  // Avoid a network round-trip if there's no token to send at all.
  const token = await getStoredToken();
  if (!token) return null;
  try {
    const data = await apiFetch<{ user: SessionUser }>(API.authMe);
    return data.user;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await apiFetch(API.authLogout, { method: 'POST' });
  } catch {
    /* swallow — we still want to clear local state */
  }
  await clearToken();
}

// ── Biometric gate ─────────────────────────────────────────────────────────
/**
 * If the user has opted into biometric unlock AND the device has biometrics
 * enrolled, prompt them. Returns true on success (or when biometrics are not
 * enabled), false if the user actively failed. Never throws.
 */
export async function biometricUnlock(): Promise<boolean> {
  try {
    const optedIn = await SecureStore.getItemAsync(BIOMETRIC_OPT_IN_KEY);
    if (optedIn !== 'true') return true;

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !enrolled) return true;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquear Rutas en MX',
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar contraseña',
    });
    return result.success;
  } catch {
    // Don't lock the user out if the lib errors.
    return true;
  }
}

export async function setBiometricOptIn(enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(BIOMETRIC_OPT_IN_KEY, 'true');
  } else {
    await SecureStore.deleteItemAsync(BIOMETRIC_OPT_IN_KEY).catch(() => {});
  }
}
