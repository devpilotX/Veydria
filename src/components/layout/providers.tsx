'use client';
import { ClerkProvider } from '@clerk/nextjs';
import React from 'react';
import QueryProvider from './query-provider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: 'var(--primary)',
          colorPrimaryForeground: 'var(--primary-foreground)',
          colorDanger: 'var(--destructive)',
          colorBackground: 'var(--card)',
          colorForeground: 'var(--foreground)',
          colorMuted: 'var(--muted)',
          colorMutedForeground: 'var(--muted-foreground)',
          colorInput: 'var(--input)',
          colorInputForeground: 'var(--foreground)',
          colorBorder: 'var(--border)',
          colorRing: 'var(--ring)',
          fontFamily: 'var(--font-sans)'
        }
      }}
    >
      <QueryProvider>{children}</QueryProvider>
    </ClerkProvider>
  );
}
