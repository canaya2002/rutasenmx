// ---------------------------------------------------------------------------
// Catálogo unificado de guías: las 12 curadas originales + 224 generadas por
// estado (32 estados × 7 guías temáticas). Total ≈ 236 guías.
// Todas implementan la interfaz MockArticle y son consumibles por el slug
// dinámico /guias/[slug] sin cambios en el render del detalle.
// ---------------------------------------------------------------------------

import {
  mockArticles,
  mockStates,
  type MockArticle,
  type MockState,
} from './mock';
import {
  buildGeneratedGuides,
  getStateSlugFromGuideSlug,
} from './state-guides';

const generatedGuides = buildGeneratedGuides();

// Deduplicamos por slug — el dataset original tiene algunas guías que
// coincidirían con generaciones automáticas (ej. pueblos-magicos-hidalgo).
// Si existe en mockArticles, respetamos la versión editorial.
const existingSlugs = new Set(mockArticles.map((a) => a.slug));
const uniqueGenerated = generatedGuides.filter((g) => !existingSlugs.has(g.slug));

export const allGuides: MockArticle[] = [...mockArticles, ...uniqueGenerated];

export function getGuideBySlug(slug: string): MockArticle | undefined {
  return allGuides.find((g) => g.slug === slug);
}

/**
 * Dado un slug de guía, devuelve el estado al que pertenece la guía.
 * Útil para breadcrumbs, navegación contextual y SEO.
 */
export function getStateForGuide(slug: string): MockState | null {
  const stateSlug = getStateSlugFromGuideSlug(slug);
  if (!stateSlug) return null;
  return mockStates.find((s) => s.slug === stateSlug) ?? null;
}

/**
 * Retorna las guías asociadas a un estado específico.
 */
export function getGuidesByState(stateSlug: string): MockArticle[] {
  return allGuides.filter((g) => {
    const gState = getStateSlugFromGuideSlug(g.slug);
    if (gState === stateSlug) return true;
    // También incluir guías originales cuyas etiquetas contienen el nombre del estado
    const state = mockStates.find((s) => s.slug === stateSlug);
    if (!state) return false;
    const stateNameLower = state.name.toLowerCase();
    return g.tags.some((t) => t.toLowerCase().includes(stateNameLower));
  });
}

export { mockArticles };
