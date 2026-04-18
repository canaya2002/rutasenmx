import { ImageResponse } from 'next/og';
import { getGuideBySlug } from '@/lib/data/guides';

export const alt = 'Guía de viaje · Rutas en MX';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Dynamic Open Graph image for every guide. Social platforms (Twitter,
 * WhatsApp, iMessage, LinkedIn, Slack) will render a branded preview card
 * for each of the 240+ guides — hugely beneficial for CTR on shares.
 */
export default async function OgGuide({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  const title = guide?.title ?? 'Guía de viaje por México';
  const author = guide?.author ?? 'Rutas en MX';
  const tag = guide?.tags?.[0] ?? 'Guía editorial';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%)',
          fontFamily: 'sans-serif',
          padding: '72px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 420,
            height: 420,
            borderRadius: 420,
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 260,
            height: 260,
            borderRadius: 260,
            background: 'rgba(0,0,0,0.12)',
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
            fontWeight: 600,
            letterSpacing: '0.04em',
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
            {tag.toUpperCase()}
          </span>
          <span style={{ opacity: 0.85 }}>Rutas en MX</span>
        </div>

        <div
          style={{
            marginTop: 'auto',
            color: '#FFFFFF',
            fontSize: title.length > 55 ? 56 : 68,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            display: 'flex',
            maxWidth: 1040,
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: 24,
            color: 'rgba(255,255,255,0.82)',
            fontSize: 24,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <span>Por {author}</span>
          <span style={{ opacity: 0.6 }}>·</span>
          <span>rutasenmx.com/guias</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
