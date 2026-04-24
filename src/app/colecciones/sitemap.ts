import type { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/constants';
import { mockCollections } from '@/lib/data/mock';

/**
 * Collections sitemap — generated from the full editorial catalog.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return mockCollections.map((c) => ({
    url: `${APP_URL}/colecciones/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
}
