/**
 * Tiny HTTP client. Purpose:
 *   - Prepend API_BASE_URL.
 *   - Inject the JWT from SecureStore on every request.
 *   - Identify the platform to the backend (`X-Client-Platform: mobile`).
 *   - Translate non-2xx into a typed `ApiError` so callers can branch.
 *   - On 401, auto-clear the stored token and fire a global logout event —
 *     subscribers (AuthProvider) react by flushing state and the route guard
 *     redirects to /(auth)/login on the next render.
 *
 * Not a TanStack Query wrapper — TQ usage lives in hooks/*. Keeping the
 * transport dumb makes it unit-testable in isolation.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { API_BASE_URL, SESSION_TOKEN_KEY } from './constants';

export class ApiError extends Error {
  public status: number;
  public code: string | null;
  public body: unknown;

  constructor(
    status: number,
    message: string,
    opts: { code?: string | null; body?: unknown } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = opts.code ?? null;
    this.body = opts.body ?? null;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  /** Skip attaching the session token (for login/register). */
  anonymous?: boolean;
  /** Request timeout in ms (default 10s). */
  timeoutMs?: number;
}

async function getSessionToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

async function clearSessionToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  } catch {
    /* swallow */
  }
}

// ── Global 401 listeners (AuthProvider subscribes) ─────────────────────────
type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

function notifyUnauthorized(): void {
  for (const l of unauthorizedListeners) {
    try {
      l();
    } catch {
      /* one listener throwing shouldn't block others */
    }
  }
}

// ── Platform header value ──────────────────────────────────────────────────
// This file only runs inside the mobile app (native + Expo web preview). The
// backend uses X-Client-Platform to decide whether to return a bearer token
// alongside the session cookie, and ANY caller here is a bearer-token consumer
// — even on web, because the Expo web bundle cannot rely on cross-origin
// cookies against www.rutasenmx.com. So always tag as mobile/ios/android; the
// literal 'web' would short-circuit the token path and break auth.
function platformTag(): 'ios' | 'android' | 'mobile' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'mobile';
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    anonymous = false,
    timeoutMs = 10_000,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    'X-Client-Platform': platformTag(),
    ...headers,
  };
  if (body !== undefined) {
    finalHeaders['Content-Type'] ??= 'application/json';
  }
  if (!anonymous) {
    const token = await getSessionToken();
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body:
        body === undefined
          ? undefined
          : typeof body === 'string'
            ? body
            : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(0, 'Tiempo de espera agotado', { code: 'timeout' });
    }
    throw new ApiError(0, 'Sin conexión', { code: 'network', body: err });
  }
  clearTimeout(timeoutId);

  // 401 — treat as logged out. Never for anonymous endpoints (otherwise a
  // wrong password flushes the session of someone who was already logged in).
  if (response.status === 401 && !anonymous) {
    await clearSessionToken();
    notifyUnauthorized();
  }

  // 204 No Content — resolve with null cast to T.
  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const parsed = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (parsed as { error?: string } | null)?.error ??
      `Error ${response.status}`;
    throw new ApiError(response.status, message, { body: parsed });
  }

  return parsed as T;
}
