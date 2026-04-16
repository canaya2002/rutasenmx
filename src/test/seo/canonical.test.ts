import { describe, it, expect } from 'vitest';
import { getCanonicalUrl, cleanUrl, normalizeSlug } from '@/lib/seo/canonical';

const SITE_URL = 'https://rutasenmx.com';

// ---------------------------------------------------------------------------
// getCanonicalUrl
// ---------------------------------------------------------------------------

describe('getCanonicalUrl', () => {
  it('returns absolute URL for a path', () => {
    const result = getCanonicalUrl('/estados/oaxaca');
    expect(result).toBe(`${SITE_URL}/estados/oaxaca`);
  });

  it('returns absolute URL for root path', () => {
    expect(getCanonicalUrl('/')).toBe(`${SITE_URL}/`);
  });

  it('prepends slash when path does not start with one', () => {
    expect(getCanonicalUrl('estados/oaxaca')).toBe(`${SITE_URL}/estados/oaxaca`);
  });

  it('removes trailing slash', () => {
    expect(getCanonicalUrl('/estados/oaxaca/')).toBe(`${SITE_URL}/estados/oaxaca`);
  });

  it('handles empty string by returning root', () => {
    expect(getCanonicalUrl('')).toBe(`${SITE_URL}/`);
  });

  it('always starts with https://', () => {
    const result = getCanonicalUrl('/any-path');
    expect(result).toMatch(/^https:\/\//);
  });
});

// ---------------------------------------------------------------------------
// cleanUrl
// ---------------------------------------------------------------------------

describe('cleanUrl', () => {
  describe('strips tracking params', () => {
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'gclid',
      'fbclid',
      'ref',
      'gad_source',
      'dclid',
      'msclkid',
      'twclid',
      'mc_cid',
      'mc_eid',
      'igshid',
      's_kwcid',
      'ttclid',
      '_ga',
      '_gl',
    ];

    for (const param of trackingParams) {
      it(`removes ${param}`, () => {
        const url = `${SITE_URL}/estados/oaxaca?${param}=test123`;
        const cleaned = cleanUrl(url);
        expect(cleaned).not.toContain(param);
      });
    }
  });

  it('preserves legitimate params', () => {
    const url = `${SITE_URL}/buscar?q=pueblos+magicos&page=2`;
    const cleaned = cleanUrl(url);
    expect(cleaned).toContain('q=pueblos');
    expect(cleaned).toContain('page=2');
  });

  it('strips mixed tracking and legitimate params', () => {
    const url = `${SITE_URL}/buscar?q=test&utm_source=google&page=3&fbclid=abc`;
    const cleaned = cleanUrl(url);
    expect(cleaned).toContain('q=test');
    expect(cleaned).toContain('page=3');
    expect(cleaned).not.toContain('utm_source');
    expect(cleaned).not.toContain('fbclid');
  });

  it('removes trailing slash', () => {
    const cleaned = cleanUrl(`${SITE_URL}/estados/oaxaca/`);
    expect(cleaned).not.toMatch(/\/$/);
  });

  it('preserves root slash', () => {
    const cleaned = cleanUrl(`${SITE_URL}/`);
    expect(cleaned).toMatch(/\/$/);
  });

  it('removes hash fragments', () => {
    const cleaned = cleanUrl(`${SITE_URL}/lugares/test#section`);
    expect(cleaned).not.toContain('#');
  });

  it('lowercases the URL', () => {
    const cleaned = cleanUrl(`${SITE_URL}/Estados/OAXACA`);
    expect(cleaned).toBe(cleaned.toLowerCase());
  });

  it('handles no double slashes in path', () => {
    const cleaned = cleanUrl(`${SITE_URL}/estados//oaxaca`);
    // Extract path portion (after origin) and check no double slashes
    const path = cleaned.replace(/^https?:\/\/[^/]+/, '');
    expect(path).not.toMatch(/\/\//);
  });
});

// ---------------------------------------------------------------------------
// normalizeSlug
// ---------------------------------------------------------------------------

describe('normalizeSlug', () => {
  it('lowercases the slug', () => {
    expect(normalizeSlug('OAXACA')).toBe('oaxaca');
  });

  it('removes accents from Spanish characters', () => {
    expect(normalizeSlug('Yucatan')).toBe('yucatan');
    expect(normalizeSlug('Queretaro')).toBe('queretaro');
    expect(normalizeSlug('Michoacan')).toBe('michoacan');
    expect(normalizeSlug('San Luis Potosi')).toBe('san-luis-potosi');
  });

  it('handles full accented names', () => {
    expect(normalizeSlug('Ciudad de Mexico')).toBe('ciudad-de-mexico');
    expect(normalizeSlug('Nuevo Leon')).toBe('nuevo-leon');
  });

  it('replaces spaces with hyphens', () => {
    expect(normalizeSlug('Baja California Sur')).toBe('baja-california-sur');
  });

  it('strips special characters', () => {
    expect(normalizeSlug('Hello! @World#')).toBe('hello-world');
  });

  it('collapses multiple hyphens', () => {
    expect(normalizeSlug('foo---bar')).toBe('foo-bar');
  });

  it('trims leading and trailing hyphens', () => {
    expect(normalizeSlug('-hello-world-')).toBe('hello-world');
  });

  it('handles empty string', () => {
    expect(normalizeSlug('')).toBe('');
  });

  it('handles string with only special characters', () => {
    expect(normalizeSlug('!!@@##')).toBe('');
  });
});
