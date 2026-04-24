/**
 * Tests for the mobile deep-link URL → in-app path mapper. The function is
 * pure (no RN imports) so we run it in the web vitest suite — shipping bad
 * deep-link logic breaks Universal Links on iOS and App Links on Android,
 * which is a category of bug you don't want to find in user reports.
 *
 * We import by relative path because `@shared` and `@/` aliases don't cover
 * the mobile tree, and the function is intentionally framework-free.
 */
import { describe, it, expect } from 'vitest';

import { mapWebUrlToAppPath } from '../../../shared/src/deep-links';

describe('mapWebUrlToAppPath', () => {
  it('maps the homepage to the tabs index', () => {
    expect(mapWebUrlToAppPath('https://rutasenmx.com/')).toBe('/(tabs)');
    expect(mapWebUrlToAppPath('https://rutasenmx.com')).toBe('/(tabs)');
  });

  it('maps /rutas list and /rutas/[slug] detail', () => {
    expect(mapWebUrlToAppPath('https://rutasenmx.com/rutas')).toBe(
      '/(tabs)/rutas',
    );
    expect(
      mapWebUrlToAppPath('https://rutasenmx.com/rutas/cdmx-a-oaxaca'),
    ).toBe('/ruta/cdmx-a-oaxaca');
  });

  it('maps /lugares/[slug] to the singular /lugar/[slug] mobile route', () => {
    expect(
      mapWebUrlToAppPath('https://rutasenmx.com/lugares/teotihuacan'),
    ).toBe('/lugar/teotihuacan');
  });

  it('maps /mis-viajes and /mis-viajes/[id]', () => {
    expect(mapWebUrlToAppPath('https://rutasenmx.com/mis-viajes')).toBe(
      '/mis-viajes',
    );
    expect(
      mapWebUrlToAppPath('https://rutasenmx.com/mis-viajes/trip-123'),
    ).toBe('/mis-viajes/trip-123');
  });

  it('maps /comunidad (index, slug, and post)', () => {
    expect(mapWebUrlToAppPath('https://rutasenmx.com/comunidad')).toBe(
      '/comunidad',
    );
    expect(
      mapWebUrlToAppPath('https://rutasenmx.com/comunidad/viajeros-mx'),
    ).toBe('/comunidad/viajeros-mx');
    expect(
      mapWebUrlToAppPath('https://rutasenmx.com/comunidad/post/abc-def'),
    ).toBe('/comunidad/post/abc-def');
  });

  it('maps /precios to /suscripcion (Stripe web pricing ↔ mobile paywall)', () => {
    expect(mapWebUrlToAppPath('https://rutasenmx.com/precios')).toBe(
      '/suscripcion',
    );
  });

  it('strips trailing slashes', () => {
    expect(mapWebUrlToAppPath('https://rutasenmx.com/rutas/')).toBe(
      '/(tabs)/rutas',
    );
  });

  it('rejects unknown hosts', () => {
    expect(
      mapWebUrlToAppPath('https://evil.com/lugares/teotihuacan'),
    ).toBeNull();
  });

  it('returns null for unmapped paths', () => {
    expect(
      mapWebUrlToAppPath('https://rutasenmx.com/some-weird-admin-route'),
    ).toBeNull();
  });

  it('returns null for malformed URLs', () => {
    expect(mapWebUrlToAppPath('not a url')).toBeNull();
    expect(mapWebUrlToAppPath('')).toBeNull();
  });

  it('handles the custom rutasenmx:// scheme', () => {
    expect(mapWebUrlToAppPath('rutasenmx://lugares/teotihuacan')).toBe(
      '/lugar/teotihuacan',
    );
  });

  it('encodes special characters in the slug', () => {
    const out = mapWebUrlToAppPath(
      'https://rutasenmx.com/lugares/san-miguel-de-allende',
    );
    expect(out).toBe('/lugar/san-miguel-de-allende');
  });
});
