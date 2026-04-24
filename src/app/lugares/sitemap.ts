import type { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/constants';
import { mockPlaces } from '@/lib/data/mock';

/**
 * Places sitemap — generated from the full merged catalog (pueblos mágicos +
 * zonas arqueológicas + museos + playas + cenotes + haciendas +
 * centros históricos). Hundreds to a few thousand entries — well under the
 * 50,000 URL per-sitemap limit Google enforces.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return mockPlaces.map((p) => ({
    url: `${APP_URL}/lugares/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));
}
