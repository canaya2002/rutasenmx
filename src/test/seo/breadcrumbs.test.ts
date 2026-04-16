import { describe, it, expect } from 'vitest';
import {
  buildBreadcrumbs,
  estadoBreadcrumbs,
  lugarBreadcrumbs,
  rutaBreadcrumbs,
  categoriaBreadcrumbs,
} from '@/lib/seo/breadcrumbs';

// ---------------------------------------------------------------------------
// buildBreadcrumbs
// ---------------------------------------------------------------------------

describe('buildBreadcrumbs', () => {
  it('always starts with Home (Inicio)', () => {
    const result = buildBreadcrumbs([]);
    expect(result[0]).toEqual({ label: 'Inicio', href: '/' });
  });

  it('returns only Home when given empty array', () => {
    const result = buildBreadcrumbs([]);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Inicio');
  });

  it('prepends Home when first item is not root', () => {
    const items = [{ label: 'Estados', href: '/estados' }];
    const result = buildBreadcrumbs(items);
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('Inicio');
    expect(result[1].label).toBe('Estados');
  });

  it('does not duplicate Home when first item is root', () => {
    const items = [
      { label: 'Inicio', href: '/' },
      { label: 'Estados', href: '/estados' },
    ];
    const result = buildBreadcrumbs(items);
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('Inicio');
  });
});

// ---------------------------------------------------------------------------
// estadoBreadcrumbs
// ---------------------------------------------------------------------------

describe('estadoBreadcrumbs', () => {
  it('builds correct trail for a state', () => {
    const crumbs = estadoBreadcrumbs('Oaxaca', 'oaxaca');
    expect(crumbs).toHaveLength(3);
    expect(crumbs[0]).toEqual({ label: 'Inicio', href: '/' });
    expect(crumbs[1]).toEqual({ label: 'Estados', href: '/estados' });
    expect(crumbs[2]).toEqual({ label: 'Oaxaca', href: '/estados/oaxaca' });
  });

  it('first item is always Home', () => {
    const crumbs = estadoBreadcrumbs('Jalisco', 'jalisco');
    expect(crumbs[0].href).toBe('/');
  });
});

// ---------------------------------------------------------------------------
// lugarBreadcrumbs
// ---------------------------------------------------------------------------

describe('lugarBreadcrumbs', () => {
  it('builds correct trail for a place with category', () => {
    const crumbs = lugarBreadcrumbs(
      'Teotihuacan',
      'teotihuacan',
      'Zonas arqueologicas',
      'zonas-arqueologicas',
      'Estado de Mexico',
      'estado-de-mexico',
    );

    expect(crumbs).toHaveLength(4);
    expect(crumbs[0]).toEqual({ label: 'Inicio', href: '/' });
    expect(crumbs[1]).toEqual({
      label: 'Zonas arqueologicas',
      href: '/zonas-arqueologicas',
    });
    expect(crumbs[2]).toEqual({
      label: 'Estado de Mexico',
      href: '/estados/estado-de-mexico/zonas-arqueologicas',
    });
    expect(crumbs[3]).toEqual({
      label: 'Teotihuacan',
      href: '/lugares/teotihuacan',
    });
  });

  it('first item is always Home', () => {
    const crumbs = lugarBreadcrumbs(
      'Place',
      'place',
      'Category',
      'category',
      'Estado',
      'estado',
    );
    expect(crumbs[0].href).toBe('/');
  });
});

// ---------------------------------------------------------------------------
// rutaBreadcrumbs
// ---------------------------------------------------------------------------

describe('rutaBreadcrumbs', () => {
  it('builds correct trail for a route', () => {
    const crumbs = rutaBreadcrumbs('CDMX a Oaxaca', 'cdmx-oaxaca');
    expect(crumbs).toHaveLength(3);
    expect(crumbs[0]).toEqual({ label: 'Inicio', href: '/' });
    expect(crumbs[1]).toEqual({ label: 'Rutas', href: '/rutas' });
    expect(crumbs[2]).toEqual({
      label: 'CDMX a Oaxaca',
      href: '/rutas/cdmx-oaxaca',
    });
  });
});

// ---------------------------------------------------------------------------
// categoriaBreadcrumbs
// ---------------------------------------------------------------------------

describe('categoriaBreadcrumbs', () => {
  it('builds trail for top-level category', () => {
    const crumbs = categoriaBreadcrumbs('Museos', 'museos');
    expect(crumbs).toHaveLength(2);
    expect(crumbs[0]).toEqual({ label: 'Inicio', href: '/' });
    expect(crumbs[1]).toEqual({ label: 'Museos', href: '/museos' });
  });

  it('builds trail for state-scoped category', () => {
    const crumbs = categoriaBreadcrumbs(
      'Museos',
      'museos',
      'Oaxaca',
      'oaxaca',
    );
    expect(crumbs).toHaveLength(4);
    expect(crumbs[0]).toEqual({ label: 'Inicio', href: '/' });
    expect(crumbs[1]).toEqual({ label: 'Estados', href: '/estados' });
    expect(crumbs[2]).toEqual({ label: 'Oaxaca', href: '/estados/oaxaca' });
    expect(crumbs[3]).toEqual({
      label: 'Museos',
      href: '/estados/oaxaca/museos',
    });
  });
});

// ---------------------------------------------------------------------------
// No broken links in breadcrumbs
// ---------------------------------------------------------------------------

describe('no broken links in breadcrumbs', () => {
  const allBreadcrumbs = [
    estadoBreadcrumbs('Oaxaca', 'oaxaca'),
    lugarBreadcrumbs('Test', 'test', 'Museos', 'museos', 'Oaxaca', 'oaxaca'),
    rutaBreadcrumbs('Test Route', 'test-route'),
    categoriaBreadcrumbs('Pueblos Magicos', 'pueblos-magicos'),
    categoriaBreadcrumbs('Museos', 'museos', 'Jalisco', 'jalisco'),
  ];

  allBreadcrumbs.forEach((crumbs, index) => {
    it(`breadcrumb set ${index}: all hrefs start with /`, () => {
      crumbs.forEach((crumb) => {
        expect(crumb.href).toMatch(/^\//);
      });
    });

    it(`breadcrumb set ${index}: no empty labels`, () => {
      crumbs.forEach((crumb) => {
        expect(crumb.label.trim().length).toBeGreaterThan(0);
      });
    });

    it(`breadcrumb set ${index}: no empty hrefs`, () => {
      crumbs.forEach((crumb) => {
        expect(crumb.href.trim().length).toBeGreaterThan(0);
      });
    });
  });
});
