import { PLAN_LIMITS } from '@/lib/constants';

// ── Plan types ─────────────────────────────────────────────────────────────
export type PlanSlug = 'free' | 'pro' | 'premium';
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
      { key: 'pdf_export', label: 'Exportación PDF/GPX (con marca de agua)', included: true },
      { key: 'clean_export', label: 'Exportación sin marca de agua', included: false },
      { key: 'no_ads', label: 'Sin anuncios', included: false },
      { key: 'collaboration', label: 'Colaboración', included: false },
      { key: 'ai_autopilot', label: 'IA Autopilot', included: false },
      { key: 'social_connect', label: 'Conectar con viajeros', included: false },
      { key: 'offline', label: 'Modo offline', included: false },
    ],
    isRecommended: false,
  },
  {
    slug: 'pro',
    name: 'Pro',
    description: 'Para viajeros apasionados',
    priceMonthly: 9900, // $99 MXN
    priceAnnual: 79900, // $799 MXN (~33% off vs monthly x12)
    maxSavedTrips: PLAN_LIMITS.pro.maxSavedTrips,
    maxStopsPerTrip: PLAN_LIMITS.pro.maxStopsPerTrip,
    features: [
      { key: 'trips', label: '10 viajes guardados', included: true },
      { key: 'stops', label: 'Hasta 50 paradas por viaje', included: true },
      { key: 'map', label: 'Mapa básico', included: true },
      { key: 'explore', label: 'Exploración de lugares', included: true },
      { key: 'seo_pages', label: 'Páginas SEO públicas', included: true },
      { key: 'pdf_export', label: 'Exportación PDF/GPX', included: true },
      { key: 'clean_export', label: 'Exportación sin marca de agua', included: true },
      { key: 'no_ads', label: 'Sin anuncios', included: true },
      { key: 'collaboration', label: 'Colaboración en viajes', included: true },
      { key: 'ai_autopilot', label: `IA Autopilot (${PLAN_LIMITS.pro.aiAutopilotMonthly}/mes)`, included: true },
      { key: 'social_connect', label: 'Conectar con viajeros', included: true },
      { key: 'offline', label: 'Modo offline', included: false },
    ],
    isRecommended: true,
  },
  {
    slug: 'premium',
    name: 'Premium',
    description: 'La experiencia completa, sin límites',
    priceMonthly: 29900, // $299 MXN
    priceAnnual: 239900, // $2,399 MXN (~33% off vs monthly x12)
    maxSavedTrips: Infinity,
    maxStopsPerTrip: PLAN_LIMITS.premium.maxStopsPerTrip,
    features: [
      { key: 'trips', label: 'Viajes ilimitados', included: true },
      { key: 'stops', label: 'Hasta 150 paradas por viaje', included: true },
      { key: 'map', label: 'Mapa básico', included: true },
      { key: 'explore', label: 'Exploración de lugares', included: true },
      { key: 'seo_pages', label: 'Páginas SEO públicas', included: true },
      { key: 'pdf_export', label: 'Exportación PDF/GPX', included: true },
      { key: 'clean_export', label: 'Exportación sin marca de agua', included: true },
      { key: 'no_ads', label: 'Sin anuncios', included: true },
      { key: 'collaboration', label: 'Colaboración en viajes', included: true },
      { key: 'ai_autopilot', label: `IA Autopilot (${PLAN_LIMITS.premium.aiAutopilotMonthly}/mes)`, included: true },
      { key: 'social_connect', label: 'Conectar con viajeros', included: true },
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
    pro: 1,
    premium: 2,
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
export function formatPlanPrice(cents: number, locale: 'es' | 'en' = 'es'): string {
  if (cents === 0) return locale === 'en' ? 'Free' : 'Gratis';
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ── i18n for plan labels ────────────────────────────────────────────────────
const PLAN_NAME_EN: Record<PlanSlug, string> = {
  free: 'Free',
  pro: 'Pro',
  premium: 'Premium',
};

const PLAN_DESC_EN: Record<PlanSlug, string> = {
  free: 'To explore and try the platform',
  pro: 'For passionate travelers',
  premium: 'The complete experience, no limits',
};

const FEATURE_LABELS_EN: Record<string, (slug: PlanSlug) => string> = {
  trips: (slug) => {
    if (slug === 'free') return '1 saved trip';
    if (slug === 'pro') return '10 saved trips';
    return 'Unlimited trips';
  },
  stops: (slug) => {
    if (slug === 'free') return 'Up to 7 stops per trip';
    if (slug === 'pro') return 'Up to 50 stops per trip';
    return 'Up to 150 stops per trip';
  },
  map: () => 'Basic map',
  explore: () => 'Place exploration',
  seo_pages: () => 'Public SEO pages',
  pdf_export: (slug) =>
    slug === 'free' ? 'PDF/GPX export (watermarked)' : 'PDF/GPX export',
  clean_export: () => 'Export without watermark',
  no_ads: () => 'Ad-free',
  collaboration: () => 'Trip collaboration',
  ai_autopilot: (slug) => {
    if (slug === 'pro') return `AI Autopilot (${PLAN_LIMITS.pro.aiAutopilotMonthly}/mo)`;
    if (slug === 'premium') return `AI Autopilot (${PLAN_LIMITS.premium.aiAutopilotMonthly}/mo)`;
    return 'AI Autopilot';
  },
  social_connect: () => 'Connect with travelers',
  offline: () => 'Offline mode',
};

/** Return a localized version of a plan */
export function localizePlan(plan: Plan, locale: 'es' | 'en'): Plan {
  if (locale !== 'en') return plan;
  return {
    ...plan,
    name: PLAN_NAME_EN[plan.slug] ?? plan.name,
    description: PLAN_DESC_EN[plan.slug] ?? plan.description,
    features: plan.features.map((f) => ({
      ...f,
      label: FEATURE_LABELS_EN[f.key]?.(plan.slug) ?? f.label,
    })),
  };
}

export function getLocalizedPlans(locale: 'es' | 'en'): Plan[] {
  return PLANS.map((p) => localizePlan(p, locale));
}
