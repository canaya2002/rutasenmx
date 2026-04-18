import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rutas en MX — Planea rutas por México',
    short_name: 'RutasMX',
    description:
      'Planea rutas por México, descubre Pueblos Mágicos, museos, zonas arqueológicas y escapadas por carretera.',
    start_url: '/?utm_source=pwa',
    scope: '/',
    id: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAFAF5',
    theme_color: '#C2410C',
    lang: 'es-MX',
    dir: 'ltr',
    categories: ['travel', 'navigation', 'lifestyle', 'maps'],
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
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Explorar el mapa',
        short_name: 'Explorar',
        description: 'Abre el mapa interactivo de México',
        url: '/explorar?utm_source=pwa_shortcut',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Planear una ruta',
        short_name: 'Planear',
        description: 'Abre el planificador de rutas',
        url: '/planear?utm_source=pwa_shortcut',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Autopilot con IA',
        short_name: 'Autopilot',
        description: 'Generar itinerario con IA',
        url: '/autopilot?utm_source=pwa_shortcut',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Guías de viaje',
        short_name: 'Guías',
        description: '200+ guías editoriales',
        url: '/guias?utm_source=pwa_shortcut',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
    prefer_related_applications: false,
  };
}
