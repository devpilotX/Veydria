import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { JsonLd } from '@/components/marketing/json-ld';
import { FEATURES } from '@/config/marketing';
import { buildMetadata, baseUrl } from '@/lib/seo';

export function generateStaticParams(): { slug: string }[] {
  return FEATURES.map((feature) => ({ slug: feature.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const feature = FEATURES.find((item) => item.slug === slug);
  if (!feature) {
    return buildMetadata({
      title: 'Feature not found',
      description: 'This feature does not exist.',
      path: `/features/${slug}`,
      noindex: true
    });
  }
  return buildMetadata({
    title: `${feature.name}: ${feature.tagline}`,
    description: feature.description,
    path: `/features/${slug}`
  });
}

export default async function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const feature = FEATURES.find((item) => item.slug === slug);
  if (!feature) notFound();

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Features', item: `${baseUrl}/features` },
      {
        '@type': 'ListItem',
        position: 3,
        name: feature.name,
        item: `${baseUrl}/features/${feature.slug}`
      }
    ]
  };

  return (
    <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6'>
      <JsonLd data={breadcrumb} />

      <nav aria-label='Breadcrumb' className='text-muted-foreground text-sm'>
        <ol className='flex flex-wrap items-center gap-2'>
          <li>
            <Link href='/' className='hover:text-foreground'>
              Home
            </Link>
          </li>
          <li aria-hidden='true'>/</li>
          <li>
            <Link href='/features' className='hover:text-foreground'>
              Features
            </Link>
          </li>
          <li aria-hidden='true'>/</li>
          <li className='text-foreground' aria-current='page'>
            {feature.name}
          </li>
        </ol>
      </nav>

      <h1 className='mt-6 text-3xl font-semibold tracking-tight sm:text-4xl'>{feature.name}</h1>
      <p className='text-foreground/80 mt-3 text-xl'>{feature.tagline}</p>
      <p className='text-muted-foreground mt-6 text-lg text-pretty'>{feature.description}</p>

      <ul className='mt-10 space-y-4'>
        {feature.points.map((point) => (
          <li key={point.title} className='border-border rounded-xl border p-6'>
            <div className='flex items-start gap-3'>
              <Icons.check className='text-foreground mt-0.5 h-5 w-5 shrink-0' />
              <div>
                <h2 className='font-medium'>{point.title}</h2>
                <p className='text-muted-foreground mt-1 text-sm'>{point.body}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className='mt-12 flex flex-wrap items-center gap-3'>
        <Button size='lg' render={<Link href='/auth/sign-up' />}>
          Start free
        </Button>
        <Button size='lg' variant='outline' render={<Link href='/features' />}>
          All features
        </Button>
      </div>
    </div>
  );
}
