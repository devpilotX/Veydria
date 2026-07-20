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
            backgroundColor: '#ffffff',
            color: '#09090b',
            fontSize: '40px',
            fontWeight: 700
          }}
        >
          A
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
