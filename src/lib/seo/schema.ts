import type { BreadcrumbItem } from "./breadcrumbs";

const SITE_URL = "https://rutasenmx.com";
const APP_NAME = "Rutas en MX";
const DEFAULT_LOGO = `${SITE_URL}/logo.png`;

// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------

export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_NAME,
    url: SITE_URL,
    logo: DEFAULT_LOGO,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: "Spanish",
    },
  };
}

// ---------------------------------------------------------------------------
// WebSite (enables sitelinks search box in SERPs)
// ---------------------------------------------------------------------------

export function buildWebSiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_NAME,
    url: SITE_URL,
    inLanguage: "es",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/buscar?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ---------------------------------------------------------------------------
// BreadcrumbList
// ---------------------------------------------------------------------------

export function buildBreadcrumbSchema(
  items: BreadcrumbItem[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${SITE_URL}${item.href}`,
    })),
  };
}

// ---------------------------------------------------------------------------
// Place / TouristAttraction
// ---------------------------------------------------------------------------

export interface PlaceSchemaInput {
  name: string;
  slug: string;
  description: string;
  image?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  estado?: string;
  municipio?: string;
  rating?: number;
  reviewCount?: number;
}

export function buildPlaceSchema(
  place: PlaceSchemaInput
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: place.name,
    description: place.description,
    url: `${SITE_URL}/lugares/${place.slug}`,
  };

  if (place.image) {
    schema.image = place.image;
  }

  if (place.latitude != null && place.longitude != null) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: place.latitude,
      longitude: place.longitude,
    };
  }

  if (place.address || place.estado || place.municipio) {
    schema.address = {
      "@type": "PostalAddress",
      addressLocality: place.municipio ?? undefined,
      addressRegion: place.estado ?? undefined,
      addressCountry: "MX",
      ...(place.address ? { streetAddress: place.address } : {}),
    };
  }

  if (place.rating != null) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: place.rating,
      reviewCount: place.reviewCount ?? 0,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

// ---------------------------------------------------------------------------
// Museum
// ---------------------------------------------------------------------------

export interface MuseumSchemaInput extends PlaceSchemaInput {
  openingHours?: string;
  telephone?: string;
  priceRange?: string;
}

export function buildMuseumSchema(
  museum: MuseumSchemaInput
): Record<string, unknown> {
  const base = buildPlaceSchema(museum);

  return {
    ...base,
    "@type": "Museum",
    ...(museum.openingHours ? { openingHours: museum.openingHours } : {}),
    ...(museum.telephone ? { telephone: museum.telephone } : {}),
    ...(museum.priceRange ? { priceRange: museum.priceRange } : {}),
  };
}

// ---------------------------------------------------------------------------
// Article (for guides)
// ---------------------------------------------------------------------------

export interface ArticleSchemaInput {
  title: string;
  slug: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
}

export function buildArticleSchema(
  article: ArticleSchemaInput
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    url: `${SITE_URL}/guias/${article.slug}`,
    image: article.image ?? `${SITE_URL}/og-default.png`,
    datePublished: article.datePublished,
    dateModified: article.dateModified ?? article.datePublished,
    author: {
      "@type": "Organization",
      name: article.authorName ?? APP_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: APP_NAME,
      logo: {
        "@type": "ImageObject",
        url: DEFAULT_LOGO,
      },
    },
    inLanguage: "es",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/guias/${article.slug}`,
    },
  };
}

// ---------------------------------------------------------------------------
// CollectionPage
// ---------------------------------------------------------------------------

export interface CollectionItem {
  name: string;
  url: string;
  image?: string;
  description?: string;
}

export function buildCollectionPageSchema(
  title: string,
  description: string,
  items: CollectionItem[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: item.url,
        ...(item.image ? { image: item.image } : {}),
        ...(item.description ? { description: item.description } : {}),
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// ItemList (for listing / hub pages)
// ---------------------------------------------------------------------------

export interface ItemListEntry {
  name: string;
  url: string;
  image?: string;
  position?: number;
}

export function buildItemListSchema(
  items: ItemListEntry[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: item.position ?? index + 1,
      name: item.name,
      url: item.url,
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}

// ---------------------------------------------------------------------------
// Route (Trip / ItemList for route pages)
// ---------------------------------------------------------------------------

export interface RouteSchemaInput {
  name: string;
  slug: string;
  description: string;
  image?: string;
  stops: Array<{
    name: string;
    slug: string;
    latitude?: number;
    longitude?: number;
  }>;
  durationDays?: number;
  distanceKm?: number;
}

export function buildRouteSchema(
  route: RouteSchemaInput
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Trip",
    name: route.name,
    description: route.description,
    url: `${SITE_URL}/rutas/${route.slug}`,
    image: route.image ?? `${SITE_URL}/og-default.png`,
    ...(route.durationDays
      ? { duration: `P${route.durationDays}D` }
      : {}),
    itinerary: {
      "@type": "ItemList",
      numberOfItems: route.stops.length,
      itemListElement: route.stops.map((stop, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "TouristAttraction",
          name: stop.name,
          url: `${SITE_URL}/lugares/${stop.slug}`,
          ...(stop.latitude != null && stop.longitude != null
            ? {
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: stop.latitude,
                  longitude: stop.longitude,
                },
              }
            : {}),
        },
      })),
    },
  };
}
