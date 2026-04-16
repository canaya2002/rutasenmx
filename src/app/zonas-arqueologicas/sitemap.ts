import type { MetadataRoute } from 'next';
import { ESTADOS_MEXICO, APP_URL } from '@/lib/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  return ESTADOS_MEXICO.map((estado) => ({
    url: `${APP_URL}/zonas-arqueologicas/${estado.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
}
