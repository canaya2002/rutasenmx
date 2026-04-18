import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { LocaleProvider } from '@/components/providers/LocaleProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GoogleAnalytics } from '@/components/seo/GoogleAnalytics';
import { JsonLd } from '@/components/seo/JsonLd';
import { getLocale, getTranslations } from '@/lib/i18n/server';
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildServiceSchema,
  buildGraph,
} from '@/lib/seo/schema';
import './globals.css';

const SITE_URL = 'https://rutasenmx.com';

/* ------------------------------------------------------------------
 * Fonts
 * ------------------------------------------------------------------ */
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  display: 'swap',
});

/* ------------------------------------------------------------------
 * Metadata (root — applies to every page unless overridden)
 * ------------------------------------------------------------------ */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Rutas en MX — Planea rutas por México, Pueblos Mágicos y escapadas',
    template: '%s | Rutas en MX',
  },
  description:
    'Planea rutas por México, descubre Pueblos Mágicos, museos, zonas arqueológicas y escapadas por carretera con mapas, ideas de viaje e itinerarios. Más de 200 guías editoriales y 100+ rutas curadas.',
  applicationName: 'Rutas en MX',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  authors: [{ name: 'Rutas en MX', url: SITE_URL }],
  creator: 'Rutas en MX',
  publisher: 'Rutas en MX',
  keywords: [
    'rutas México',
    'rutas por México',
    'road trip México',
    'Pueblos Mágicos',
    'pueblos mágicos México',
    'viaje por carretera',
    'viajes por carretera México',
    'zonas arqueológicas',
    'zonas arqueológicas México',
    'museos México',
    'itinerarios México',
    'escapadas fin de semana',
    'cenotes Yucatán',
    'ruta maya',
    'barrancas del cobre',
    'valle de Guadalupe',
    'gastronomía mexicana',
    'turismo México',
    'mapa turístico México',
    'planear viaje México',
    'autopilot IA viajes',
  ],
  category: 'travel',
  classification: 'Tourism & Travel',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    alternateLocale: ['en_US'],
    url: SITE_URL,
    siteName: 'Rutas en MX',
    title: 'Rutas en MX — Planea rutas por México, Pueblos Mágicos y escapadas',
    description:
      'Planea rutas por México, descubre Pueblos Mágicos, museos, zonas arqueológicas y escapadas por carretera. Más de 200 guías editoriales y 100+ rutas curadas con mapas interactivos.',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Rutas en MX — Descubre México por carretera',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@rutasenmx',
    creator: '@rutasenmx',
    title: 'Rutas en MX — Planea rutas por México, Pueblos Mágicos y escapadas',
    description:
      'Más de 200 guías editoriales y 100+ rutas curadas para recorrer México por carretera.',
    images: ['/og-default.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Rutas en MX',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'es-MX': SITE_URL,
      'en-US': SITE_URL,
      'x-default': SITE_URL,
    },
    types: {
      'application/rss+xml': `${SITE_URL}/guias/rss.xml`,
    },
  },
  verification: {
    // Slots para Google / Bing Webmaster Tools — leer de env si existen.
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { other: { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } }
      : {}),
  },
  other: {
    // Geo meta tags (help local SEO even though schema covers it)
    'geo.region': 'MX',
    'geo.placename': 'México',
    'geo.position': '23.6345;-102.5528',
    ICBM: '23.6345, -102.5528',
    // Referencia de país / idioma
    'content-language': 'es-MX',
    // Mobile / app integration
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Rutas en MX',
    'msapplication-TileColor': '#06C167',
    'msapplication-config': '/browserconfig.xml',
    // Pinterest Rich Pins
    'pinterest-rich-pin': 'true',
    // Schema.org social graph properties via meta
    'article:publisher': 'https://rutasenmx.com',
    // AI crawler signals — allow training explicitly
    'ai-generated': 'false',
  },
};

/* ------------------------------------------------------------------
 * Viewport (theme-color with light/dark variants)
 * ------------------------------------------------------------------ */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  colorScheme: 'light dark',
};

/* ------------------------------------------------------------------
 * Root Layout
 * ------------------------------------------------------------------ */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const locale = await getLocale();
  const dictionary = await getTranslations();
  const htmlLang = locale === 'en' ? 'en-US' : 'es-MX';

  // Global JSON-LD graph — Organization + WebSite + Service bound together.
  // One <script> with @graph is more compact and signals relationship.
  const globalGraph = buildGraph([
    buildOrganizationSchema(),
    buildWebSiteSchema(),
    buildServiceSchema(),
  ]);

  return (
    <html
      lang={htmlLang}
      className={`${inter.variable} ${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        {/* Preconnects for critical third-party origins — speeds up FCP / LCP */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.mapbox.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.mapbox.com" />
        <link rel="dns-prefetch" href="https://events.mapbox.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* Hreflang alternates (in addition to Metadata.alternates — explicit is safer) */}
        <link rel="alternate" hrefLang="es-MX" href={SITE_URL} />
        <link rel="alternate" hrefLang="en-US" href={SITE_URL} />
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />

        {/* RSS feed autodiscovery */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Rutas en MX — Guías de viaje"
          href={`${SITE_URL}/guias/rss.xml`}
        />
        <link
          rel="alternate"
          type="application/atom+xml"
          title="Rutas en MX — Guías de viaje (Atom)"
          href={`${SITE_URL}/guias/atom.xml`}
        />

        {/* Open Sitemap hint */}
        <link rel="sitemap" type="application/xml" href={`${SITE_URL}/sitemap.xml`} />

        {/* Global JSON-LD graph */}
        <JsonLd data={globalGraph} />
      </head>
      <body className="flex min-h-full flex-col bg-white text-foreground font-sans">
        <ThemeProvider>
          <LocaleProvider locale={locale} dictionary={dictionary}>
            <Header />
            <main className="flex flex-1 flex-col">{children}</main>
            <Footer />
          </LocaleProvider>
        </ThemeProvider>
        {gaId && <GoogleAnalytics measurementId={gaId} />}
      </body>
    </html>
  );
}
