import { describe, it, expect } from 'vitest';
import { getIndexationPolicy, getRobotsDirective } from '@/lib/seo/robots';

// ---------------------------------------------------------------------------
// getIndexationPolicy
// ---------------------------------------------------------------------------

describe('getIndexationPolicy', () => {
  describe('indexable page types', () => {
    const indexableTypes = [
      'home',
      'estado',
      'lugar',
      'ruta',
      'museo',
      'zona-arqueologica',
      'pueblo-magico',
      'coleccion',
      'guia',
      'hub',
    ];

    for (const pageType of indexableTypes) {
      it(`"${pageType}" returns index: true, follow: true`, () => {
        const policy = getIndexationPolicy(pageType);
        expect(policy.index).toBe(true);
        expect(policy.follow).toBe(true);
      });
    }
  });

  describe('noindex page types', () => {
    it('private pages return noindex', () => {
      const policy = getIndexationPolicy('profile');
      expect(policy.index).toBe(false);
    });

    it('admin pages return noindex', () => {
      const policy = getIndexationPolicy('admin');
      expect(policy.index).toBe(false);
      expect(policy.follow).toBe(false);
    });

    it('auth pages return noindex', () => {
      const policy = getIndexationPolicy('auth');
      expect(policy.index).toBe(false);
      expect(policy.follow).toBe(false);
    });

    it('dashboard pages return noindex', () => {
      const policy = getIndexationPolicy('dashboard');
      expect(policy.index).toBe(false);
      expect(policy.follow).toBe(false);
    });

    it('filter pages are noindex', () => {
      const policy = getIndexationPolicy('filter');
      expect(policy.index).toBe(false);
    });

    it('search pages are noindex', () => {
      const policy = getIndexationPolicy('search');
      expect(policy.index).toBe(false);
    });

    it('checkout pages are noindex', () => {
      const policy = getIndexationPolicy('checkout');
      expect(policy.index).toBe(false);
    });

    it('trip-editor pages are noindex', () => {
      const policy = getIndexationPolicy('trip-editor');
      expect(policy.index).toBe(false);
    });

    it('preview pages are noindex', () => {
      const policy = getIndexationPolicy('preview');
      expect(policy.index).toBe(false);
    });

    it('shared-trip pages are noindex', () => {
      const policy = getIndexationPolicy('shared-trip');
      expect(policy.index).toBe(false);
    });
  });

  describe('public hub pages are indexable', () => {
    it('hub pages return index: true', () => {
      const policy = getIndexationPolicy('hub');
      expect(policy.index).toBe(true);
      expect(policy.follow).toBe(true);
    });
  });

  describe('individual place pages are indexable', () => {
    it('lugar returns index: true', () => {
      expect(getIndexationPolicy('lugar').index).toBe(true);
    });

    it('museo returns index: true', () => {
      expect(getIndexationPolicy('museo').index).toBe(true);
    });

    it('zona-arqueologica returns index: true', () => {
      expect(getIndexationPolicy('zona-arqueologica').index).toBe(true);
    });

    it('pueblo-magico returns index: true', () => {
      expect(getIndexationPolicy('pueblo-magico').index).toBe(true);
    });
  });

  describe('unknown page type defaults', () => {
    it('unknown type returns noindex but follow', () => {
      const policy = getIndexationPolicy('unknown-page-type');
      expect(policy.index).toBe(false);
      expect(policy.follow).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// getRobotsDirective
// ---------------------------------------------------------------------------

describe('getRobotsDirective', () => {
  it('returns "index, follow" for indexable pages', () => {
    expect(getRobotsDirective('home')).toBe('index, follow');
    expect(getRobotsDirective('estado')).toBe('index, follow');
    expect(getRobotsDirective('lugar')).toBe('index, follow');
  });

  it('returns "noindex, nofollow" for noindex pages', () => {
    expect(getRobotsDirective('auth')).toBe('noindex, nofollow');
    expect(getRobotsDirective('admin')).toBe('noindex, nofollow');
    expect(getRobotsDirective('dashboard')).toBe('noindex, nofollow');
  });

  it('returns "noindex, follow" for unknown page types', () => {
    expect(getRobotsDirective('something-unknown')).toBe('noindex, follow');
  });
});
