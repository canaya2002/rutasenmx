/**
 * Seeds the initial set of editorial foros + canales.
 *
 * Usage:
 *   npx tsx scripts/seed-social-communities.ts
 *
 * Idempotent: runs INSERT ... ON CONFLICT DO NOTHING on `slug`.
 */
import { sql } from 'drizzle-orm';

import { db } from '../src/db';
import { socialCommunities } from '../src/db/schema';

const SEEDS: Array<{
  type: 'forum' | 'channel';
  slug: string;
  name: string;
  description: string;
}> = [
  {
    type: 'forum',
    slug: 'gastronomia-mexicana',
    name: 'Gastronomía mexicana',
    description:
      'Comparte experiencias con tacos, mole, mariscos, mezcales y todos los sabores de México. Recomienda fondas, mercados y recetas.',
  },
  {
    type: 'forum',
    slug: 'pueblos-magicos',
    name: 'Pueblos Mágicos',
    description:
      'Preguntas, fotos e itinerarios de los 177 Pueblos Mágicos. Tips de temporada, hospedaje y rutas desde tu ciudad.',
  },
  {
    type: 'forum',
    slug: 'road-trips',
    name: 'Road trips',
    description:
      'Rutas por carretera, estado de caminos, casetas, combustible, paradas útiles y compañía para viajar.',
  },
  {
    type: 'forum',
    slug: 'playas-y-caribe',
    name: 'Playas y Caribe',
    description:
      'Pacífico, Caribe y Golfo: recomendaciones de playas, bahías, snorkel, buceo y ecoturismo costero.',
  },
  {
    type: 'forum',
    slug: 'naturaleza-y-aventura',
    name: 'Naturaleza y aventura',
    description:
      'Cascadas, cenotes, volcanes, barrancas y senderismo. Operadores confiables, permisos y seguridad.',
  },
  {
    type: 'forum',
    slug: 'cultura-y-arte',
    name: 'Cultura y arte',
    description:
      'Museos, zonas arqueológicas, festivales, cine, música y expresiones regionales.',
  },
  {
    type: 'forum',
    slug: 'viajar-con-mascotas',
    name: 'Viajar con mascotas',
    description:
      'Hoteles pet-friendly, playas aptas, restaurantes y consejos para viajar con tu perro o gato.',
  },
  {
    type: 'forum',
    slug: 'solo-travelers',
    name: 'Viajeros solos',
    description:
      'Compartir experiencias de viaje en solitario por México, seguridad y cómo conocer gente en el camino.',
  },
  {
    type: 'channel',
    slug: 'anuncios-rutas-en-mx',
    name: 'Anuncios · Rutas en MX',
    description:
      'Novedades del equipo: nuevas rutas, lanzamientos, alertas de seguridad y notas editoriales.',
  },
];

async function main() {
  for (const seed of SEEDS) {
    try {
      await db.execute(sql`
        INSERT INTO social_communities (type, slug, name, description, is_public, requires_approval)
        VALUES (${seed.type}, ${seed.slug}, ${seed.name}, ${seed.description}, true, false)
        ON CONFLICT (slug) DO NOTHING
      `);
      console.log(`✓ ${seed.type}: ${seed.slug}`);
    } catch (err) {
      console.error(`✗ ${seed.slug}:`, err);
    }
  }
  console.log(`\nDone. ${SEEDS.length} communities seeded.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
