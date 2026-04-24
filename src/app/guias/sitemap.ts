import type { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/constants';
import { mockArticles } from '@/lib/data/mock';

/**
 * Guides sitemap — generated from the full editorial catalog of articles.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return mockArticles.map((a) => ({
    url: `${APP_URL}/guias/${a.slug}`,
    lastModified: a.dateModified ? new Date(a.dateModified) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
}
