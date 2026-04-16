import { PLAN_LIMITS } from '@/lib/constants';

// ── Plan types ─────────────────────────────────────────────────────────────
export type PlanSlug = 'free' | 'basic' | 'pro' | 'premium';
export type BillingInterval = 'monthly' | 'annual';

export interface PlanFeature {
  key: string;
  label: string;
  included: boolean;
}

export interface Plan {
  slug: PlanSlug;
  name: string;
  description: string;
  priceMonthly: number; // cents MXN
  priceAnnual: number;  // cents MXN
  maxSavedTrips: number;
  maxStopsPerTrip: number;
  features: PlanFeature[];
  isRecommended: boolean;
}

// ── Plan data ──────────────────────────────────────────────────────────────
export const PLANS: Plan[] = [
  {
    slug: 'free',
    name: 'Gratis',
    description: 'Para explorar y probar la plataforma',
    priceMonthly: 0,
    priceAnnual: 0,
    maxSavedTrips: PLAN_LIMITS.free.maxSavedTrips,
    maxStopsPerTrip: PLAN_LIMITS.free.maxStopsPerTrip,
    features: [
      { key: 'trips', label: '1 viaje guardado', included: true },
      { key: 'stops', label: 'Hasta 7 paradas por viaje', included: true },
      { key: 'map', label: 'Mapa básico', included: true },
      { key: 'explore', label: 'Exploración de lugares', included: true },
      { key: 'seo_pages', label: 'Páginas SEO públicas', included: true },
      { key: 'pdf_export', label: 'Exportación PDF/GPX', included: false },
      { key: 'no_ads', label: 'Sin anuncios', included: false },
      { key: 'collaboration', label: 'Colaboración', included: false },
      { key: 'ai_autopilot', label: 'IA Autopilot', included: false },
      { key: 'offline', label: 'Modo offline', included: false },
    ],
    isRecommended: false,
  },
  {
    slug: 'basic',
    name: 'Básico',
    description: 'Para viajeros frecuentes',
    priceMonthly: 9900, // $99 MXN
    priceAnnual: 79900, // $799 MXN
    maxSavedTrips: PLAN_LIMITS.basic.maxSavedTrips,
    maxStopsPerTrip: PLAN_LIMITS.basic.maxStopsPerTrip,
    features: [
      { key: 'trips', label: '3 viajes guardados', included: true },
      { key: 'stops', label: 'Hasta 20 paradas por viaje', included: true },
      { key: 'map', label: 'Mapa básico', included: true },
      { key: 'explore', label: 'Exploración de lugares', included: true },
      { key: 'seo_pages', label: 'Páginas SEO públicas', included: true },
      { key: 'pdf_export', label: 'Exportación PDF/GPX', included: true },
      { key: 'no_ads', label: 'Sin anuncios', included: false },
      { key: 'collaboration', label: 'Colaboración', included: false },
      { key: 'ai_autopilot', label: 'IA Autopilot', included: false },
      { key: 'offline', label: 'Modo offline', included: false },
    ],
    isRecommended: false,
  },
  {
    slug: 'pro',
    name: 'Pro',
    description: 'Para viajeros apasionados',
    priceMonthly: 19900, // $199 MXN
    priceAnnual: 159900, // $1,599 MXN
    maxSavedTrips: PLAN_LIMITS.pro.maxSavedTrips,
    maxStopsPerTrip: PLAN_LIMITS.pro.maxStopsPerTrip,
    features: [
      { key: 'trips', label: '5 viajes guardados', included: true },
      { key: 'stops', label: 'Hasta 50 paradas por viaje', included: true },
      { key: 'map', label: 'Mapa básico', included: true },
      { key: 'explore', label: 'Exploración de lugares', included: true },
      { key: 'seo_pages', label: 'Páginas SEO públicas', included: true },
      { key: 'pdf_export', label: 'Exportación PDF/GPX', included: true },
      { key: 'no_ads', label: 'Sin anuncios', included: true },
      { key: 'collaboration', label: 'Colaboración', included: true },
      { key: 'ai_autopilot', label: 'IA Autopilot', included: false },
      { key: 'offline', label: 'Modo offline', included: false },
    ],
    isRecommended: true,
  },
  {
    slug: 'premium',
    name: 'Premium',
    description: 'La experiencia completa',
    priceMonthly: 34900, // $349 MXN
    priceAnnual: 279900, // $2,799 MXN
    maxSavedTrips: Infinity,
    maxStopsPerTrip: PLAN_LIMITS.premium.maxStopsPerTrip,
    features: [
      { key: 'trips', label: 'Viajes ilimitados', included: true },
      { key: 'stops', label: 'Hasta 150 paradas por viaje', included: true },
      { key: 'map', label: 'Mapa básico', included: true },
      { key: 'explore', label: 'Exploración de lugares', included: true },
      { key: 'seo_pages', label: 'Páginas SEO públicas', included: true },
      { key: 'pdf_export', label: 'Exportación PDF/GPX', included: true },
      { key: 'no_ads', label: 'Sin anuncios', included: true },
      { key: 'collaboration', label: 'Colaboración', included: true },
      { key: 'ai_autopilot', label: 'IA Autopilot', included: true },
      { key: 'offline', label: 'Modo offline', included: true },
    ],
    isRecommended: false,
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Get a plan by slug */
export function getPlan(slug: PlanSlug): Plan {
  const plan = PLANS.find((p) => p.slug === slug);
  if (!plan) throw new Error(`Plan not found: ${slug}`);
  return plan;
}

/** Get plan price for a given interval in cents */
export function getPlanPrice(slug: PlanSlug, interval: BillingInterval): number {
  const plan = getPlan(slug);
  return interval === 'monthly' ? plan.priceMonthly : plan.priceAnnual;
}

/** Check if a user's plan meets the minimum required plan */
export function meetsMinimumPlan(userPlan: PlanSlug, requiredPlan: PlanSlug): boolean {
  const hierarchy: Record<PlanSlug, number> = {
    free: 0,
    basic: 1,
    pro: 2,
    premium: 3,
  };
  return hierarchy[userPlan] >= hierarchy[requiredPlan];
}

/** Check if user can create another trip given current count */
export function checkTripLimit(plan: PlanSlug, currentCount: number): boolean {
  const limits = PLAN_LIMITS[plan];
  return currentCount < limits.maxSavedTrips;
}

/** Check if user can add another stop given current count */
export function checkStopLimit(plan: PlanSlug, currentCount: number): boolean {
  const limits = PLAN_LIMITS[plan];
  return currentCount < limits.maxStopsPerTrip;
}

/** Check if a feature is available for a plan */
export function canAccess(plan: PlanSlug, featureKey: string): boolean {
  const planData = getPlan(plan);
  const feature = planData.features.find((f) => f.key === featureKey);
  return feature?.included ?? false;
}

/** Format price in MXN from cents */
export function formatPlanPrice(cents: number): string {
  if (cents === 0) return 'Gratis';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
