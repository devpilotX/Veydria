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
        backgroundColor: '#09090b',
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
          <svg width='42' height='42' viewBox='0 0 24 24'>
            <path
              d='M12 3 L18.5 5.4 L18.5 11 C18.5 15.2 15.6 18.5 12 19.8 C8.4 18.5 5.5 15.2 5.5 11 L5.5 5.4 Z'
              fill='#09090b'
            />
            <path
              d='M9 11.6 L11.2 13.8 L15 9.4'
              fill='none'
              stroke='#ffffff'
              strokeWidth='2.2'
              strokeLinecap='round'
              strokeLinejoin='round'
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
