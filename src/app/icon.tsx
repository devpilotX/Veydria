import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// Renders the AgentProof mark as the favicon so branding stays in one place.
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#09090b',
        color: '#ffffff',
        fontSize: 22,
        fontWeight: 700,
        borderRadius: 6
      }}
    >
      A
    </div>,
    size
  );
}
