import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'ClickStudio — Free Y2K Photo Booth Online';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #fff0f5 0%, #ffe4f0 50%, #ffd6e8 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Decorative dots */}
        <div style={{ position: 'absolute', top: 40, left: 60, fontSize: 48, opacity: 0.4 }}>✨</div>
        <div style={{ position: 'absolute', top: 80, right: 80, fontSize: 36, opacity: 0.4 }}>⭐</div>
        <div style={{ position: 'absolute', bottom: 60, left: 100, fontSize: 40, opacity: 0.4 }}>💖</div>
        <div style={{ position: 'absolute', bottom: 40, right: 60, fontSize: 44, opacity: 0.4 }}>🌸</div>

        {/* Camera icon circle */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e91e8c, #ff6eb4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 40px rgba(233,30,140,0.35)',
            marginBottom: 28,
          }}
        >
          <span style={{ fontSize: 44 }}>📷</span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: '#1a1a2e',
            letterSpacing: '-2px',
            marginBottom: 16,
          }}
        >
          Click<span style={{ color: '#e91e8c' }}>Studio</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: '#555',
            fontWeight: 500,
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
            marginBottom: 36,
          }}
        >
          Free Y2K Photo Booth — No signup, no app, pure fun
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 16 }}>
          {['📸 Shoot Strips', '✨ Add Stickers', '🔗 Share Instantly'].map((label) => (
            <div
              key={label}
              style={{
                padding: '10px 22px',
                borderRadius: 999,
                background: 'rgba(233,30,140,0.1)',
                border: '2px solid rgba(233,30,140,0.25)',
                color: '#c2185b',
                fontWeight: 700,
                fontSize: 20,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
