import type { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/constants';

/**
 * Mock route slugs for sitemap generation.
 * In production, these will be fetched from the database.
 */
const MOCK_RUTAS = [
  { slug: 'cdmx-oaxaca', updatedAt: '2026-03-01' },
  { slug: 'cdmx-puebla-cholula', updatedAt: '2026-03-01' },
  { slug: 'cdmx-queretaro-san-miguel', updatedAt: '2026-02-20' },
  { slug: 'cdmx-veracruz', updatedAt: '2026-02-20' },
  { slug: 'ruta-del-vino-baja-california', updatedAt: '2026-02-15' },
  { slug: 'ruta-maya-yucatan', updatedAt: '2026-02-15' },
  { slug: 'ruta-huasteca-potosina', updatedAt: '2026-02-10' },
  { slug: 'pueblos-magicos-hidalgo', updatedAt: '2026-02-10' },
  { slug: 'ruta-del-mezcal-oaxaca', updatedAt: '2026-02-01' },
  { slug: 'costa-oaxaquena', updatedAt: '2026-02-01' },
  { slug: 'ruta-de-cenotes-yucatan', updatedAt: '2026-01-25' },
  { slug: 'barrancas-del-cobre-chihuahua', updatedAt: '2026-01-25' },
  { slug: 'riviera-nayarit', updatedAt: '2026-01-20' },
  { slug: 'ruta-del-tequila-jalisco', updatedAt: '2026-01-20' },
  { slug: 'cdmx-acapulco', updatedAt: '2026-01-15' },
  { slug: 'ruta-de-los-conventos-morelos', updatedAt: '2026-01-15' },
  { slug: 'chiapas-completa', updatedAt: '2026-01-10' },
  { slug: 'cdmx-real-de-catorce', updatedAt: '2026-01-10' },
  { slug: 'peninsula-de-yucatan-completa', updatedAt: '2026-01-05' },
  { slug: 'ruta-purepecha-michoacan', updatedAt: '2026-01-05' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // TODO: Replace with database query for all published routes
  return MOCK_RUTAS.map((ruta) => ({
    url: `${APP_URL}/rutas/${ruta.slug}`,
    lastModified: new Date(ruta.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
}
