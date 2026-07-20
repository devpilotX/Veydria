import type { MetadataRoute } from 'next';
import { allPublicPaths } from '@/config/marketing';
import { baseUrl } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return allPublicPaths().map((path) => ({
    url: `${baseUrl}${path === '/' ? '' : path}`,
    lastModified,
    changeFrequency: path === '/blog' || path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path.startsWith('/features') || path === '/pricing' ? 0.8 : 0.6
  }));
}
