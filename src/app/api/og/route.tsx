import { ImageResponse } from 'next/og';
import { brand } from '@/config/brand';

export const runtime = 'edge';

// Generates a branded Open Graph card. Pages pass ?title= to customise it.
export async function GET(request: Request): Promise<ImageResponse> {
  const { searchParams } = new URL(request.url);
  const rawTitle = searchParams.get('title');
  const title = (rawTitle && rawTitle.trim().length > 0 ? rawTitle : brand.tagline).slice(0, 120);

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#111C4E',
        padding: '80px',
        fontFamily: 'sans-serif'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#ffffff'
          }}
        >
          <svg width='46' height='46' viewBox='0 0 64 64'>
            <path fill='#111C4E' d='M7 8h13.25L32 36.4 25.12 54 7 8Z' />
            <path fill='#2457E6' d='M43.75 8H57L38.88 54 32 36.4 43.75 8Z' />
            <rect
              x='27.1'
              y='31.5'
              width='9.8'
              height='9.8'
              rx='2.2'
              transform='rotate(45 32 36.4)'
              fill='#F4A62A'
            />
          </svg>
        </div>
        <div style={{ color: '#ffffff', fontSize: '36px', fontWeight: 600 }}>{brand.name}</div>
      </div>
      <div
        style={{
          display: 'flex',
          color: '#fafafa',
          fontSize: '68px',
          fontWeight: 700,
          lineHeight: 1.1,
          maxWidth: '900px'
        }}
      >
        {title}
      </div>
      <div style={{ color: '#a1a1aa', fontSize: '28px' }}>
        EU AI Act, NIST AI RMF, and ISO 42001 compliance for AI agents
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
