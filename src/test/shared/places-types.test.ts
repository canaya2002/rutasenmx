/**
 * Contract check for `shared/types/places`. The mobile client reads these
 * shapes; if the web API changes its keys, this test breaks before the
 * mobile app does.
 */
import { describe, it, expect } from 'vitest';
import {
  PLACE_CATEGORY_CATALOG,
  type PlaceCategorySlug,
  type RouteDifficulty,
} from '../../../shared/src/types/places';
import { API } from '../../../shared/src/api';

describe('PLACE_CATEGORY_CATALOG', () => {
  it('is non-empty and each entry has the required fields', () => {
    expect(PLACE_CATEGORY_CATALOG.length).toBeGreaterThan(0);
    for (const c of PLACE_CATEGORY_CATALOG) {
      expect(c.slug).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.emoji).toBeTruthy();
      expect(c.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('slugs are unique', () => {
    const slugs = PLACE_CATEGORY_CATALOG.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('API path helpers', () => {
  it('routes path helpers produce expected paths', () => {
    expect(API.routes).toBe('/api/routes');
    expect(API.route('cdmx-a-oaxaca-por-puebla')).toBe(
      '/api/routes/cdmx-a-oaxaca-por-puebla',
    );
    expect(API.states).toBe('/api/states');
  });
});

describe('RouteDifficulty type (compile-time check)', () => {
  it('accepts known values', () => {
    const a: RouteDifficulty = 'facil';
    const b: RouteDifficulty = 'moderada';
    const c: RouteDifficulty = 'avanzada';
    expect(a).toBe('facil');
    expect(b).toBe('moderada');
    expect(c).toBe('avanzada');
  });
});

describe('PlaceCategorySlug type (compile-time check)', () => {
  it('matches catalog', () => {
    const fromCatalog: PlaceCategorySlug = PLACE_CATEGORY_CATALOG[0].slug;
    expect(typeof fromCatalog).toBe('string');
  });
});
