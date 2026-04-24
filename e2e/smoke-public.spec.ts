import { test, expect } from '@playwright/test';

/**
 * Public-navigation smoke.
 *
 * Goal: catch regressions that break first impressions — homepage, pricing,
 * autopilot landing, and public catalogue hubs. Uses only public routes so
 * it runs without DB or auth setup.
 *
 * If you add a new flag-gated surface (e.g. /conectar under FEATURE_SOCIAL),
 * add it here behind the same flag so the smoke reflects the launch config.
 */
test.describe('public surface smoke', () => {
  test('home renders and links to core hubs', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Rutas en MX|Rutas en M/i);

    // Header nav should expose explorar / rutas / pueblos-magicos / guias.
    const nav = page.getByRole('navigation', { name: /principal/i }).first();
    await expect(nav).toBeVisible();
  });

  test('pricing page renders all plan tiers', async ({ page }) => {
    await page.goto('/precios');
    // Plan names should appear — they are the most stable contract.
    for (const name of ['Gratis', 'Básico', 'Pro', 'Premium']) {
      await expect(page.getByText(name, { exact: false }).first()).toBeVisible();
    }
  });

  test('autopilot landing renders the wizard entrypoint', async ({ page }) => {
    await page.goto('/autopilot');
    // Step 1 of the wizard asks for origin.
    await expect(
      page.getByText(/origen/i).first(),
    ).toBeVisible();
  });

  test('public catalogue hubs return 200', async ({ page }) => {
    for (const path of [
      '/pueblos-magicos',
      '/museos',
      '/zonas-arqueologicas',
      '/estados',
      '/rutas',
      '/explorar',
    ]) {
      const res = await page.goto(path);
      expect(res?.status(), `${path} should be 200`).toBeLessThan(400);
    }
  });

  test('social surface respects FEATURE_SOCIAL flag', async ({ page }) => {
    // Defaults to enabled in code (see src/lib/feature-flags.ts). Only
    // explicit `false` disables it.
    const flag =
      process.env.NEXT_PUBLIC_FEATURE_SOCIAL ?? process.env.FEATURE_SOCIAL;
    const socialEnabled = flag !== 'false' && flag !== '0';

    const res = await page.goto('/conectar');
    if (socialEnabled) {
      expect(res?.status()).toBeLessThan(400);
    } else {
      expect(res?.status()).toBe(404);
    }
  });

  test('robots.txt is served', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('User-agent');
  });

  test('sitemap is served', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
  });
});

test.describe('plan gating contracts', () => {
  test('unauthenticated checkout POST is rejected with 401', async ({
    request,
  }) => {
    const res = await request.post('/api/stripe/checkout', {
      data: { plan: 'pro', interval: 'monthly' },
    });
    expect(res.status()).toBe(401);
  });

  test('unauthenticated autopilot POST is rejected with 401', async ({
    request,
  }) => {
    const res = await request.post('/api/ai/autopilot', {
      data: {
        origin: { name: 'CDMX', lat: 19.43, lng: -99.13 },
        destination: { name: 'Oaxaca', lat: 17.07, lng: -96.72 },
      },
    });
    expect(res.status()).toBe(401);
  });
});
