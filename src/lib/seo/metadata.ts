import type { Metadata } from "next";

const SITE_URL = "https://rutasenmx.com";
const APP_NAME = "Rutas en MX";
const DEFAULT_DESCRIPTION =
  "Descubre las mejores rutas, pueblos magicos, museos y zonas arqueologicas de Mexico. Planifica tu viaje con guias detalladas y mapas interactivos.";
const DEFAULT_OG_IMAGE = "/og-default.png";

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
    openGraph: {
      type: "website",
      locale: "es_MX",
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
    },
    icons: {
      icon: "/favicon.ico",
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
}

/**
 * Builds a complete Metadata object for an individual page.
 * Merges page-specific data with application defaults.
 */
export function buildPageMetadata(options: PageMetadataOptions): Metadata {
  const { title, description, path, image, noIndex, keywords } = options;

  const canonicalUrl = `${SITE_URL}${path}`;
  const ogImage = image ?? DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    keywords: keywords ?? undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
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
