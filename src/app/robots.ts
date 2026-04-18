import type { MetadataRoute } from 'next';

const SITE_URL = 'https://rutasenmx.com';

/**
 * Robots directives.
 *
 * — Allow all major search engines to index public content.
 * — Block private dashboard / admin / auth / api endpoints.
 * — Explicitly allow reputable AI crawlers (GPTBot, ClaudeBot, Google-Extended,
 *   PerplexityBot, etc.) so our editorial content is considered for training /
 *   retrieval. Owners who prefer to opt out can flip `allow` below.
 * — Block SEO-noisy scraping bots (AhrefsBot, SemrushBot, MJ12bot, DotBot).
 *   These don't add search traffic and can hammer the origin.
 */
export default function robots(): MetadataRoute.Robots {
  const privatePaths = [
    '/admin/',
    '/dashboard/',
    '/api/',
    '/iniciar-sesion',
    '/registrarse',
    '/recuperar-contrasena',
    '/mis-viajes',
    '/favoritos',
    '/perfil',
    '/suscripcion',
    '/checkout/',
    '/preview/',
    '/compartido/',
    '/*?token=',
    '/*?preview=',
  ];

  return {
    rules: [
      // Default: all user agents can crawl public content
      {
        userAgent: '*',
        allow: ['/'],
        disallow: privatePaths,
      },
      // Google (explicit, in case of future wildcards)
      {
        userAgent: 'Googlebot',
        allow: ['/'],
        disallow: privatePaths,
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/', '/images/', '/*.jpg$', '/*.png$', '/*.webp$', '/*.avif$'],
        disallow: privatePaths,
      },
      {
        userAgent: 'Googlebot-News',
        allow: ['/guias/', '/rutas/'],
        disallow: privatePaths,
      },
      // Bing
      {
        userAgent: 'Bingbot',
        allow: ['/'],
        disallow: privatePaths,
      },
      // DuckDuckGo
      {
        userAgent: 'DuckDuckBot',
        allow: ['/'],
        disallow: privatePaths,
      },
      // Yandex
      {
        userAgent: 'YandexBot',
        allow: ['/'],
        disallow: privatePaths,
      },
      // AI crawlers — allow content for retrieval / training
      {
        userAgent: 'GPTBot',
        allow: ['/'],
        disallow: privatePaths,
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/'],
        disallow: privatePaths,
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: ['/'],
        disallow: privatePaths,
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/'],
        disallow: privatePaths,
      },
      {
        userAgent: 'Claude-Web',
        allow: ['/'],
        disallow: privatePaths,
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/'],
        disallow: privatePaths,
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/'],
        disallow: privatePaths,
      },
      {
        userAgent: 'CCBot',
        allow: ['/'],
        disallow: privatePaths,
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/'],
        disallow: privatePaths,
      },
      // Social media previews — crucial for OG/Twitter cards to work
      {
        userAgent: 'Twitterbot',
        allow: ['/'],
      },
      {
        userAgent: 'facebookexternalhit',
        allow: ['/'],
      },
      {
        userAgent: 'LinkedInBot',
        allow: ['/'],
      },
      {
        userAgent: 'WhatsApp',
        allow: ['/'],
      },
      {
        userAgent: 'Applebot',
        allow: ['/'],
        disallow: privatePaths,
      },
      // Aggressive SEO scrapers — block to save bandwidth
      {
        userAgent: 'AhrefsBot',
        disallow: ['/'],
      },
      {
        userAgent: 'SemrushBot',
        disallow: ['/'],
      },
      {
        userAgent: 'MJ12bot',
        disallow: ['/'],
      },
      {
        userAgent: 'DotBot',
        disallow: ['/'],
      },
      {
        userAgent: 'PetalBot',
        disallow: ['/'],
      },
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
    ],
    host: SITE_URL,
  };
}
