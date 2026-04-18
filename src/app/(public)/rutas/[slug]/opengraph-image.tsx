import { ImageResponse } from 'next/og';
import { getAnyRouteBySlug } from '@/lib/data/routes';

export const alt = 'Ruta por carretera · Rutas en MX';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Dynamic Open Graph image for every route. Each of the ~112 road-trip
 * routes gets a branded social card with title, origin→destination,
 * duration and distance.
 */
export default async function OgRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const route = getAnyRouteBySlug(slug);
  const title = route?.name ?? 'Ruta por carretera en México';
  const leg = route ? `${route.origin} → ${route.destination}` : 'México';
  const stats = route
    ? `${route.durationDays} días · ${route.distanceKm} km · ${route.stops.length} paradas`
    : 'Itinerario curado';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #0f766e 100%)',
          fontFamily: 'sans-serif',
          padding: '72px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '45%',
            height: '100%',
            background:
              'radial-gradient(circle at 80% 20%, rgba(6,193,103,0.35) 0%, transparent 60%)',
            display: 'flex',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            color: '#06C167',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ display: 'flex' }}>🛣️ Ruta</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '0.04em' }}>
            · Rutas en MX
          </span>
        </div>

        <div
          style={{
            marginTop: 'auto',
            color: '#FFFFFF',
            fontSize: title.length > 45 ? 58 : 68,
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            display: 'flex',
            maxWidth: 1040,
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: 18,
            color: 'rgba(255,255,255,0.9)',
            fontSize: 30,
            fontWeight: 600,
            display: 'flex',
          }}
        >
          {leg}
        </div>

        <div
          style={{
            marginTop: 10,
            color: 'rgba(255,255,255,0.72)',
            fontSize: 22,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <span>{stats}</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>rutasenmx.com/rutas</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
