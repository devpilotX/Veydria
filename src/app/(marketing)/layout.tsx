import { MarketingHeader } from '@/components/marketing/header';
import { MarketingFooter } from '@/components/marketing/footer';
import { JsonLd } from '@/components/marketing/json-ld';
import { brand } from '@/config/brand';
import { baseUrl } from '@/lib/seo';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand.legalName,
    url: baseUrl,
    description: brand.description
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: brand.name,
    url: baseUrl
  };

  return (
    <div className='flex min-h-screen flex-col'>
      <JsonLd data={organization} />
      <JsonLd data={website} />
      <MarketingHeader />
      <main className='flex-1'>{children}</main>
      <MarketingFooter />
    </div>
  );
}
