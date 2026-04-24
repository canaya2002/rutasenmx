/**
 * One-shot Stripe setup for Rutas en MX.
 *
 * Idempotent: re-running it will detect existing products by slug metadata
 * and reuse them, creating only missing prices. Safe to run repeatedly.
 *
 * What it does:
 *   1. Reads PLANS from src/lib/subscription/plans.ts
 *   2. For each paid plan (basic/pro/premium):
 *       - Creates or finds a Stripe Product with metadata.planSlug
 *       - Creates monthly + annual recurring Prices in MXN at the cents
 *         defined in plans.ts
 *   3. Writes STRIPE_PRICE_{PLAN}_{INTERVAL} entries to .env.local,
 *      preserving everything else in the file.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/setup-stripe.ts
 *   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/setup-stripe.ts --dry-run
 *
 * Prereqs:
 *   - STRIPE_SECRET_KEY must be in the shell env OR in .env.local.
 *   - Use a test-mode key (sk_test_...) the first time. Switch to live
 *     only when you're ready to accept real money.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import Stripe from 'stripe';
import { PLANS, type PlanSlug } from '../src/lib/subscription/plans';

const DRY_RUN = process.argv.includes('--dry-run');
const ENV_FILE = join(process.cwd(), '.env.local');

// ── Load .env.local before touching the network ────────────────────────────
// Minimal parser: we don't want to add dotenv just for a setup script.
function loadEnvLocal(): Record<string, string> {
  if (!existsSync(ENV_FILE)) return {};
  const raw = readFileSync(ENV_FILE, 'utf-8');
  const map: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    map[key] = val;
  }
  return map;
}

const envLocal = loadEnvLocal();
for (const [k, v] of Object.entries(envLocal)) {
  if (process.env[k] == null) process.env[k] = v;
}

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error('❌ STRIPE_SECRET_KEY is not set (checked shell env and .env.local)');
  process.exit(1);
}

const isLive = secretKey.startsWith('sk_live_');
console.log(
  `🔑 Stripe key: ${secretKey.slice(0, 10)}… (${isLive ? 'LIVE' : 'TEST'} mode)`,
);
if (isLive && !process.argv.includes('--i-know-this-is-live')) {
  console.error(
    '\n⚠  You passed a LIVE secret key. Re-run with --i-know-this-is-live to continue.',
  );
  process.exit(1);
}

const stripe = new Stripe(secretKey);

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const paidPlans = PLANS.filter((p) => p.slug !== 'free');
  const results: Array<{
    slug: PlanSlug;
    productId: string;
    monthlyPriceId: string;
    annualPriceId: string;
  }> = [];

  for (const plan of paidPlans) {
    console.log(`\n▶ Plan: ${plan.name} (${plan.slug})`);

    // Find existing product by metadata.planSlug (idempotency key).
    const existing = await stripe.products.search({
      query: `active:'true' AND metadata['planSlug']:'${plan.slug}'`,
      limit: 1,
    });

    let product: Stripe.Product;
    if (existing.data.length > 0) {
      product = existing.data[0];
      console.log(`  · Reusing product ${product.id}`);
      if (!DRY_RUN) {
        await stripe.products.update(product.id, {
          name: plan.name,
          description: plan.description,
          metadata: { planSlug: plan.slug },
        });
      }
    } else if (DRY_RUN) {
      console.log(`  · [dry-run] Would create product "${plan.name}"`);
      product = { id: 'prod_dryrun' } as Stripe.Product;
    } else {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { planSlug: plan.slug },
      });
      console.log(`  · Created product ${product.id}`);
    }

    // Existing prices on the product (reuse if the amount matches).
    const existingPrices = DRY_RUN
      ? { data: [] as Stripe.Price[] }
      : await stripe.prices.list({ product: product.id, active: true, limit: 100 });

    async function ensurePrice(
      interval: 'month' | 'year',
      amountCents: number,
    ): Promise<string> {
      const match = existingPrices.data.find(
        (p) =>
          p.recurring?.interval === interval &&
          p.currency === 'mxn' &&
          p.unit_amount === amountCents,
      );
      if (match) {
        console.log(
          `    · Reusing ${interval} price ${match.id} ($${(amountCents / 100).toFixed(0)} MXN)`,
        );
        return match.id;
      }
      if (DRY_RUN) {
        console.log(
          `    · [dry-run] Would create ${interval} price ($${(amountCents / 100).toFixed(0)} MXN)`,
        );
        return `price_dryrun_${plan.slug}_${interval}`;
      }
      const created = await stripe.prices.create({
        product: product.id,
        currency: 'mxn',
        unit_amount: amountCents,
        recurring: { interval },
        metadata: { planSlug: plan.slug, billing: interval === 'month' ? 'monthly' : 'annual' },
      });
      console.log(
        `    · Created ${interval} price ${created.id} ($${(amountCents / 100).toFixed(0)} MXN)`,
      );
      return created.id;
    }

    const monthlyPriceId = await ensurePrice('month', plan.priceMonthly);
    const annualPriceId = await ensurePrice('year', plan.priceAnnual);

    results.push({
      slug: plan.slug,
      productId: product.id,
      monthlyPriceId,
      annualPriceId,
    });
  }

  // ── Print env block ──────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(64));
  console.log('STRIPE PRICE IDS — copy into .env.local (done automatically below):');
  console.log('═'.repeat(64));
  const envBlock: string[] = [];
  for (const r of results) {
    const SLUG = r.slug.toUpperCase();
    envBlock.push(`STRIPE_PRICE_${SLUG}_MONTHLY=${r.monthlyPriceId}`);
    envBlock.push(`STRIPE_PRICE_${SLUG}_ANNUAL=${r.annualPriceId}`);
  }
  for (const line of envBlock) console.log(line);
  console.log('═'.repeat(64));

  if (DRY_RUN) {
    console.log('\n(dry-run; .env.local not modified)');
    return;
  }

  // ── Write to .env.local without clobbering the rest ─────────────────────
  const existingEnv = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf-8') : '';
  const lines = existingEnv.split(/\r?\n/);
  const updates = new Map(envBlock.map((l) => [l.split('=')[0], l]));

  const rewritten: string[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      rewritten.push(line);
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq < 0) {
      rewritten.push(line);
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    if (updates.has(key)) {
      rewritten.push(updates.get(key)!);
      seen.add(key);
    } else {
      rewritten.push(line);
    }
  }
  // Append anything not yet in the file.
  const missing = envBlock.filter((l) => !seen.has(l.split('=')[0]));
  if (missing.length > 0) {
    if (rewritten.length > 0 && rewritten[rewritten.length - 1].trim() !== '') {
      rewritten.push('');
    }
    rewritten.push('# Stripe price IDs (written by scripts/setup-stripe.ts)');
    rewritten.push(...missing);
  }

  writeFileSync(ENV_FILE, rewritten.join('\n'), 'utf-8');
  console.log(`\n✓ Wrote ${envBlock.length} STRIPE_PRICE_* entries to ${ENV_FILE}`);

  // ── Webhook setup reminder ──────────────────────────────────────────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://rutasenmx.com';
  console.log('\nNext step: configure the Stripe webhook.');
  console.log(`  URL:   ${appUrl}/api/stripe/webhook`);
  console.log('  Events:');
  console.log('    - checkout.session.completed');
  console.log('    - customer.subscription.updated');
  console.log('    - customer.subscription.deleted');
  console.log('    - invoice.payment_succeeded');
  console.log('    - invoice.payment_failed');
  console.log('  Then paste the signing secret into STRIPE_WEBHOOK_SECRET.');
  console.log(
    '\n  For local dev: `stripe listen --forward-to localhost:3000/api/stripe/webhook`',
  );
}

main().catch((err) => {
  console.error('\n❌ setup-stripe failed:', err);
  process.exit(1);
});
