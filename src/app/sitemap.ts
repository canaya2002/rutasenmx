import type { MetadataRoute } from 'next';
import { mockStates, mockPlaces, mockCollections } from '@/lib/data/mock';
import { allRoutes } from '@/lib/data/routes';
import { allGuides } from '@/lib/data/guides';

const SITE = 'https://rutasenmx.com';

/**
 * Master sitemap. Next.js auto-splits into per-segment sitemaps when needed.
 *
 * Includes:
 * — Core static routes (high priority)
 * — 32 state hubs
 * — 2,000+ place detail pages (filtered by quality threshold)
 * — ~100 route pages
 * — ~240 guide pages with proper `lastModified` from content
 * — Curated collections
 * — Image entries via the `images` field (Google image sitemap protocol)
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // Static build-time stamp avoids every sitemap crawl reporting "modified today"
  // which dilutes Google's trust in lastModified hints. Update with deploys.
  const buildStamp = new Date(
    process.env.BUILD_TIMESTAMP ?? '2026-04-20T00:00:00Z',
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: buildStamp, changeFrequency: 'daily', priority: 1.0, images: [`${SITE}/icon.png`] },
    { url: `${SITE}/explorar`, lastModified: buildStamp, changeFrequency: 'daily', priority: 0.95 },
    { url: `${SITE}/estados`, lastModified: buildStamp, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE}/pueblos-magicos`, lastModified: buildStamp, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE}/museos`, lastModified: buildStamp, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE}/zonas-arqueologicas`, lastModified: buildStamp, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE}/rutas`, lastModified: buildStamp, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE}/colecciones`, lastModified: buildStamp, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE}/guias`, lastModified: buildStamp, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/conectar`, lastModified: buildStamp, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${SITE}/comunidad`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${SITE}/precios`, lastModified: buildStamp, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE}/autopilot`, lastModified: buildStamp, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE}/planear`, lastModified: buildStamp, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${SITE}/acerca-de`, lastModified: buildStamp, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE}/metodologia`, lastModified: buildStamp, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE}/fuentes-de-datos`, lastModified: buildStamp, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE}/politica-editorial`, lastModified: buildStamp, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE}/correcciones`, lastModified: buildStamp, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE}/contacto`, lastModified: buildStamp, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE}/privacidad`, lastModified: buildStamp, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE}/terminos`, lastModified: buildStamp, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const stateRoutes: MetadataRoute.Sitemap = mockStates.map((s) => ({
    url: `${SITE}/estados/${s.slug}`,
    lastModified: buildStamp,
    changeFrequency: 'weekly',
    priority: 0.85,
    images: [`${SITE}${s.image}`],
    alternates: {
      languages: {
        'es-MX': `${SITE}/estados/${s.slug}`,
        'en-US': `${SITE}/estados/${s.slug}`,
      },
    },
  }));

  const placeRoutes: MetadataRoute.Sitemap = mockPlaces
    .filter((p) => p.description && p.description.length > 30)
    .map((p) => ({
      url: `${SITE}/lugares/${p.slug}`,
      lastModified: buildStamp,
      changeFrequency: 'monthly',
      priority: 0.75,
      images: p.image ? [p.image.startsWith('http') ? p.image : `${SITE}${p.image}`] : undefined,
      alternates: {
        languages: {
          'es-MX': `${SITE}/lugares/${p.slug}`,
          'en-US': `${SITE}/lugares/${p.slug}`,
        },
      },
    }));

  const routeUrls: MetadataRoute.Sitemap = allRoutes.map((r) => ({
    url: `${SITE}/rutas/${r.slug}`,
    lastModified: buildStamp,
    changeFrequency: 'monthly',
    priority: 0.8,
    images: r.image ? [r.image.startsWith('http') ? r.image : `${SITE}${r.image}`] : undefined,
    alternates: {
      languages: {
        'es-MX': `${SITE}/rutas/${r.slug}`,
        'en-US': `${SITE}/rutas/${r.slug}`,
      },
    },
  }));

  const guideUrls: MetadataRoute.Sitemap = allGuides.map((g) => ({
    url: `${SITE}/guias/${g.slug}`,
    lastModified: new Date(g.dateModified || g.datePublished),
    changeFrequency: 'monthly',
    priority: 0.75,
    images: g.image ? [g.image.startsWith('http') ? g.image : `${SITE}${g.image}`] : undefined,
    alternates: {
      languages: {
        'es-MX': `${SITE}/guias/${g.slug}`,
        'en-US': `${SITE}/guias/${g.slug}`,
      },
    },
  }));

  const collectionUrls: MetadataRoute.Sitemap = mockCollections.map((c) => ({
    url: `${SITE}/colecciones/${c.slug}`,
    lastModified: buildStamp,
    changeFrequency: 'monthly',
    priority: 0.7,
    images: c.image ? [c.image.startsWith('http') ? c.image : `${SITE}${c.image}`] : undefined,
  }));

  return [
    ...staticRoutes,
    ...stateRoutes,
    ...placeRoutes,
    ...routeUrls,
    ...guideUrls,
    ...collectionUrls,
  ];
}
