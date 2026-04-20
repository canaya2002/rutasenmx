import type { MetadataRoute } from 'next';
import { ESTADOS_MEXICO, APP_URL } from '@/lib/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  const buildStamp = new Date(
    process.env.BUILD_TIMESTAMP ?? '2026-04-20T00:00:00Z',
  );
  return ESTADOS_MEXICO.map((estado) => ({
    url: `${APP_URL}/zonas-arqueologicas/${estado.slug}`,
    lastModified: buildStamp,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
}
