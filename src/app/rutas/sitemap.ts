import type { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/constants';
import { mockRoutes } from '@/lib/data/mock';

/**
 * Route sitemap — now generated from the full editorial catalog in
 * `src/lib/data/mock.ts` (merged with `src/lib/data/routes.ts`). When the
 * catalog was migrated to a DB, this would switch to a Drizzle query — for
 * now static data is the source of truth.
 *
 * Google imposes 50,000 URLs per sitemap file; well under that here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return mockRoutes.map((r) => ({
    url: `${APP_URL}/rutas/${r.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
}
