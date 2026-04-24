import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { configureIAP, isIAPAvailable } from '@/lib/iap';
import { useAuth } from './AuthProvider';

interface IAPContextValue {
  available: boolean;
}

const IAPContext = createContext<IAPContextValue>({ available: false });

/**
 * Binds the RevenueCat SDK to the signed-in user. After login we call
 * `Purchases.logIn(userId)` so every purchase and restore references the
 * same user across devices. After logout we call `logOut()` so the next
 * user on the device doesn't inherit entitlements.
 *
 * The `available` flag is `false` in Expo Go (no native module) — the paywall
 * surfaces a helpful message instead of crashing.
 */
export function IAPProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    const available = isIAPAvailable();
    if (!available) return;

    const nextId = user?.id ?? null;
    if (lastUserId.current === nextId) return;
    lastUserId.current = nextId;

    void (async () => {
      await configureIAP(nextId);
      // After identity switches, invalidate entitlements so the new user
      // doesn't see the previous one's plan.
      qc.invalidateQueries({ queryKey: ['entitlements'] });
    })();
  }, [user?.id, qc]);

  const value: IAPContextValue = { available: isIAPAvailable() };
  return <IAPContext.Provider value={value}>{children}</IAPContext.Provider>;
}

export function useIAPContext(): IAPContextValue {
  return useContext(IAPContext);
}
