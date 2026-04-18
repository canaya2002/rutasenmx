// ---------------------------------------------------------------------------
// Catálogo unificado de rutas: las editoriales originales (mockRoutes) + 104
// rutas del seed nacional importadas vía seed-routes.ts
// Se dedupe por slug para que la versión editorial siempre gane.
// ---------------------------------------------------------------------------

import { mockRoutes, type MockRoute } from './mock';
import { seedRoutes } from './seed-routes';

const editorialSlugs = new Set(mockRoutes.map((r) => r.slug));
const uniqueSeed = seedRoutes.filter((r) => !editorialSlugs.has(r.slug));

export const allRoutes: MockRoute[] = [...mockRoutes, ...uniqueSeed];

export function getAnyRouteBySlug(slug: string): MockRoute | undefined {
  return allRoutes.find((r) => r.slug === slug);
}

export function getRoutesByState(stateSlug: string): MockRoute[] {
  return allRoutes.filter((r) => r.statesSlugs.includes(stateSlug));
}

export { mockRoutes };
