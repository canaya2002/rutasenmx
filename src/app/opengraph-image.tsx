import { ImageResponse } from 'next/og';

export const alt = 'Rutas en MX — Planea rutas por Mexico, Pueblos Magicos y escapadas';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #C2410C 0%, #EA580C 40%, #F59E0B 100%)',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        {/* Decorative top-left element */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '300px',
            height: '300px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '0 0 300px 0',
            display: 'flex',
          }}
        />

        {/* Decorative bottom-right element */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '250px',
            height: '250px',
            background: 'rgba(0,0,0,0.08)',
            borderRadius: '250px 0 0 0',
            display: 'flex',
          }}
        />

        {/* Logo / brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            🇲🇽
          </div>
          <span
            style={{
              color: '#FFFFFF',
              fontSize: '32px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            Rutas en MX
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            color: '#FFFFFF',
            fontSize: '64px',
            fontWeight: 800,
            textAlign: 'center',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            maxWidth: '900px',
            display: 'flex',
          }}
        >
          Descubre Mexico por carretera
        </div>

        {/* Tagline */}
        <div
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: '26px',
            fontWeight: 400,
            textAlign: 'center',
            marginTop: '20px',
            maxWidth: '750px',
            lineHeight: 1.4,
            display: 'flex',
          }}
        >
          Pueblos Magicos, museos, zonas arqueologicas, rutas y mas
        </div>

        {/* Domain */}
        <div
          style={{
            position: 'absolute',
            bottom: '36px',
            color: 'rgba(255,255,255,0.65)',
            fontSize: '20px',
            fontWeight: 500,
            display: 'flex',
          }}
        >
          rutasenmx.com
        </div>
      </div>
    ),
    { ...size },
  );
}
