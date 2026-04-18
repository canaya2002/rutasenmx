import { ImageResponse } from 'next/og';
import { getStateBySlug } from '@/lib/data/mock';

export const alt = 'Estado · Rutas en MX';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Dynamic Open Graph image for each of the 32 Mexican state hub pages. */
export default async function OgEstado({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  const name = state?.name ?? 'México';
  const capital = state?.capital ?? '';
  const places = state?.placeCount ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #f59e0b 100%)',
          fontFamily: 'sans-serif',
          padding: '72px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -100,
            left: -100,
            width: 360,
            height: 360,
            borderRadius: 360,
            background: 'rgba(255,255,255,0.09)',
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
            🇲🇽 Estado
          </span>
          <span style={{ opacity: 0.85 }}>Rutas en MX</span>
        </div>

        <div
          style={{
            marginTop: 'auto',
            color: '#FFFFFF',
            fontSize: name.length > 16 ? 86 : 110,
            fontWeight: 800,
            lineHeight: 1.02,
            letterSpacing: '-0.04em',
            display: 'flex',
          }}
        >
          {name}
        </div>

        <div
          style={{
            marginTop: 14,
            color: 'rgba(255,255,255,0.88)',
            fontSize: 26,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          {capital && <span>Capital: {capital}</span>}
          {capital && <span style={{ opacity: 0.5 }}>·</span>}
          <span>{places} lugares</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>rutasenmx.com</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
