import Stripe from 'stripe';
import { loadStripe, type Stripe as StripeClient } from '@stripe/stripe-js';

// ── Server-side Stripe instance ─────────────────────────────────────────────
let serverStripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (serverStripe) return serverStripe;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }

  serverStripe = new Stripe(secretKey, {
    apiVersion: '2026-03-25.dahlia',
    typescript: true,
    appInfo: {
      name: 'RutasEnMX',
      url: 'https://rutasenmx.com',
    },
  });

  return serverStripe;
}

// ── Client-side Stripe loader ───────────────────────────────────────────────
let stripePromise: Promise<StripeClient | null> | null = null;

export function getStripeClient(): Promise<StripeClient | null> {
  if (stripePromise) return stripePromise;

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
    return Promise.resolve(null);
  }

  stripePromise = loadStripe(publishableKey, {
    locale: 'es-419',
  });

  return stripePromise;
}

// ── Webhook signature verification ──────────────────────────────────────────
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
): Stripe.Event {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
  }

  return getStripe().webhooks.constructEvent(payload, signature, endpointSecret);
}

// ── Plan-to-price mapping ───────────────────────────────────────────────────
export const STRIPE_PRICE_IDS = {
  basic_monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY ?? '',
  basic_yearly: process.env.STRIPE_PRICE_BASIC_YEARLY ?? '',
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? '',
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? '',
  premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY ?? '',
  premium_yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY ?? '',
} as const;

export type StripePriceId = keyof typeof STRIPE_PRICE_IDS;
