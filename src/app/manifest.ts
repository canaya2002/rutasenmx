import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rutas en MX',
    short_name: 'RutasMX',
    description:
      'Planea rutas por Mexico, descubre Pueblos Magicos, museos, zonas arqueologicas y escapadas por carretera.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAF5',
    theme_color: '#C2410C',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
