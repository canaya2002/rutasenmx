const SITE_URL = "https://rutasenmx.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OgImageType = "place" | "estado" | "ruta" | "guia" | "coleccion" | "hub";

interface OgImageParams {
  title: string;
  subtitle?: string;
  image?: string;
}

// ---------------------------------------------------------------------------
// Core helper
// ---------------------------------------------------------------------------

/**
 * Builds a URL pointing to the dynamic OG image generation endpoint.
 * The endpoint is expected at `/api/og` and accepts query parameters
 * for type, title, subtitle, and an optional background image.
 */
export function getOgImageUrl(type: OgImageType, params: OgImageParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("type", type);
  searchParams.set("title", params.title);

  if (params.subtitle) {
    searchParams.set("subtitle", params.subtitle);
  }

  if (params.image) {
    searchParams.set("image", params.image);
  }

  return `${SITE_URL}/api/og?${searchParams.toString()}`;
}

/**
 * Returns the default OG image URL for pages without a specific image.
 */
export function getDefaultOgImage(): string {
  return DEFAULT_OG_IMAGE;
}

// ---------------------------------------------------------------------------
// Type-specific helpers
// ---------------------------------------------------------------------------

/**
 * OG image for a place (museo, zona arqueologica, pueblo magico, etc.)
 */
export function getPlaceOgImage(
  name: string,
  estadoName: string,
  image?: string
): string {
  return getOgImageUrl("place", {
    title: name,
    subtitle: estadoName,
    image,
  });
}

/**
 * OG image for a state (estado) hub page.
 */
export function getEstadoOgImage(
  estadoName: string,
  image?: string
): string {
  return getOgImageUrl("estado", {
    title: estadoName,
    subtitle: "Destinos y rutas",
    image,
  });
}

/**
 * OG image for a route (ruta) page.
 */
export function getRutaOgImage(
  rutaName: string,
  stopCount?: number,
  image?: string
): string {
  const subtitle = stopCount
    ? `${stopCount} parada${stopCount === 1 ? "" : "s"}`
    : undefined;

  return getOgImageUrl("ruta", {
    title: rutaName,
    subtitle,
    image,
  });
}

/**
 * OG image for a guide (guia) page.
 */
export function getGuiaOgImage(title: string, image?: string): string {
  return getOgImageUrl("guia", {
    title,
    subtitle: "Guia de viaje",
    image,
  });
}
