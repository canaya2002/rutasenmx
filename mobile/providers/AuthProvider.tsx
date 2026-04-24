/**
 * Session context. Holds the currently-authenticated user in memory + offers
 * `login`/`register`/`logout` that mutate both SecureStore and the context.
 *
 * Routing logic:
 *   - If `user === null` and the user tries to access a protected route,
 *     app/_layout.tsx redirects to /(auth)/login.
 *   - If `user !== null` and they hit /(auth)/*, redirect to /(tabs).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  fetchCurrentUser,
  loginWithPassword,
  logout as apiLogout,
  registerWithPassword,
  type SessionUser,
} from '@/lib/auth';
import { onUnauthorized } from '@/lib/api';
import { emit, EVENTS } from '@/lib/analytics';

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const current = await fetchCurrentUser();
    setUser(current);
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  // Auto-logout on any 401 from apiFetch.
  useEffect(() => {
    return onUnauthorized(() => {
      setUser(null);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const next = await loginWithPassword(email, password);
    setUser(next);
    emit(EVENTS.login, { properties: { plan: next.plan } });
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const next = await registerWithPassword(name, email, password);
      setUser(next);
      emit(EVENTS.signup_completed, {
        properties: { emailDomain: email.split('@')[1] ?? null },
      });
    },
    [],
  );

  const logout = useCallback(async () => {
    emit(EVENTS.logout);
    await apiLogout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
