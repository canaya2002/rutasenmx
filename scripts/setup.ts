/**
 * Master setup orchestrator for Rutas en MX.
 *
 * Runs, in order:
 *   1. docker compose up -d  (Postgres + Redis + MinIO) — skipped if --no-docker
 *   2. drizzle-kit push       (schema → DB)
 *   3. scripts/seed.ts        (catalog: estados, pueblos, zonas)
 *   4. scripts/setup-stripe.ts (products + prices, writes STRIPE_PRICE_*)
 *   5. scripts/seed-plans.ts  (subscription_plans table ← plans.ts + stripe ids)
 *
 * Each step prints its command so you know exactly what's running and can
 * re-run individually if something fails.
 *
 * Usage:
 *   npx tsx scripts/setup.ts
 *   npx tsx scripts/setup.ts --no-docker   (skip docker compose, you manage DB)
 *   npx tsx scripts/setup.ts --no-stripe   (skip Stripe setup)
 *   npx tsx scripts/setup.ts --dry-run     (no DB writes, no Stripe writes)
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const flags = new Set(process.argv.slice(2));
const DRY_RUN = flags.has('--dry-run');
const NO_DOCKER = flags.has('--no-docker');
const NO_STRIPE = flags.has('--no-stripe');

function run(cmd: string, args: string[], opts: { optional?: boolean } = {}) {
  return new Promise<void>((resolve, reject) => {
    console.log(`\n$ ${cmd} ${args.join(' ')}`);
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('close', (code) => {
      if (code === 0) return resolve();
      if (opts.optional) {
        console.log(`  (step exited with ${code}, continuing because it's optional)`);
        return resolve();
      }
      reject(new Error(`${cmd} exited with code ${code}`));
    });
    child.on('error', (err) => {
      if (opts.optional) {
        console.log(`  (step failed, continuing: ${err.message})`);
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(' Rutas en MX :: one-shot setup');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  flags: ${[...flags].join(' ') || '(none)'}`);

  // Step 1: Docker infra
  if (!NO_DOCKER) {
    console.log('\n▶ 1/5  Starting local infra (Postgres + Redis + MinIO)…');
    const hasDockerCompose = existsSync(join(process.cwd(), 'docker-compose.yml'));
    if (!hasDockerCompose) {
      console.log('  (docker-compose.yml not found — skipping)');
    } else {
      await run('docker', ['compose', 'up', '-d'], { optional: true });
    }
  } else {
    console.log('\n▶ 1/5  Skipping docker (--no-docker)');
  }

  // Step 2: Schema push
  console.log('\n▶ 2/5  Pushing Drizzle schema to DB…');
  if (DRY_RUN) {
    console.log('  (dry-run: skipping db:push)');
  } else {
    await run('npx', ['drizzle-kit', 'push']);
  }

  // Step 3: Catalog seed
  console.log('\n▶ 3/5  Seeding catalog data…');
  await run(
    'npx',
    ['tsx', 'scripts/seed.ts', ...(DRY_RUN ? ['--dry-run'] : [])],
    { optional: true },
  );

  // Step 4: Stripe products/prices
  if (!NO_STRIPE) {
    console.log('\n▶ 4/5  Configuring Stripe products + prices…');
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log(
        '  (STRIPE_SECRET_KEY not set — skip. Rerun with it to populate prices.)',
      );
    } else {
      await run(
        'npx',
        ['tsx', 'scripts/setup-stripe.ts', ...(DRY_RUN ? ['--dry-run'] : [])],
      );
    }
  } else {
    console.log('\n▶ 4/5  Skipping Stripe (--no-stripe)');
  }

  // Step 5: Plans seed (reads STRIPE_PRICE_* written above)
  console.log('\n▶ 5/6  Seeding subscription_plans table…');
  await run(
    'npx',
    ['tsx', 'scripts/seed-plans.ts', ...(DRY_RUN ? ['--dry-run'] : [])],
  );

  // Step 6: Editorial forums + channels so /comunidad isn't empty on day one.
  console.log('\n▶ 6/6  Seeding editorial forums + channels…');
  if (DRY_RUN) {
    console.log('  (dry-run: skipping seed-social-communities)');
  } else {
    await run(
      'npx',
      ['tsx', 'scripts/seed-social-communities.ts'],
      { optional: true },
    );
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(' ✓ Setup complete.');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\nWhat\'s next:');
  console.log('  • npm run dev           — start the app');
  console.log('  • stripe listen --forward-to localhost:3000/api/stripe/webhook');
  console.log('    (then paste the signing secret into STRIPE_WEBHOOK_SECRET)');
  console.log('  • Visit http://localhost:3000/autopilot and generate a trip.');
}

main().catch((err) => {
  console.error('\n❌ setup failed:', err.message ?? err);
  process.exit(1);
});
