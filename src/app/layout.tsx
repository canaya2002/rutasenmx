import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { LocaleProvider } from '@/components/providers/LocaleProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GoogleAnalytics } from '@/components/seo/GoogleAnalytics';
import { getLocale, getTranslations } from '@/lib/i18n/server';
import './globals.css';

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
 * Metadata
 * ------------------------------------------------------------------ */
export const metadata: Metadata = {
  metadataBase: new URL('https://rutasenmx.com'),
  title: {
    default: 'Rutas en MX — Planea rutas por México, Pueblos Mágicos y escapadas',
    template: '%s | Rutas en MX',
  },
  description:
    'Planea rutas por México, descubre Pueblos Mágicos, museos, zonas arqueológicas y escapadas por carretera con mapas, ideas de viaje e itinerarios.',
  applicationName: 'Rutas en MX',
  authors: [{ name: 'Rutas en MX', url: 'https://rutasenmx.com' }],
  creator: 'Rutas en MX',
  publisher: 'Rutas en MX',
  keywords: [
    'rutas México',
    'road trip México',
    'Pueblos Mágicos',
    'viaje por carretera',
    'zonas arqueológicas',
    'museos México',
    'itinerarios México',
    'escapadas fin de semana',
  ],
  category: 'travel',
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: 'https://rutasenmx.com',
    siteName: 'Rutas en MX',
    title: 'Rutas en MX — Planea rutas por México, Pueblos Mágicos y escapadas',
    description:
      'Planea rutas por México, descubre Pueblos Mágicos, museos, zonas arqueológicas y escapadas por carretera.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rutas en MX — Planea rutas por México, Pueblos Mágicos y escapadas',
    description:
      'Planea rutas por México, descubre Pueblos Mágicos, museos, zonas arqueológicas y escapadas por carretera.',
    creator: '@rutasenmx',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

/* ------------------------------------------------------------------
 * Viewport
 * ------------------------------------------------------------------ */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ffffff',
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

  return (
    <html
      lang={locale === 'en' ? 'en' : 'es'}
      className={`${inter.variable} ${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
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
