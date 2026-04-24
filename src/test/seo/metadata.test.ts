import { describe, it, expect } from 'vitest';
import { getBaseMetadata, buildPageMetadata } from '@/lib/seo/metadata';

// ---------------------------------------------------------------------------
// Constants mirrored from the module under test
// ---------------------------------------------------------------------------
const SITE_URL = 'https://rutasenmx.com';
const APP_NAME = 'Rutas en MX';

// ---------------------------------------------------------------------------
// Sample page configs used across multiple tests
// ---------------------------------------------------------------------------
const PAGE_CONFIGS = [
  {
    type: 'home',
    title: 'Rutas en MX -- Planea rutas por Mexico',
    description: 'Descubre las mejores rutas de viaje por Mexico.',
    path: '/',
  },
  {
    type: 'estado',
    title: 'Que visitar en Oaxaca',
    description: 'Guia completa de turismo en el estado de Oaxaca.',
    path: '/estados/oaxaca',
  },
  {
    type: 'lugar',
    title: 'Teotihuacan',
    description: 'Visita la zona arqueologica de Teotihuacan.',
    path: '/lugares/teotihuacan',
  },
  {
    type: 'museo',
    title: 'Museo Nacional de Antropologia',
    description: 'El museo mas importante de Mexico.',
    path: '/museos/museo-nacional-de-antropologia',
  },
  {
    type: 'ruta',
    title: 'CDMX a Oaxaca',
    description: 'Ruta por carretera de la Ciudad de Mexico a Oaxaca.',
    path: '/rutas/cdmx-oaxaca',
  },
  {
    type: 'guia',
    title: 'Guia de viaje a Yucatan',
    description: 'Todo lo que necesitas saber para viajar a Yucatan.',
    path: '/guias/yucatan',
  },
] as const;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getBaseMetadata', () => {
  const base = getBaseMetadata();

  it('returns correct metadataBase', () => {
    expect(base.metadataBase).toEqual(new URL(SITE_URL));
  });

  it('returns correct applicationName', () => {
    expect(base.applicationName).toBe(APP_NAME);
  });

  it('returns a title object with default and template', () => {
    expect(base.title).toBeDefined();
    const title = base.title as { default: string; template: string };
    expect(title.default).toBe(APP_NAME);
    expect(title.template).toBe(`%s | ${APP_NAME}`);
  });

  it('returns a non-empty description', () => {
    expect(base.description).toBeTruthy();
    expect(typeof base.description).toBe('string');
  });

  it('includes OG data with required fields', () => {
    expect(base.openGraph).toBeDefined();
    const og = base.openGraph as Record<string, unknown>;
    expect(og.type).toBe('website');
    expect(og.locale).toBe('es_MX');
    expect(og.siteName).toBe(APP_NAME);
    expect(og.url).toBe(SITE_URL);
    expect(og.images).toBeDefined();
  });

  it('includes Twitter card data', () => {
    expect(base.twitter).toBeDefined();
    const tw = base.twitter as Record<string, unknown>;
    expect(tw.card).toBe('summary_large_image');
  });

  it('sets robots to index, follow by default', () => {
    expect(base.robots).toBeDefined();
    const robots = base.robots as Record<string, unknown>;
    expect(robots.index).toBe(true);
    expect(robots.follow).toBe(true);
  });

  it('includes a canonical URL as alternates', () => {
    expect(base.alternates).toBeDefined();
    expect(base.alternates!.canonical).toBe(SITE_URL);
  });
});

describe('buildPageMetadata', () => {
  it('generates unique titles for each page type', () => {
    const titles = PAGE_CONFIGS.map((c) =>
      buildPageMetadata({ title: c.title, description: c.description, path: c.path }),
    ).map((m) => m.title);

    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(titles.length);
  });

  it('generates unique descriptions for each page type', () => {
    const descriptions = PAGE_CONFIGS.map((c) =>
      buildPageMetadata({ title: c.title, description: c.description, path: c.path }),
    ).map((m) => m.description);

    const uniqueDescriptions = new Set(descriptions);
    expect(uniqueDescriptions.size).toBe(descriptions.length);
  });

  it('generates absolute canonical URLs', () => {
    for (const config of PAGE_CONFIGS) {
      const meta = buildPageMetadata({
        title: config.title,
        description: config.description,
        path: config.path,
      });
      const canonical = meta.alternates?.canonical as string;
      expect(canonical).toMatch(/^https:\/\//);
      expect(canonical).toBe(`${SITE_URL}${config.path}`);
    }
  });

  it('includes complete OG data for each page', () => {
    for (const config of PAGE_CONFIGS) {
      const meta = buildPageMetadata({
        title: config.title,
        description: config.description,
        path: config.path,
      });

      expect(meta.openGraph).toBeDefined();
      expect(meta.openGraph!.title).toBe(config.title);
      expect(meta.openGraph!.description).toBe(config.description);
      expect(meta.openGraph!.url).toBe(`${SITE_URL}${config.path}`);
      expect(meta.openGraph!.images).toBeDefined();
    }
  });

  it('applies noIndex when requested', () => {
    const meta = buildPageMetadata({
      title: 'Dashboard',
      description: 'User dashboard',
      path: '/dashboard',
      noIndex: true,
    });

    const robots = meta.robots as Record<string, unknown>;
    expect(robots).toBeDefined();
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
  });

  it('does not set robots when noIndex is false', () => {
    const meta = buildPageMetadata({
      title: 'Public page',
      description: 'A public page',
      path: '/public',
    });

    expect(meta.robots).toBeUndefined();
  });

  it('uses custom OG image when provided', () => {
    const meta = buildPageMetadata({
      title: 'Place',
      description: 'A place',
      path: '/lugares/test',
      image: '/custom-image.jpg',
    });

    const images = meta.openGraph!.images as Array<{ url: string }>;
    expect(images[0].url).toBe('/custom-image.jpg');
  });

  it('falls back to a default OG image when none provided', () => {
    const meta = buildPageMetadata({
      title: 'Place',
      description: 'A place',
      path: '/lugares/test',
    });

    const images = meta.openGraph!.images as Array<{ url: string }>;
    expect(images[0].url).toBeTruthy();
    // Accept either the branded OG image or the app icon as sensible defaults.
    expect(images[0].url).toMatch(/\.(png|jpg|webp)$/i);
  });

  it('includes keywords when provided', () => {
    const keywords = ['museos', 'mexico', 'cultura'];
    const meta = buildPageMetadata({
      title: 'Museos',
      description: 'Museos en Mexico',
      path: '/museos',
      keywords,
    });

    // The metadata helper may augment with brand keywords; the provided ones
    // must still be present.
    const got = meta.keywords as string[];
    for (const k of keywords) {
      expect(got).toContain(k);
    }
  });
});

describe('title template', () => {
  it('template includes app name suffix', () => {
    const base = getBaseMetadata();
    const title = base.title as { template: string };
    expect(title.template).toContain(APP_NAME);
    expect(title.template).toContain('%s');
  });
});

describe('no duplicate titles across page types', () => {
  it('each page config produces a distinct title', () => {
    const titles = PAGE_CONFIGS.map((c) => c.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
