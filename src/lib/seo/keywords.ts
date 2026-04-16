// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KeywordCluster {
  primary: string;
  secondary: string[];
  targetUrl: string;
  intent: string;
}

// ---------------------------------------------------------------------------
// Keyword templates by page type
// ---------------------------------------------------------------------------

type KeywordParams = Record<string, string>;

interface KeywordTemplate {
  primary: (params: KeywordParams) => string;
  secondary: (params: KeywordParams) => string[];
  intent: string;
}

const KEYWORD_TEMPLATES: Record<string, KeywordTemplate> = {
  home: {
    primary: () => "rutas de viaje mexico",
    secondary: () => [
      "viajes por mexico",
      "destinos turisticos mexico",
      "que visitar en mexico",
      "planificar viaje mexico",
      "turismo en mexico",
    ],
    intent: "navigational",
  },
  estado: {
    primary: ({ name }) => `que visitar en ${name}`,
    secondary: ({ name }) => [
      `turismo en ${name}`,
      `lugares turisticos ${name}`,
      `destinos ${name}`,
      `viaje a ${name}`,
      `${name} mexico turismo`,
    ],
    intent: "informational",
  },
  lugar: {
    primary: ({ name }) => `${name}`,
    secondary: ({ name, estado, category }) => [
      `${name} ${estado}`,
      `visitar ${name}`,
      `${name} como llegar`,
      `${name} horarios`,
      `${category} ${estado}`,
    ],
    intent: "informational",
  },
  museo: {
    primary: ({ name }) => `${name}`,
    secondary: ({ name, estado }) => [
      `${name} horarios y precios`,
      `museos en ${estado}`,
      `visitar ${name}`,
      `${name} exposiciones`,
      `${name} como llegar`,
    ],
    intent: "informational",
  },
  "zona-arqueologica": {
    primary: ({ name }) => `${name}`,
    secondary: ({ name, estado }) => [
      `${name} zona arqueologica`,
      `zonas arqueologicas ${estado}`,
      `${name} historia`,
      `${name} horarios y costos`,
      `visitar ${name}`,
    ],
    intent: "informational",
  },
  "pueblo-magico": {
    primary: ({ name }) => `${name} pueblo magico`,
    secondary: ({ name, estado }) => [
      `que hacer en ${name}`,
      `pueblos magicos ${estado}`,
      `${name} que visitar`,
      `${name} como llegar`,
      `pueblo magico ${name} ${estado}`,
    ],
    intent: "informational",
  },
  ruta: {
    primary: ({ name }) => `ruta ${name}`,
    secondary: ({ name }) => [
      `itinerario ${name}`,
      `ruta de viaje ${name}`,
      `recorrido ${name}`,
      `${name} que visitar`,
      `${name} mapa de ruta`,
    ],
    intent: "transactional",
  },
  guia: {
    primary: ({ name }) => `guia ${name}`,
    secondary: ({ name }) => [
      `${name} consejos de viaje`,
      `${name} guia completa`,
      `${name} recomendaciones`,
      `como viajar a ${name}`,
      `${name} tips de viaje`,
    ],
    intent: "informational",
  },
  coleccion: {
    primary: ({ name }) => `${name}`,
    secondary: ({ name }) => [
      `mejores ${name}`,
      `top ${name} mexico`,
      `lista de ${name}`,
      `${name} recomendados`,
    ],
    intent: "informational",
  },
  hub: {
    primary: ({ name }) => `${name} en mexico`,
    secondary: ({ name }) => [
      `mejores ${name} mexico`,
      `lista ${name}`,
      `${name} por estado`,
      `todos los ${name}`,
    ],
    intent: "navigational",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a keyword cluster for a given page type and parameters.
 * The cluster contains a primary keyword, secondary keywords,
 * the target URL, and the search intent category.
 */
export function getKeywordCluster(
  pageType: string,
  params: KeywordParams & { url: string }
): KeywordCluster {
  const template = KEYWORD_TEMPLATES[pageType];

  if (!template) {
    return {
      primary: params.name ?? "",
      secondary: [],
      targetUrl: params.url,
      intent: "informational",
    };
  }

  return {
    primary: template.primary(params),
    secondary: template.secondary(params),
    targetUrl: params.url,
    intent: template.intent,
  };
}

/**
 * Builds an SEO-optimized title string using a keyword cluster
 * and an optional template. The template can include `{primary}`
 * and `{secondary}` placeholders.
 *
 * @example
 * buildTitleFromKeywords(cluster, "{primary} - {secondary}")
 */
export function buildTitleFromKeywords(
  cluster: KeywordCluster,
  template?: string
): string {
  const tpl = template ?? "{primary}";

  return tpl
    .replace("{primary}", cluster.primary)
    .replace(
      "{secondary}",
      cluster.secondary.length > 0 ? cluster.secondary[0] : ""
    )
    .trim();
}
