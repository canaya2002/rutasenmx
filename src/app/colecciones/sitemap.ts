import type { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/constants';

/**
 * Mock collection slugs for sitemap generation.
 * In production, these will be fetched from the database.
 */
const MOCK_COLECCIONES = [
  { slug: 'escapadas-fin-de-semana-cdmx', updatedAt: '2026-03-10' },
  { slug: 'mejores-playas-mexico', updatedAt: '2026-03-05' },
  { slug: 'pueblos-magicos-imperdibles', updatedAt: '2026-03-01' },
  { slug: 'cenotes-yucatan', updatedAt: '2026-02-25' },
  { slug: 'zonas-arqueologicas-mas-visitadas', updatedAt: '2026-02-20' },
  { slug: 'destinos-romanticos-mexico', updatedAt: '2026-02-14' },
  { slug: 'rutas-en-familia', updatedAt: '2026-02-10' },
  { slug: 'viaje-con-mascotas', updatedAt: '2026-02-05' },
  { slug: 'museos-imperdibles-cdmx', updatedAt: '2026-02-01' },
  { slug: 'cascadas-mexico', updatedAt: '2026-01-25' },
  { slug: 'gastronomia-oaxaca', updatedAt: '2026-01-20' },
  { slug: 'ecoturismo-chiapas', updatedAt: '2026-01-15' },
  { slug: 'viñedos-baja-california', updatedAt: '2026-01-10' },
  { slug: 'semana-santa-destinos', updatedAt: '2026-01-05' },
  { slug: 'dia-de-muertos-michoacan', updatedAt: '2026-01-01' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // TODO: Replace with database query for all published collections
  return MOCK_COLECCIONES.map((col) => ({
    url: `${APP_URL}/colecciones/${col.slug}`,
    lastModified: new Date(col.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
}
