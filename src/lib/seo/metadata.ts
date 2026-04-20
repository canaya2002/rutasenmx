import type { Metadata } from "next";

const SITE_URL = "https://rutasenmx.com";
const APP_NAME = "Rutas en MX";
const DEFAULT_DESCRIPTION =
  "Descubre las mejores rutas por carretera, Pueblos Mágicos, museos y zonas arqueológicas de México. Más de 100 rutas, 200+ guías editoriales y herramientas para planear tu próximo road trip con mapas interactivos, paradas recomendadas y costos estimados.";
const DEFAULT_KEYWORDS = [
  "rutas México",
  "road trip México",
  "pueblos mágicos",
  "zonas arqueológicas",
  "museos México",
  "viaje por carretera",
  "turismo México",
  "guías de viaje",
  "planear viaje México",
  "itinerarios México",
];
// Fallback to /icon.png until a dedicated 1200×630 OG image is produced.
// Keep as const so both metadata.ts and sitemap.ts stay in sync.
const DEFAULT_OG_IMAGE = "/icon.png";

/**
 * Returns the base Metadata object shared across the entire application.
 * Use this in the root layout to establish defaults that all pages inherit.
 */
export function getBaseMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: APP_NAME,
    title: {
      default: APP_NAME,
      template: `%s | ${APP_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    authors: [{ name: APP_NAME, url: SITE_URL }],
    creator: APP_NAME,
    publisher: APP_NAME,
    category: "travel",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: "es_MX",
      alternateLocale: ["en_US"],
      url: SITE_URL,
      siteName: APP_NAME,
      title: {
        default: APP_NAME,
        template: `%s | ${APP_NAME}`,
      },
      description: DEFAULT_DESCRIPTION,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: APP_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@rutasenmx",
      creator: "@rutasenmx",
      title: {
        default: APP_NAME,
        template: `%s | ${APP_NAME}`,
      },
      description: DEFAULT_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: SITE_URL,
      languages: {
        "es-MX": SITE_URL,
        "en-US": SITE_URL,
      },
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-icon.png",
    },
    verification: {
      // Placeholders listos para ser sobreescritos con envs si se configuran
      // google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  };
}

export interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
  type?: "article" | "website" | "profile";
  publishedTime?: string;
  modifiedTime?: string;
}

/**
 * Builds a complete Metadata object for an individual page.
 * Merges page-specific data with application defaults.
 */
export function buildPageMetadata(options: PageMetadataOptions): Metadata {
  const {
    title,
    description,
    path,
    image,
    noIndex,
    keywords,
    type = "website",
    publishedTime,
    modifiedTime,
  } = options;

  const canonicalUrl = `${SITE_URL}${path}`;
  const ogImage = image ?? DEFAULT_OG_IMAGE;
  const mergedKeywords = keywords
    ? Array.from(new Set([...keywords, ...DEFAULT_KEYWORDS.slice(0, 4)]))
    : DEFAULT_KEYWORDS;

  return {
    title,
    description,
    keywords: mergedKeywords,
    alternates: {
      canonical: canonicalUrl,
      // Both locales are served at the same URL via content negotiation,
      // so we list them with the same href plus an x-default fallback as
      // recommended by Google when pages serve multiple languages from one URL.
      languages: {
        "es-MX": canonicalUrl,
        "en-US": canonicalUrl,
        "x-default": canonicalUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: type === "article" ? "article" : "website",
      locale: "es_MX",
      alternateLocale: ["en_US"],
      siteName: APP_NAME,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@rutasenmx",
      creator: "@rutasenmx",
      title,
      description,
      images: [ogImage],
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      },
    }),
  };
}
