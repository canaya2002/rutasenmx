import type { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/constants';

/**
 * Mock place slugs for sitemap generation.
 * In production, these will be fetched from the database
 * (e.g., all published places with their slugs).
 */
const MOCK_PLACES = [
  { slug: 'teotihuacan', updatedAt: '2026-03-01' },
  { slug: 'chichen-itza', updatedAt: '2026-03-01' },
  { slug: 'monte-alban', updatedAt: '2026-03-01' },
  { slug: 'palenque', updatedAt: '2026-03-01' },
  { slug: 'tulum', updatedAt: '2026-03-01' },
  { slug: 'uxmal', updatedAt: '2026-02-15' },
  { slug: 'tajin', updatedAt: '2026-02-15' },
  { slug: 'calakmul', updatedAt: '2026-02-15' },
  { slug: 'museo-nacional-de-antropologia', updatedAt: '2026-03-10' },
  { slug: 'museo-frida-kahlo', updatedAt: '2026-03-10' },
  { slug: 'museo-soumaya', updatedAt: '2026-03-10' },
  { slug: 'museo-de-arte-popular', updatedAt: '2026-02-20' },
  { slug: 'real-de-catorce', updatedAt: '2026-02-01' },
  { slug: 'taxco', updatedAt: '2026-02-01' },
  { slug: 'san-cristobal-de-las-casas', updatedAt: '2026-02-01' },
  { slug: 'valladolid', updatedAt: '2026-02-01' },
  { slug: 'bacalar', updatedAt: '2026-02-01' },
  { slug: 'mazunte', updatedAt: '2026-01-15' },
  { slug: 'hierve-el-agua', updatedAt: '2026-01-15' },
  { slug: 'grutas-de-tolantongo', updatedAt: '2026-01-15' },
  { slug: 'cenote-ik-kil', updatedAt: '2026-01-15' },
  { slug: 'cascada-de-tamul', updatedAt: '2026-01-15' },
  { slug: 'isla-holbox', updatedAt: '2026-01-10' },
  { slug: 'sayulita', updatedAt: '2026-01-10' },
  { slug: 'huasteca-potosina', updatedAt: '2026-01-10' },
  { slug: 'barrancas-del-cobre', updatedAt: '2026-01-10' },
  { slug: 'xochimilco', updatedAt: '2026-01-05' },
  { slug: 'guanajuato-capital', updatedAt: '2026-01-05' },
  { slug: 'oaxaca-capital', updatedAt: '2026-01-05' },
  { slug: 'merida', updatedAt: '2026-01-05' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // TODO: Replace with database query for all published places
  // const places = await db.select().from(places).where(eq(places.published, true));

  return MOCK_PLACES.map((place) => ({
    url: `${APP_URL}/lugares/${place.slug}`,
    lastModified: new Date(place.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
}
