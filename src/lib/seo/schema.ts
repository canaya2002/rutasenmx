import type { BreadcrumbItem } from "./breadcrumbs";

const SITE_URL = "https://rutasenmx.com";
const APP_NAME = "Rutas en MX";
const DEFAULT_LOGO = `${SITE_URL}/logo.png`;
const DEFAULT_OG = `${SITE_URL}/og-default.png`;

// ---------------------------------------------------------------------------
// Organization (enriched with address, contactPoint, sameAs, areaServed,
// founding data and services)
// ---------------------------------------------------------------------------

export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: APP_NAME,
    alternateName: ["RutasEnMX", "Rutas MX"],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: DEFAULT_LOGO,
      width: 512,
      height: 512,
      caption: APP_NAME,
    },
    image: DEFAULT_OG,
    description:
      "Plataforma editorial e inteligente para planear viajes por carretera en México: Pueblos Mágicos, zonas arqueológicas, museos, gastronomía regional y rutas curadas con mapas interactivos.",
    slogan: "Descubre México por carretera",
    foundingDate: "2025-01-01",
    areaServed: {
      "@type": "Country",
      name: "México",
    },
    knowsLanguage: ["es", "es-MX", "en", "en-US"],
    address: {
      "@type": "PostalAddress",
      addressCountry: "MX",
      addressRegion: "Ciudad de México",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: "soporte@rutasenmx.com",
        availableLanguage: ["Spanish", "English"],
        areaServed: "MX",
      },
      {
        "@type": "ContactPoint",
        contactType: "press office",
        email: "prensa@rutasenmx.com",
        availableLanguage: ["Spanish", "English"],
      },
      {
        "@type": "ContactPoint",
        contactType: "privacy",
        email: "privacidad@rutasenmx.com",
        availableLanguage: ["Spanish", "English"],
      },
    ],
    sameAs: [
      "https://twitter.com/rutasenmx",
      "https://www.instagram.com/rutasenmx",
      "https://www.facebook.com/rutasenmx",
      "https://www.youtube.com/@rutasenmx",
      "https://www.tiktok.com/@rutasenmx",
      "https://www.linkedin.com/company/rutasenmx",
    ],
  };
}

// ---------------------------------------------------------------------------
// WebSite (enables sitelinks search box in SERPs) — enriched
// ---------------------------------------------------------------------------

export function buildWebSiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: APP_NAME,
    alternateName: "RutasEnMX",
    url: SITE_URL,
    description:
      "Planea rutas por carretera en México: Pueblos Mágicos, zonas arqueológicas, museos, gastronomía, guías de viaje y mapas interactivos.",
    inLanguage: ["es-MX", "en-US"],
    publisher: { "@id": `${SITE_URL}/#organization` },
    copyrightHolder: { "@id": `${SITE_URL}/#organization` },
    copyrightYear: new Date().getFullYear(),
    potentialAction: [
      {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/explorar?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    ],
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
// Place / TouristAttraction — enriched
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
  category?: string;
  tags?: string[];
  openingHours?: string;
  priceRange?: string;
  telephone?: string;
  website?: string;
}

export function buildPlaceSchema(
  place: PlaceSchemaInput
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "@id": `${SITE_URL}/lugares/${place.slug}#place`,
    name: place.name,
    alternateName: place.name,
    description: place.description,
    url: `${SITE_URL}/lugares/${place.slug}`,
    isAccessibleForFree: true,
    publicAccess: true,
    tourBookingPage: `${SITE_URL}/lugares/${place.slug}`,
    touristType: [
      "Family",
      "Couples",
      "Solo",
      "Groups",
      "Cultural",
      "Adventure",
      "Foodie",
    ],
  };

  if (place.image) {
    schema.image = {
      "@type": "ImageObject",
      url: place.image.startsWith("http") ? place.image : `${SITE_URL}${place.image}`,
      caption: place.name,
    };
    schema.photo = schema.image;
  }

  if (place.latitude != null && place.longitude != null) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: place.latitude,
      longitude: place.longitude,
      addressCountry: "MX",
    };
    schema.hasMap = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
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

  if (place.openingHours) schema.openingHours = place.openingHours;
  if (place.telephone) schema.telephone = place.telephone;
  if (place.website) schema.sameAs = place.website;
  if (place.priceRange) schema.priceRange = place.priceRange;

  if (place.tags && place.tags.length > 0) {
    schema.keywords = place.tags.join(", ");
  }

  schema.publisher = { "@id": `${SITE_URL}/#organization` };
  schema.inLanguage = "es-MX";

  return schema;
}

// ---------------------------------------------------------------------------
// Museum — enriched
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
  };
}

// ---------------------------------------------------------------------------
// Archaeological Site
// ---------------------------------------------------------------------------

export function buildArchaeologicalSiteSchema(
  site: PlaceSchemaInput
): Record<string, unknown> {
  const base = buildPlaceSchema(site);
  return {
    ...base,
    "@type": ["LandmarksOrHistoricalBuildings", "TouristAttraction", "Place"],
  };
}

// ---------------------------------------------------------------------------
// Beach
// ---------------------------------------------------------------------------

export function buildBeachSchema(
  beach: PlaceSchemaInput
): Record<string, unknown> {
  const base = buildPlaceSchema(beach);
  return { ...base, "@type": ["Beach", "TouristAttraction"] };
}

// ---------------------------------------------------------------------------
// Article (for guides) — enriched
// ---------------------------------------------------------------------------

export interface ArticleSchemaInput {
  title: string;
  slug: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  keywords?: string[];
  wordCount?: number;
  articleSection?: string;
  about?: { name: string; region?: string };
}

export function buildArticleSchema(
  article: ArticleSchemaInput
): Record<string, unknown> {
  const imageUrl = article.image
    ? article.image.startsWith("http")
      ? article.image
      : `${SITE_URL}${article.image}`
    : DEFAULT_OG;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${SITE_URL}/guias/${article.slug}#article`,
    headline: article.title,
    alternativeHeadline: article.title,
    description: article.description,
    url: `${SITE_URL}/guias/${article.slug}`,
    image: {
      "@type": "ImageObject",
      url: imageUrl,
      width: 1200,
      height: 630,
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified ?? article.datePublished,
    author: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: article.authorName ?? APP_NAME,
      url: SITE_URL,
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "es-MX",
    isAccessibleForFree: true,
    ...(article.keywords && article.keywords.length > 0
      ? { keywords: article.keywords.join(", ") }
      : {}),
    ...(article.wordCount ? { wordCount: article.wordCount } : {}),
    ...(article.articleSection ? { articleSection: article.articleSection } : {}),
    ...(article.about
      ? {
          about: {
            "@type": "Place",
            name: article.about.name,
            ...(article.about.region
              ? {
                  address: {
                    "@type": "PostalAddress",
                    addressRegion: article.about.region,
                    addressCountry: "MX",
                  },
                }
              : {}),
          },
        }
      : {}),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/guias/${article.slug}`,
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", "p"],
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
    inLanguage: "es-MX",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
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
  description?: string;
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
      ...(item.description ? { description: item.description } : {}),
    })),
  };
}

// ---------------------------------------------------------------------------
// Route / Trip / TouristTrip — enriched with itinerary + offers
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
  origin?: string;
  destination?: string;
  estimatedCostMXN?: number; // in cents
  difficulty?: string;
  highlights?: string[];
}

export function buildRouteSchema(
  route: RouteSchemaInput
): Record<string, unknown> {
  const imageUrl = route.image
    ? route.image.startsWith("http")
      ? route.image
      : `${SITE_URL}${route.image}`
    : DEFAULT_OG;

  return {
    "@context": "https://schema.org",
    "@type": ["TouristTrip", "Trip"],
    "@id": `${SITE_URL}/rutas/${route.slug}#trip`,
    name: route.name,
    description: route.description,
    url: `${SITE_URL}/rutas/${route.slug}`,
    image: {
      "@type": "ImageObject",
      url: imageUrl,
      width: 1200,
      height: 630,
    },
    ...(route.durationDays ? { tripDuration: `P${route.durationDays}D` } : {}),
    ...(route.durationDays ? { duration: `P${route.durationDays}D` } : {}),
    inLanguage: "es-MX",
    provider: { "@id": `${SITE_URL}/#organization` },
    touristType: [
      "Road trippers",
      "Families",
      "Cultural travelers",
      "Adventure",
      "Foodies",
    ],
    ...(route.origin
      ? {
          departureLocation: {
            "@type": "Place",
            name: route.origin,
          },
        }
      : {}),
    ...(route.destination
      ? {
          arrivalLocation: {
            "@type": "Place",
            name: route.destination,
          },
        }
      : {}),
    ...(route.estimatedCostMXN
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "MXN",
            price: (route.estimatedCostMXN / 100).toFixed(0),
            availability: "https://schema.org/InStock",
            validFrom: new Date().toISOString().split("T")[0],
          },
        }
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
                  addressCountry: "MX",
                },
              }
            : {}),
        },
      })),
    },
    ...(route.highlights && route.highlights.length > 0
      ? { keywords: route.highlights.join(", ") }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// FAQPage (for precios, acerca-de, and any page with Q&A)
// ---------------------------------------------------------------------------

export interface FAQEntry {
  question: string;
  answer: string;
}

export function buildFAQSchema(entries: FAQEntry[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };
}

// ---------------------------------------------------------------------------
// HowTo (for route planning guides and step-by-step articles)
// ---------------------------------------------------------------------------

export interface HowToStep {
  name: string;
  text: string;
  url?: string;
  image?: string;
}

export function buildHowToSchema(
  name: string,
  description: string,
  steps: HowToStep[],
  totalTime?: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    inLanguage: "es-MX",
    ...(totalTime ? { totalTime } : {}),
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.url ? { url: s.url } : {}),
      ...(s.image ? { image: s.image } : {}),
    })),
  };
}

// ---------------------------------------------------------------------------
// Product / Offer (for pricing page with subscription plans)
// ---------------------------------------------------------------------------

export interface ProductOfferInput {
  name: string;
  description: string;
  priceMonthly: number; // cents
  priceAnnual: number; // cents
  slug: string;
  features?: string[];
}

export function buildProductSchema(plan: ProductOfferInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Plan ${plan.name} · ${APP_NAME}`,
    description: plan.description,
    brand: { "@id": `${SITE_URL}/#organization` },
    category: "SaaS / Travel planning",
    url: `${SITE_URL}/precios#${plan.slug}`,
    offers: [
      {
        "@type": "Offer",
        name: `${plan.name} mensual`,
        priceCurrency: "MXN",
        price: (plan.priceMonthly / 100).toFixed(0),
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/precios#${plan.slug}`,
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: (plan.priceMonthly / 100).toFixed(0),
          priceCurrency: "MXN",
          billingIncrement: 1,
          unitCode: "MON",
        },
      },
      {
        "@type": "Offer",
        name: `${plan.name} anual`,
        priceCurrency: "MXN",
        price: (plan.priceAnnual / 100).toFixed(0),
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/precios#${plan.slug}`,
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: (plan.priceAnnual / 100).toFixed(0),
          priceCurrency: "MXN",
          billingIncrement: 12,
          unitCode: "ANN",
        },
      },
    ],
    ...(plan.features && plan.features.length > 0
      ? {
          additionalProperty: plan.features.map((f) => ({
            "@type": "PropertyValue",
            name: "Feature",
            value: f,
          })),
        }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// LocalBusiness / Service (for the platform itself as a tourism service)
// ---------------------------------------------------------------------------

export function buildServiceSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${APP_NAME} — Planificación de viajes por carretera`,
    serviceType: "Trip Planning Service",
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: { "@type": "Country", name: "México" },
    description:
      "Servicio digital de planificación de viajes por carretera en México con rutas curadas, guías editoriales, mapas interactivos y planificador IA.",
    audience: {
      "@type": "Audience",
      audienceType: "Travelers in Mexico",
      geographicArea: { "@type": "Country", name: "México" },
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Planes de suscripción",
      url: `${SITE_URL}/precios`,
    },
  };
}

// ---------------------------------------------------------------------------
// Place (generic state region)
// ---------------------------------------------------------------------------

export interface StateRegionInput {
  name: string;
  slug: string;
  description: string;
  image?: string;
  capital?: string;
}

export function buildStateRegionSchema(
  state: StateRegionInput
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": ["State", "AdministrativeArea", "Place"],
    "@id": `${SITE_URL}/estados/${state.slug}#state`,
    name: state.name,
    description: state.description,
    url: `${SITE_URL}/estados/${state.slug}`,
    ...(state.image
      ? {
          image: state.image.startsWith("http")
            ? state.image
            : `${SITE_URL}${state.image}`,
        }
      : {}),
    containedInPlace: { "@type": "Country", name: "México" },
    ...(state.capital
      ? {
          containsPlace: {
            "@type": "City",
            name: state.capital,
          },
        }
      : {}),
    inLanguage: "es-MX",
  };
}

// ---------------------------------------------------------------------------
// WebPage (generic, linked to WebSite + Organization)
// ---------------------------------------------------------------------------

export function buildWebPageSchema(
  title: string,
  description: string,
  path: string,
  options?: { lastReviewed?: string; primaryImage?: string }
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${path}#webpage`,
    url: `${SITE_URL}${path}`,
    name: title,
    description,
    inLanguage: "es-MX",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    ...(options?.lastReviewed ? { lastReviewed: options.lastReviewed } : {}),
    ...(options?.primaryImage
      ? {
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: options.primaryImage.startsWith("http")
              ? options.primaryImage
              : `${SITE_URL}${options.primaryImage}`,
          },
        }
      : {}),
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", "p"],
    },
  };
}

// ---------------------------------------------------------------------------
// Graph builder — combines multiple entities in a single JSON-LD @graph
// so search engines see them as related (best practice).
// ---------------------------------------------------------------------------

export function buildGraph(
  entities: Array<Record<string, unknown>>
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": entities.map((e) => {
      const { "@context": _ctx, ...rest } = e as { "@context"?: string };
      return rest;
    }),
  };
}
