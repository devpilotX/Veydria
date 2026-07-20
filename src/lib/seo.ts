import type { Metadata } from 'next';
import { brand } from '@/config/brand';

const baseUrl = brand.url.replace(/\/$/, '');

type SeoInput = {
  title: string;
  description: string;
  /** Path starting with a slash, for example /pricing. Omit for the home page. */
  path?: string;
  /** Optional override for the generated Open Graph image. */
  ogImage?: string;
  /** Set true on legal and utility pages we do not want indexed heavily. */
  noindex?: boolean;
  /** article for blog posts, website for everything else. */
  type?: 'website' | 'article';
  publishedTime?: string;
  authors?: string[];
};

/**
 * Builds a complete Metadata object so every public page ships a unique
 * title, description, canonical URL, and social cards from one place.
 */
export function buildMetadata(input: SeoInput): Metadata {
  const path = input.path ?? '/';
  const canonical = `${baseUrl}${path === '/' ? '' : path}`;
  const ogImage = input.ogImage ?? `${baseUrl}/api/og?title=${encodeURIComponent(input.title)}`;

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    robots: input.noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: brand.name,
      type: input.type ?? 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: input.title }],
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.authors ? { authors: input.authors } : {})
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      site: brand.social.twitter,
      images: [ogImage]
    }
  };
}

export { baseUrl };
