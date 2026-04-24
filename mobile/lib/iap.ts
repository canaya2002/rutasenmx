/**
 * Thin wrapper around react-native-purchases (RevenueCat SDK).
 *
 * Why a wrapper:
 *   - The SDK isn't loaded at all in Expo Go (native module). We dynamically
 *     require it so the app still launches for devs running `expo start`.
 *   - We keep ALL calls in one file so a future provider swap (Glassfy,
 *     Adapty, Stripe Mobile) only touches this file.
 *   - We never expose the provider's types upward — callers see our types.
 *
 * Environment:
 *   - `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`
 *     from eas.json or app.json extra.
 *
 * ALL errors are swallowed and reported via structured returns — the caller
 * decides how to surface them. An uncaught error here would crash the app
 * on devices without the native module (e.g., Expo Go).
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import type { PlanSlug } from '@shared/index';

export interface IAPOffering {
  /** Identifier of the offering in RevenueCat (usually "default"). */
  identifier: string;
  packages: IAPPackage[];
}

export interface IAPPackage {
  /** "$rc_monthly", "$rc_annual", etc. */
  identifier: string;
  /** Our plan slug, derived from product id. */
  planSlug: PlanSlug | null;
  /** 'monthly' | 'annual' (derived). */
  interval: 'monthly' | 'annual' | 'one_time';
  /** Localized price string, e.g. "$99.00 MXN". */
  priceString: string;
  /** Raw numeric price in the user's currency. */
  price: number;
  currencyCode: string;
  /** Original store product id — "pro_monthly", etc. */
  productId: string;
}

export interface IAPEntitlementsSnapshot {
  activePlan: PlanSlug | null;
  expiresAt: string | null;
  /** Store the current-active entitlement came from, if any. */
  source: 'apple_iap' | 'google_iap' | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: dynamic require
// ─────────────────────────────────────────────────────────────────────────────
type PurchasesModule = typeof import('react-native-purchases').default;
let cached: PurchasesModule | null = null;
let cacheInited = false;

function getPurchases(): PurchasesModule | null {
  if (cacheInited) return cached;
  cacheInited = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-purchases');
    cached = (mod?.default ?? mod) as PurchasesModule;
    return cached;
  } catch {
    // Expo Go / web / any env without the native module.
    cached = null;
    return null;
  }
}

function apiKey(): string | null {
  const ios =
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ??
    (Constants.expoConfig?.extra?.revenueCatIos as string | undefined);
  const android =
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ??
    (Constants.expoConfig?.extra?.revenueCatAndroid as string | undefined);
  return Platform.OS === 'ios' ? (ios ?? null) : (android ?? null);
}

function planFromProductId(productId: string): PlanSlug | null {
  const lower = productId.toLowerCase();
  if (lower.includes('premium')) return 'premium';
  if (lower.includes('pro')) return 'pro';
  return null;
}

function intervalFromProductId(
  productId: string,
): 'monthly' | 'annual' | 'one_time' {
  const lower = productId.toLowerCase();
  if (lower.includes('annual') || lower.includes('year')) return 'annual';
  if (lower.includes('month')) return 'monthly';
  return 'one_time';
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────
export function isIAPAvailable(): boolean {
  return getPurchases() !== null && apiKey() !== null;
}

/**
 * Initialise the SDK and bind the current userId as the RevenueCat app_user_id.
 * Safe to call multiple times — after the first successful configure, it
 * only re-logs the userId.
 */
let configured = false;
export async function configureIAP(userId: string | null): Promise<void> {
  const P = getPurchases();
  const key = apiKey();
  if (!P || !key) return;

  try {
    if (!configured) {
      P.configure({ apiKey: key, appUserID: userId ?? undefined });
      configured = true;
    } else if (userId) {
      await P.logIn(userId);
    } else {
      await P.logOut();
    }
  } catch (err) {
    console.warn('[iap] configure failed', err);
  }
}

/** Fetch the available offerings (plans) from RevenueCat. */
export async function fetchOfferings(): Promise<IAPOffering | null> {
  const P = getPurchases();
  if (!P) return null;

  try {
    const offerings = await P.getOfferings();
    const current = offerings.current;
    if (!current) return null;

    const packages: IAPPackage[] = current.availablePackages.map(
      (pkg): IAPPackage => {
        const productId = pkg.product.identifier;
        return {
          identifier: pkg.identifier,
          planSlug: planFromProductId(productId),
          interval: intervalFromProductId(productId),
          priceString: pkg.product.priceString,
          price: pkg.product.price,
          currencyCode: pkg.product.currencyCode,
          productId,
        };
      },
    );

    return { identifier: current.identifier, packages };
  } catch (err) {
    console.warn('[iap] fetchOfferings failed', err);
    return null;
  }
}

export type PurchaseOutcome =
  | { kind: 'success'; productId: string; planSlug: PlanSlug | null }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string }
  | { kind: 'unavailable' };

export async function purchasePackage(
  pkgIdentifier: string,
): Promise<PurchaseOutcome> {
  const P = getPurchases();
  if (!P) return { kind: 'unavailable' };

  try {
    const offerings = await P.getOfferings();
    const current = offerings.current;
    if (!current) {
      return { kind: 'error', message: 'No hay planes disponibles' };
    }
    const pkg = current.availablePackages.find(
      (p) => p.identifier === pkgIdentifier,
    );
    if (!pkg) {
      return { kind: 'error', message: 'Plan no encontrado' };
    }

    const result = await P.purchasePackage(pkg);
    return {
      kind: 'success',
      productId: result.productIdentifier,
      planSlug: planFromProductId(result.productIdentifier),
    };
  } catch (err: unknown) {
    // RevenueCat sets `userCancelled: true` on the error object when the
    // user taps "Cancel" in the purchase sheet.
    const cancelled =
      typeof err === 'object' &&
      err !== null &&
      'userCancelled' in err &&
      (err as { userCancelled: boolean }).userCancelled === true;
    if (cancelled) return { kind: 'cancelled' };

    const message = err instanceof Error ? err.message : 'Error de compra';
    return { kind: 'error', message };
  }
}

export async function restorePurchases(): Promise<IAPEntitlementsSnapshot | null> {
  const P = getPurchases();
  if (!P) return null;
  try {
    const info = await P.restorePurchases();
    return snapshotFromCustomerInfo(info);
  } catch (err) {
    console.warn('[iap] restore failed', err);
    return null;
  }
}

export async function fetchActiveEntitlements(): Promise<IAPEntitlementsSnapshot | null> {
  const P = getPurchases();
  if (!P) return null;
  try {
    const info = await P.getCustomerInfo();
    return snapshotFromCustomerInfo(info);
  } catch (err) {
    console.warn('[iap] fetch entitlements failed', err);
    return null;
  }
}

type CustomerInfo = Awaited<
  ReturnType<NonNullable<ReturnType<typeof getPurchases>>['getCustomerInfo']>
>;

function snapshotFromCustomerInfo(info: CustomerInfo): IAPEntitlementsSnapshot {
  const entries = Object.values(info.entitlements.active);
  if (entries.length === 0) {
    return { activePlan: null, expiresAt: null, source: null };
  }
  // Pick the highest: premium beats pro.
  const hasPremium = entries.some((e) =>
    e.productIdentifier.toLowerCase().includes('premium'),
  );
  const activePlan: PlanSlug = hasPremium ? 'premium' : 'pro';
  const entitlement =
    entries.find((e) =>
      e.productIdentifier.toLowerCase().includes(activePlan),
    ) ?? entries[0];
  const store = entitlement.store;
  const source =
    store === 'APP_STORE'
      ? ('apple_iap' as const)
      : store === 'PLAY_STORE'
        ? ('google_iap' as const)
        : null;
  return {
    activePlan,
    expiresAt: entitlement.expirationDate ?? null,
    source,
  };
}
