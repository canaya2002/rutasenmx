import { describe, it, expect } from 'vitest';
import {
  getKeywordOwner,
  detectCannibalization,
} from '@/lib/seo/cannibalization';

// ---------------------------------------------------------------------------
// getKeywordOwner (keyword ownership rules)
// ---------------------------------------------------------------------------

describe('getKeywordOwner', () => {
  it('returns the hub pattern for "museos mexico"', () => {
    expect(getKeywordOwner('museos mexico')).toBe('/museos');
  });

  it('returns the hub pattern for "zonas arqueologicas mexico"', () => {
    expect(getKeywordOwner('zonas arqueologicas mexico')).toBe('/zonas-arqueologicas');
  });

  it('returns the hub pattern for "pueblos magicos mexico"', () => {
    expect(getKeywordOwner('pueblos magicos mexico')).toBe('/pueblos-magicos');
  });

  it('returns home pattern for "rutas de viaje mexico"', () => {
    expect(getKeywordOwner('rutas de viaje mexico')).toBe('/');
  });

  it('returns null for unregistered keyword', () => {
    expect(getKeywordOwner('random unregistered keyword')).toBeNull();
  });

  it('is case insensitive', () => {
    expect(getKeywordOwner('MUSEOS MEXICO')).toBe('/museos');
    expect(getKeywordOwner('Pueblos Magicos Mexico')).toBe('/pueblos-magicos');
  });

  it('trims whitespace', () => {
    expect(getKeywordOwner('  museos mexico  ')).toBe('/museos');
  });

  it('matches template patterns with dynamic segments', () => {
    // "que visitar en {estado}" should match
    const owner = getKeywordOwner('que visitar en oaxaca');
    expect(owner).toBe('/estados/{estado}');
  });

  it('matches museos {estado} template', () => {
    const owner = getKeywordOwner('museos jalisco');
    expect(owner).toBe('/estados/{estado}/museos');
  });
});

// ---------------------------------------------------------------------------
// detectCannibalization
// ---------------------------------------------------------------------------

describe('detectCannibalization', () => {
  it('detects duplicate titles across pages', () => {
    const pages = [
      { url: '/museos', title: 'Museos en Mexico', h1: 'Museos en Mexico', keywords: [] },
      { url: '/estados/cdmx/museos', title: 'Museos en Mexico', h1: 'Museos CDMX', keywords: [] },
    ];

    const issues = detectCannibalization(pages);
    expect(issues.length).toBeGreaterThan(0);

    const titleIssue = issues.find((i) =>
      i.pages.some((p) => p.matchType === 'title'),
    );
    expect(titleIssue).toBeDefined();
  });

  it('detects duplicate H1 across pages', () => {
    const pages = [
      { url: '/museos', title: 'Museos Hub', h1: 'Descubre los museos', keywords: [] },
      { url: '/guias/museos', title: 'Guia de museos', h1: 'Descubre los museos', keywords: [] },
    ];

    const issues = detectCannibalization(pages);
    const h1Issue = issues.find((i) =>
      i.pages.some((p) => p.matchType === 'h1'),
    );
    expect(h1Issue).toBeDefined();
  });

  it('detects keyword overlap across pages', () => {
    const pages = [
      { url: '/museos', title: 'Hub', h1: 'Hub', keywords: ['museos oaxaca'] },
      { url: '/estados/oaxaca/museos', title: 'State', h1: 'State', keywords: ['museos oaxaca'] },
    ];

    const issues = detectCannibalization(pages);
    expect(issues.length).toBeGreaterThan(0);
    const kwIssue = issues.find((i) =>
      i.pages.some((p) => p.matchType === 'keywords'),
    );
    expect(kwIssue).toBeDefined();
  });

  it('returns empty array when no cannibalization found', () => {
    const pages = [
      { url: '/museos', title: 'Museos en Mexico', h1: 'Museos Mexico', keywords: ['museos'] },
      { url: '/pueblos-magicos', title: 'Pueblos Magicos', h1: 'Pueblos Magicos', keywords: ['pueblos'] },
    ];

    const issues = detectCannibalization(pages);
    expect(issues).toHaveLength(0);
  });

  it('assigns high severity when multiple title matches', () => {
    const pages = [
      { url: '/a', title: 'Same Title', h1: 'A', keywords: [] },
      { url: '/b', title: 'Same Title', h1: 'B', keywords: [] },
    ];

    const issues = detectCannibalization(pages);
    const highIssue = issues.find((i) => i.severity === 'high');
    expect(highIssue).toBeDefined();
  });

  it('includes recommendation with owner info for registered keywords', () => {
    const pages = [
      { url: '/museos', title: 'Hub', h1: 'Hub', keywords: ['museos mexico'] },
      { url: '/guias/museos', title: 'Guia', h1: 'Guia', keywords: ['museos mexico'] },
    ];

    const issues = detectCannibalization(pages);
    const issue = issues.find((i) => i.keyword === 'museos mexico');
    expect(issue).toBeDefined();
    expect(issue!.recommendation).toContain('/museos');
  });

  it('sorts issues by severity (high first)', () => {
    const pages = [
      { url: '/a', title: 'Same Title', h1: 'H1 A', keywords: ['kw1'] },
      { url: '/b', title: 'Same Title', h1: 'H1 B', keywords: ['kw1'] },
      { url: '/c', title: 'Different', h1: 'Different', keywords: ['kw2'] },
      { url: '/d', title: 'Also Different', h1: 'Also', keywords: ['kw2'] },
    ];

    const issues = detectCannibalization(pages);
    if (issues.length > 1) {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      for (let i = 1; i < issues.length; i++) {
        expect(severityOrder[issues[i].severity]).toBeGreaterThanOrEqual(
          severityOrder[issues[i - 1].severity],
        );
      }
    }
  });
});
