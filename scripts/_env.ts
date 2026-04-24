/**
 * Shared .env.local loader for all CLI scripts under `scripts/`.
 *
 * `tsx scripts/foo.ts` does NOT load .env.local by itself, unlike `next dev`.
 * So every script that touches the DB or external APIs has to pull env vars
 * somehow. Instead of sprinkling copies of the loader everywhere, import
 * this module as the first thing:
 *
 *   import './_env';
 *
 * It parses `.env.local` (and `.env` as fallback) once, populates
 * `process.env` for keys not already set, and validates DATABASE_URL is
 * present — bailing out loudly with a clear message if not.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function loadEnvFile(path: string): void {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, 'utf8');
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
    // Shell-provided values always win over .env.local.
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile(join(process.cwd(), '.env.local'));
loadEnvFile(join(process.cwd(), '.env'));

if (!process.env.DATABASE_URL) {
  console.error(
    '❌ DATABASE_URL not set — neither shell env nor .env.local has it.\n' +
      '   Fix options:\n' +
      '     1. Ensure .env.local exists at repo root with DATABASE_URL=...\n' +
      '     2. Or set it inline: $env:DATABASE_URL="..." (PowerShell) / export DATABASE_URL=... (bash)',
  );
  process.exit(1);
}
