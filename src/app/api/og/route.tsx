import { ImageResponse } from 'next/og';
import { type NextRequest } from 'next/server';

export const runtime = 'edge';

const BRAND_COLORS = {
  terracotta: '#C4532B',
  terracottaDark: '#8B3A1E',
  jade: '#0D9488',
  jadeDark: '#065F53',
  cream: '#FAFAF5',
  slate: '#1E293B',
} as const;

type OgType = 'home' | 'estado' | 'lugar' | 'ruta' | 'guia' | 'coleccion';

function getGradient(type: OgType): string {
  switch (type) {
    case 'home':
      return `linear-gradient(135deg, ${BRAND_COLORS.terracotta} 0%, ${BRAND_COLORS.jade} 100%)`;
    case 'estado':
      return `linear-gradient(135deg, ${BRAND_COLORS.jade} 0%, ${BRAND_COLORS.jadeDark} 100%)`;
    case 'lugar':
      return `linear-gradient(135deg, ${BRAND_COLORS.terracotta} 0%, ${BRAND_COLORS.terracottaDark} 100%)`;
    case 'ruta':
      return `linear-gradient(135deg, ${BRAND_COLORS.terracottaDark} 0%, ${BRAND_COLORS.jade} 100%)`;
    case 'guia':
      return `linear-gradient(135deg, ${BRAND_COLORS.slate} 0%, ${BRAND_COLORS.jade} 100%)`;
    case 'coleccion':
      return `linear-gradient(135deg, ${BRAND_COLORS.jade} 0%, ${BRAND_COLORS.terracotta} 100%)`;
    default:
      return `linear-gradient(135deg, ${BRAND_COLORS.terracotta} 0%, ${BRAND_COLORS.jade} 100%)`;
  }
}

function getIcon(type: OgType): string {
  switch (type) {
    case 'home':
      return '\u{1F1F2}\u{1F1FD}';
    case 'estado':
      return '\u{1F4CD}';
    case 'lugar':
      return '\u{2B50}';
    case 'ruta':
      return '\u{1F697}';
    case 'guia':
      return '\u{1F4D6}';
    case 'coleccion':
      return '\u{1F4DA}';
    default:
      return '\u{1F30E}';
  }
}

function getTypeLabel(type: OgType): string {
  switch (type) {
    case 'home':
      return '';
    case 'estado':
      return 'Estado';
    case 'lugar':
      return 'Destino';
    case 'ruta':
      return 'Ruta';
    case 'guia':
      return 'Guia de viaje';
    case 'coleccion':
      return 'Coleccion';
    default:
      return '';
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const type = (searchParams.get('type') as OgType) || 'home';
  const title = searchParams.get('title') || 'Rutas en MX';
  const subtitle = searchParams.get('subtitle') || '';
  const state = searchParams.get('state') || '';
  const category = searchParams.get('category') || '';

  const typeLabel = getTypeLabel(type);
  const icon = getIcon(type);
  const gradient = getGradient(type);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 80px',
          background: gradient,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top section: type badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {typeLabel && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '9999px',
                padding: '8px 24px',
              }}
            >
              {icon && (
                <span style={{ fontSize: '20px' }}>{icon}</span>
              )}
              <span
                style={{
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {typeLabel}
              </span>
            </div>
          )}
          {category && (
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '9999px',
                padding: '8px 20px',
              }}
            >
              <span
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '18px',
                  fontWeight: 500,
                }}
              >
                {category}
              </span>
            </div>
          )}
        </div>

        {/* Middle section: title and subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h1
            style={{
              color: 'white',
              fontSize: title.length > 40 ? '48px' : '64px',
              fontWeight: 800,
              lineHeight: 1.1,
              margin: 0,
              maxWidth: '900px',
              textShadow: '0 2px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            {title}
          </h1>
          {(subtitle || state) && (
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                fontSize: '28px',
                fontWeight: 500,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              {subtitle}
              {subtitle && state && (
                <span style={{ opacity: 0.5 }}>|</span>
              )}
              {state}
            </p>
          )}
        </div>

        {/* Bottom section: brand watermark */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 800,
                color: 'white',
              }}
            >
              R
            </div>
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '22px',
                fontWeight: 600,
              }}
            >
              rutasenmx.com
            </span>
          </div>
          <span
            style={{
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '16px',
            }}
          >
            Planea tu viaje por Mexico
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      },
    },
  );
}
