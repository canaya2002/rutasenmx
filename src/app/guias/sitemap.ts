import type { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/constants';

/**
 * Mock guide slugs for sitemap generation.
 * In production, these will be fetched from the database.
 */
const MOCK_GUIAS = [
  { slug: 'como-planear-road-trip-mexico', updatedAt: '2026-03-15' },
  { slug: 'guia-pueblos-magicos-completa', updatedAt: '2026-03-10' },
  { slug: 'guia-ruta-maya-yucatan', updatedAt: '2026-03-05' },
  { slug: 'conducir-en-mexico-consejos', updatedAt: '2026-03-01' },
  { slug: 'mejores-epocas-para-viajar-mexico', updatedAt: '2026-02-25' },
  { slug: 'viajar-con-ninos-mexico', updatedAt: '2026-02-20' },
  { slug: 'guia-huasteca-potosina', updatedAt: '2026-02-15' },
  { slug: 'gastronomia-mexicana-por-estado', updatedAt: '2026-02-10' },
  { slug: 'seguridad-vial-mexico', updatedAt: '2026-02-05' },
  { slug: 'casetas-autopistas-mexico-costos', updatedAt: '2026-02-01' },
  { slug: 'guia-oaxaca-completa', updatedAt: '2026-01-25' },
  { slug: 'guia-chiapas-7-dias', updatedAt: '2026-01-20' },
  { slug: 'camping-mexico-guia', updatedAt: '2026-01-15' },
  { slug: 'ecoturismo-mexico-guia', updatedAt: '2026-01-10' },
  { slug: 'viajar-barato-mexico-tips', updatedAt: '2026-01-05' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // TODO: Replace with database query for all published guides
  return MOCK_GUIAS.map((guia) => ({
    url: `${APP_URL}/guias/${guia.slug}`,
    lastModified: new Date(guia.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
}
