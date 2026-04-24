/**
 * Tests for the env validation helper. Core invariant: a placeholder value
 * (e.g. `generate-a-random-secret-here`) must be treated as "not set" so a
 * deploy that forgot to replace a scaffold value doesn't silently look OK.
 */
import { describe, it, expect, beforeEach } from 'vitest';

import { getEnvStatus } from '@/lib/env';

describe('getEnvStatus', () => {
  const backup: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of [
      'DATABASE_URL',
      'AUTH_SECRET',
      'NEXT_PUBLIC_APP_URL',
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'MAPBOX_SECRET_TOKEN',
      'NEXT_PUBLIC_MAPBOX_TOKEN',
      'ANTHROPIC_API_KEY',
      'SMTP_HOST',
      'SMTP_PASSWORD',
      'S3_ENDPOINT',
      'S3_ACCESS_KEY',
      'S3_SECRET_KEY',
    ]) {
      backup[key] = process.env[key];
      delete process.env[key];
    }
  });

  it('marks empty env vars as missing', () => {
    const report = getEnvStatus();
    const db = report.find((r) => r.key === 'DATABASE_URL')!;
    expect(db.state).toBe('missing');
    expect(db.required).toBe(true);
  });

  it('flags placeholder values as NOT ok', () => {
    process.env.AUTH_SECRET = 'generate-a-random-secret-here';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    process.env.STRIPE_SECRET_KEY = 'sk_test_your_stripe_key';
    const report = getEnvStatus();
    expect(report.find((r) => r.key === 'AUTH_SECRET')?.state).toBe(
      'placeholder',
    );
    expect(report.find((r) => r.key === 'NEXT_PUBLIC_APP_URL')?.state).toBe(
      'placeholder',
    );
    expect(report.find((r) => r.key === 'STRIPE_SECRET_KEY')?.state).toBe(
      'placeholder',
    );
  });

  it('marks real-looking values as ok', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@prod-host:5432/db';
    process.env.AUTH_SECRET = 'a'.repeat(64);
    process.env.NEXT_PUBLIC_APP_URL = 'https://rutasenmx.com';
    process.env.STRIPE_SECRET_KEY = 'sk_live_realkey';
    const report = getEnvStatus();
    expect(report.find((r) => r.key === 'DATABASE_URL')?.state).toBe('ok');
    expect(report.find((r) => r.key === 'AUTH_SECRET')?.state).toBe('ok');
    expect(
      report.find((r) => r.key === 'NEXT_PUBLIC_APP_URL')?.state,
    ).toBe('ok');
    expect(report.find((r) => r.key === 'STRIPE_SECRET_KEY')?.state).toBe(
      'ok',
    );
  });

  it('returns every tracked key', () => {
    const report = getEnvStatus();
    const keys = report.map((r) => r.key);
    // Must include the unmissable ones even when none of them are set.
    expect(keys).toContain('DATABASE_URL');
    expect(keys).toContain('AUTH_SECRET');
    expect(keys).toContain('STRIPE_WEBHOOK_SECRET');
  });
});
