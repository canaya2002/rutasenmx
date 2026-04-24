/**
 * Seeds the `subscription_plans` table from src/lib/subscription/plans.ts.
 *
 * The table is the source of truth that Stripe webhooks use to resolve a
 * plan slug into a plan UUID (see src/lib/subscription/current-plan.ts).
 * Without these rows seeded, paid subscriptions cannot be stored.
 *
 * Idempotent: upserts by slug.
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx tsx scripts/seed-plans.ts
 *   DATABASE_URL=postgres://... npx tsx scripts/seed-plans.ts --dry-run
 *
 * It also reads STRIPE_PRICE_{PLAN}_{INTERVAL} env vars and writes them
 * into the rows' stripePriceIdMonthly/Annual columns so the DB matches
 * what Stripe knows. Run `scripts/setup-stripe.ts` first to populate those.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';

import { db, subscriptionPlans } from '../src/db';
import { PLANS } from '../src/lib/subscription/plans';

const DRY_RUN = process.argv.includes('--dry-run');

// ── Load .env.local for local runs ─────────────────────────────────────────
(function loadEnv() {
  const envPath = join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, 'utf-8');
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
    if (process.env[key] == null) process.env[key] = val;
  }
})();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set (checked shell env and .env.local)');
  process.exit(1);
}

async function main() {
  console.log('=== RutasEnMX :: seed subscription_plans ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);

  for (let i = 0; i < PLANS.length; i++) {
    const plan = PLANS[i];
    const SLUG = plan.slug.toUpperCase();
    const stripeMonthly = process.env[`STRIPE_PRICE_${SLUG}_MONTHLY`] ?? null;
    const stripeAnnual = process.env[`STRIPE_PRICE_${SLUG}_ANNUAL`] ?? null;

    const featuresJson: Record<string, unknown> = {};
    for (const f of plan.features) featuresJson[f.key] = f.included;

    const values = {
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      priceMonthlyCents: plan.priceMonthly,
      priceAnnualCents: plan.priceAnnual,
      currency: 'MXN',
      stripePriceIdMonthly: stripeMonthly,
      stripePriceIdAnnual: stripeAnnual,
      // Infinity is not representable in Postgres integer; use null to mean "no limit".
      maxSavedTrips: plan.maxSavedTrips === Infinity ? null : plan.maxSavedTrips,
      maxStopsPerTrip:
        plan.maxStopsPerTrip === Infinity ? null : plan.maxStopsPerTrip,
      features: featuresJson,
      isActive: true,
      sortOrder: i,
    };

    const priceLabel =
      plan.priceMonthly === 0
        ? 'free'
        : `$${(plan.priceMonthly / 100).toFixed(0)}/mo`;
    console.log(
      `\n▶ ${plan.name.padEnd(10)} (${plan.slug}) ${priceLabel}`,
    );
    console.log(`  stripeMonthly: ${stripeMonthly ?? '(not set — skip paid flow)'}`);
    console.log(`  stripeAnnual:  ${stripeAnnual ?? '(not set — skip paid flow)'}`);

    if (DRY_RUN) continue;

    const [existing] = await db
      .select({ id: subscriptionPlans.id })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.slug, plan.slug))
      .limit(1);

    if (existing) {
      await db
        .update(subscriptionPlans)
        .set(values)
        .where(eq(subscriptionPlans.id, existing.id));
      console.log(`  ✓ Updated row ${existing.id}`);
    } else {
      const [created] = await db
        .insert(subscriptionPlans)
        .values(values)
        .returning({ id: subscriptionPlans.id });
      console.log(`  ✓ Inserted row ${created.id}`);
    }
  }

  console.log('\n✓ Done. subscription_plans is in sync with src/lib/subscription/plans.ts');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ seed-plans failed:', err);
    process.exit(1);
  });
