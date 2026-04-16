import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/dashboard',
        '/api',
        '/auth',
        '/checkout',
        '/mis-viajes',
        '/perfil',
        '/preview',
      ],
    },
    sitemap: 'https://rutasenmx.com/sitemap.xml',
  };
}
