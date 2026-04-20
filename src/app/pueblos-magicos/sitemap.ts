import type { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/constants';
import {
  getAllPueblos,
  getEstadosWithPueblos,
} from '@/lib/pueblos-magicos';

export default function sitemap(): MetadataRoute.Sitemap {
  const buildStamp = new Date(
    process.env.BUILD_TIMESTAMP ?? '2026-04-20T00:00:00Z',
  );
  const estados = getEstadosWithPueblos().map((e) => ({
    url: `${APP_URL}/pueblos-magicos/${e.slug}`,
    lastModified: buildStamp,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  const pueblos = getAllPueblos().map((p) => ({
    url: `${APP_URL}/pueblos-magicos/${p.estadoSlug}/${p.slug}`,
    lastModified: buildStamp,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
  return [...estados, ...pueblos];
}
