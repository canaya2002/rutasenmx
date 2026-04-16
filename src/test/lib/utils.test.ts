import { describe, it, expect } from 'vitest';
import {
  slugify,
  formatCurrency,
  formatDistance,
  formatDuration,
  haversineDistance,
  truncate,
  absoluteUrl,
} from '@/lib/utils';

// ---------------------------------------------------------------------------
// slugify
// ---------------------------------------------------------------------------

describe('slugify', () => {
  it('converts to lowercase', () => {
    expect(slugify('HELLO')).toBe('hello');
  });

  it('handles Spanish characters', () => {
    expect(slugify('Ciudad de Mexico')).toBe('ciudad-de-mexico');
    expect(slugify('Michoacan')).toBe('michoacan');
    expect(slugify('Queretaro')).toBe('queretaro');
    expect(slugify('Yucatan')).toBe('yucatan');
    expect(slugify('San Luis Potosi')).toBe('san-luis-potosi');
  });

  it('removes accents and diacritical marks', () => {
    // NFD normalization removes accents
    const result = slugify('cafe');
    expect(result).toBe('cafe');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('Baja California Sur')).toBe('baja-california-sur');
  });

  it('removes special characters', () => {
    expect(slugify('Hello! @World#$')).toBe('hello-world');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('a   b   c')).toBe('a-b-c');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify(' -hello- ')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------

describe('formatCurrency', () => {
  it('formats cents to MXN by default', () => {
    const result = formatCurrency(9900);
    expect(result).toContain('99');
    // Should have MXN symbol ($)
    expect(result).toMatch(/\$|MXN/);
  });

  it('handles zero cents', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('handles large amounts', () => {
    const result = formatCurrency(279900);
    expect(result).toContain('2,799');
  });

  it('uses es-MX locale formatting', () => {
    // MXN format in es-MX uses $
    const result = formatCurrency(9900);
    expect(result).toMatch(/\$/);
  });
});

// ---------------------------------------------------------------------------
// formatDistance
// ---------------------------------------------------------------------------

describe('formatDistance', () => {
  it('formats distances less than 1km in meters', () => {
    expect(formatDistance(0.5)).toBe('500 m');
  });

  it('formats distances of exactly 1km', () => {
    expect(formatDistance(1)).toBe('1.0 km');
  });

  it('formats large distances in km', () => {
    expect(formatDistance(460.5)).toBe('460.5 km');
  });

  it('rounds meters to whole numbers', () => {
    expect(formatDistance(0.123)).toBe('123 m');
  });
});

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(30)).toBe('30 min');
  });

  it('formats hours only when no remaining minutes', () => {
    expect(formatDuration(120)).toBe('2 h');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(150)).toBe('2 h 30 min');
  });

  it('formats zero minutes', () => {
    expect(formatDuration(0)).toBe('0 min');
  });
});

// ---------------------------------------------------------------------------
// haversineDistance
// ---------------------------------------------------------------------------

describe('haversineDistance', () => {
  it('returns 0 for same point', () => {
    expect(haversineDistance(19.4326, -99.1332, 19.4326, -99.1332)).toBe(0);
  });

  it('calculates distance between CDMX and Oaxaca approximately', () => {
    // CDMX: 19.4326, -99.1332
    // Oaxaca: 17.0732, -96.7266
    const distance = haversineDistance(19.4326, -99.1332, 17.0732, -96.7266);
    // Should be around 370-390 km (straight line)
    expect(distance).toBeGreaterThan(350);
    expect(distance).toBeLessThan(420);
  });

  it('calculates distance between CDMX and Cancun approximately', () => {
    // CDMX: 19.4326, -99.1332
    // Cancun: 21.1619, -86.8515
    const distance = haversineDistance(19.4326, -99.1332, 21.1619, -86.8515);
    // Should be around 1260-1310 km (straight line)
    expect(distance).toBeGreaterThan(1200);
    expect(distance).toBeLessThan(1400);
  });

  it('is symmetric', () => {
    const d1 = haversineDistance(19.4326, -99.1332, 17.0732, -96.7266);
    const d2 = haversineDistance(17.0732, -96.7266, 19.4326, -99.1332);
    expect(d1).toBeCloseTo(d2, 5);
  });
});

// ---------------------------------------------------------------------------
// truncate
// ---------------------------------------------------------------------------

describe('truncate', () => {
  it('returns the string unchanged if within length', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates and adds ellipsis when string exceeds length', () => {
    expect(truncate('hello world this is long', 11)).toBe('hello world...');
  });

  it('handles exact length', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('handles empty string', () => {
    expect(truncate('', 10)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// absoluteUrl
// ---------------------------------------------------------------------------

describe('absoluteUrl', () => {
  it('prepends base URL to path', () => {
    const result = absoluteUrl('/estados/oaxaca');
    expect(result).toMatch(/^https:\/\//);
    expect(result).toContain('/estados/oaxaca');
  });

  it('adds leading slash if missing', () => {
    const result = absoluteUrl('estados/oaxaca');
    expect(result).toContain('/estados/oaxaca');
  });

  it('handles root path', () => {
    const result = absoluteUrl('/');
    expect(result).toMatch(/^https:\/\/.+\/$/);
  });
});
