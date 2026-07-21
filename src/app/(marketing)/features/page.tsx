import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { FEATURES } from '@/config/marketing';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Features',
  description:
    'Discover, classify, evaluate, monitor, and prove. The five jobs Veydria does to keep your AI agents compliant with the EU AI Act, NIST AI RMF, and ISO 42001.',
  path: '/features'
});

const featureIcons = ['search', 'scale', 'gauge', 'activity', 'shield'] as const;

export default function FeaturesPage() {
  return (
    <div className='mx-auto max-w-6xl px-4 py-16 sm:px-6'>
      <div className='max-w-3xl'>
        <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
          Everything you need to stay compliant
        </h1>
        <p className='text-muted-foreground mt-4 text-lg text-pretty'>
          Compliance for AI is not one task, it is five. Each one only pays off when it feeds the
          next. Veydria runs the whole loop in one place, so the evidence you hand an auditor is
          built from what your agents actually did.
        </p>
      </div>

      <div className='mt-12 grid gap-4 md:grid-cols-2'>
        {FEATURES.map((feature, index) => {
          const Icon = Icons[featureIcons[index] ?? 'shield'];
          return (
            <Link
              key={feature.slug}
              href={`/features/${feature.slug}`}
              className='border-border hover:border-foreground/20 hover:bg-muted/40 group rounded-xl border p-6 transition-colors'
            >
              <Icon className='text-foreground h-6 w-6' />
              <h2 className='mt-4 text-xl font-medium'>{feature.name}</h2>
              <p className='text-foreground/80 mt-1 text-sm font-medium'>{feature.tagline}.</p>
              <p className='text-muted-foreground mt-3 text-sm'>{feature.description}</p>
              <span className='text-foreground mt-4 inline-flex items-center gap-1 text-sm font-medium'>
                Learn more
                <Icons.arrowRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5' />
              </span>
            </Link>
          );
        })}
      </div>

      <div className='border-border mt-16 rounded-2xl border p-8 text-center sm:p-12'>
        <h2 className='text-2xl font-semibold'>Start with one system</h2>
        <p className='text-muted-foreground mx-auto mt-3 max-w-xl'>
          Connect a single agent, read its risk tier and obligations, then decide where to go next.
          The free plan is enough to run the full loop once.
        </p>
        <div className='mt-6 flex flex-wrap justify-center gap-3'>
          <Button size='lg' render={<Link href='/auth/sign-up' />}>
            Start free
          </Button>
          <Button size='lg' variant='outline' render={<Link href='/pricing' />}>
            See pricing
          </Button>
        </div>
      </div>
    </div>
  );
}
