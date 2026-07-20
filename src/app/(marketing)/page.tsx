import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { JsonLd } from '@/components/marketing/json-ld';
import { brand } from '@/config/brand';
import { FEATURES } from '@/config/marketing';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: `${brand.name}: ${brand.tagline}`,
  description: brand.description,
  path: '/'
});

const featureIcons = ['search', 'scale', 'gauge', 'activity', 'shield'] as const;

const faqs = [
  {
    q: 'Which regulations does AgentProof cover?',
    a: 'The EU AI Act, the NIST AI Risk Management Framework, and ISO 42001. The knowledge base maps each one to concrete obligations.'
  },
  {
    q: 'How do agents connect?',
    a: 'Through an API key, our TypeScript SDK, or an MCP server. Most teams are sending their first events within an afternoon.'
  },
  {
    q: 'Do I need a vector database?',
    a: 'No. Embeddings and search live inside your Postgres database, so there is one less system to run and secure.'
  },
  {
    q: 'Is the audit trail tamper evident?',
    a: 'Yes. Each entry is hash chained to the one before it, so any change to a past record is easy to detect and hard to hide.'
  }
];

export default function HomePage() {
  const softwareApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: brand.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: brand.description,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
  };
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a }
    }))
  };

  return (
    <>
      <JsonLd data={softwareApp} />
      <JsonLd data={faqPage} />

      <section className='mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28'>
        <div className='mx-auto max-w-3xl text-center'>
          <p className='text-muted-foreground mb-4 text-sm font-medium'>
            EU AI Act, NIST AI RMF, and ISO 42001
          </p>
          <h1 className='text-4xl font-semibold tracking-tight text-balance sm:text-6xl'>
            Prove your AI agents are compliant
          </h1>
          <p className='text-muted-foreground mx-auto mt-6 max-w-2xl text-lg text-pretty'>
            AgentProof helps your team govern, test, and document AI agents against the rules that
            matter. Connect your systems, get the exact obligations, catch problems in production,
            and hand auditors evidence they can trust.
          </p>
          <div className='mt-8 flex items-center justify-center gap-3'>
            <Button size='lg' render={<Link href='/auth/sign-up' />}>
              Start free
            </Button>
            <Button size='lg' variant='outline' render={<Link href='/features' />}>
              See how it works
            </Button>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-4 pb-20 sm:px-6'>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {FEATURES.map((feature, index) => {
            const Icon = Icons[featureIcons[index] ?? 'shield'];
            return (
              <Link
                key={feature.slug}
                href={`/features/${feature.slug}`}
                className='border-border hover:border-foreground/20 hover:bg-muted/40 group rounded-xl border p-6 transition-colors'
              >
                <Icon className='text-foreground h-6 w-6' />
                <h2 className='mt-4 text-lg font-medium'>{feature.name}</h2>
                <p className='text-muted-foreground mt-1 text-sm'>{feature.tagline}.</p>
                <span className='text-foreground mt-4 inline-flex items-center gap-1 text-sm font-medium'>
                  Learn more
                  <Icons.arrowRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5' />
                </span>
              </Link>
            );
          })}
          <div className='border-border bg-muted/40 rounded-xl border p-6'>
            <h2 className='text-lg font-medium'>One workflow, five jobs</h2>
            <p className='text-muted-foreground mt-1 text-sm'>
              Discover, classify, evaluate, monitor, and prove. Each step feeds the next, so your
              evidence stays current without extra work.
            </p>
          </div>
        </div>
      </section>

      <section className='border-border/60 border-y'>
        <div className='mx-auto max-w-6xl px-4 py-16 sm:px-6'>
          <div className='mx-auto max-w-2xl text-center'>
            <h2 className='text-2xl font-semibold sm:text-3xl'>Built for the way you ship AI</h2>
            <p className='text-muted-foreground mt-3'>
              Point your agents at AgentProof and the paperwork keeps itself up to date.
            </p>
          </div>
          <div className='mt-10 grid gap-8 sm:grid-cols-3'>
            <div>
              <h3 className='font-medium'>Connect in an afternoon</h3>
              <p className='text-muted-foreground mt-1 text-sm'>
                An API key and a few lines of the SDK, or the MCP server if your agent speaks it.
              </p>
            </div>
            <div>
              <h3 className='font-medium'>Vectors stay in Postgres</h3>
              <p className='text-muted-foreground mt-1 text-sm'>
                No separate vector store to run. Search over regulation text lives in your database.
              </p>
            </div>
            <div>
              <h3 className='font-medium'>Evidence you can hand over</h3>
              <p className='text-muted-foreground mt-1 text-sm'>
                Risk assessments, Annex IV files, and a verifiable audit trail, ready when asked.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-3xl px-4 py-16 sm:px-6'>
        <h2 className='text-center text-2xl font-semibold sm:text-3xl'>Common questions</h2>
        <dl className='mt-8 space-y-6'>
          {faqs.map((faq) => (
            <div key={faq.q} className='border-border border-b pb-6'>
              <dt className='font-medium'>{faq.q}</dt>
              <dd className='text-muted-foreground mt-2 text-sm'>{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className='mx-auto max-w-6xl px-4 pb-24 sm:px-6'>
        <div className='bg-foreground text-background rounded-2xl px-8 py-14 text-center'>
          <h2 className='text-2xl font-semibold sm:text-3xl'>Get ahead of your next audit</h2>
          <p className='mx-auto mt-3 max-w-xl opacity-80'>
            Start free, connect one system, and see your obligations in minutes.
          </p>
          <div className='mt-6'>
            <Button size='lg' variant='secondary' render={<Link href='/auth/sign-up' />}>
              Start free
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
