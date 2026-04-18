import { ImageResponse } from 'next/og';
import { getPlaceBySlug } from '@/lib/data/mock';

export const alt = 'Lugar · Rutas en MX';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Dynamic Open Graph image for every place detail page. */
export default async function OgLugar({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = getPlaceBySlug(slug);
  const name = place?.name ?? 'Lugar en México';
  const category = place?.categoryName ?? '';
  const state = place?.stateName ?? '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%)',
          fontFamily: 'sans-serif',
          padding: '72px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: -150,
            right: -150,
            width: 480,
            height: 480,
            borderRadius: 480,
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            color: '#FFFFFF',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              background: 'rgba(255,255,255,0.18)',
              padding: '6px 14px',
              borderRadius: 999,
              display: 'flex',
            }}
          >
            📍 {category || 'Destino'}
          </span>
          <span style={{ opacity: 0.85 }}>Rutas en MX</span>
        </div>

        <div
          style={{
            marginTop: 'auto',
            color: '#FFFFFF',
            fontSize: name.length > 28 ? 68 : 88,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            display: 'flex',
            maxWidth: 1040,
          }}
        >
          {name}
        </div>

        <div
          style={{
            marginTop: 16,
            color: 'rgba(255,255,255,0.9)',
            fontSize: 28,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          {state && <span>{state}</span>}
          {state && <span style={{ opacity: 0.5 }}>·</span>}
          <span>rutasenmx.com</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
