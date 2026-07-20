import type { MetadataRoute } from 'next';
import { baseUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard/', '/api/', '/auth/'] }],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}
