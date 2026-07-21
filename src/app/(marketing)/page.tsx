import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { JsonLd } from '@/components/marketing/json-ld';
import { Reveal } from '@/components/marketing/reveal';
import {
  AuditScreenMock,
  BrowserFrame,
  ClassifyMock,
  DiscoverMock,
  EvaluateMock,
  MonitorMock,
  ProveMock
} from '@/components/marketing/product-visual';
import { brand } from '@/config/brand';
import { FEATURES } from '@/config/marketing';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: `${brand.name}: ${brand.tagline}`,
  description: brand.description,
  path: '/'
});

const featureVisuals: Record<string, { icon: keyof typeof Icons; Mock: () => React.ReactElement }> =
  {
    discover: { icon: 'search', Mock: DiscoverMock },
    classify: { icon: 'scale', Mock: ClassifyMock },
    evaluate: { icon: 'gauge', Mock: EvaluateMock },
    monitor: { icon: 'activity', Mock: MonitorMock },
    prove: { icon: 'shield', Mock: ProveMock }
  };

const frameworks = ['EU AI Act', 'NIST AI RMF', 'ISO 42001', 'SOC 2'];

const steps = [
  {
    title: 'Connect your systems',
    body: 'Register your AI systems and stream agent activity through an API key, the TypeScript SDK, or the MCP server.'
  },
  {
    title: 'See your obligations',
    body: 'Veydria classifies each system to its EU AI Act tier and lists the exact duties that follow, linked to the source clause.'
  },
  {
    title: 'Prove it to auditors',
    body: 'Generate risk assessments, Annex IV files, and audit reports from live data, backed by a verifiable audit trail.'
  }
];

const faqs = [
  {
    q: 'Which regulations does Veydria cover?',
    a: 'The EU AI Act, the NIST AI Risk Management Framework, and ISO 42001. The knowledge base maps each one to concrete obligations for your systems.'
  },
  {
    q: 'How do our agents connect?',
    a: 'Through an organization API key, our TypeScript SDK, or an MCP server. Most teams send their first events within an afternoon.'
  },
  {
    q: 'Is the audit trail tamper evident?',
    a: 'Yes. Every entry is hash chained to the one before it, so any change to a past record breaks the chain, which the verify endpoint detects.'
  },
  {
    q: 'Do we need a separate vector database?',
    a: 'No. Embeddings and search over regulation text live inside your Postgres database, so there is one less system to run and secure.'
  },
  {
    q: 'How is our data protected?',
    a: 'Data is encrypted in transit, isolated per organization, and gated by role based access control. Secrets stay in environment variables and are never committed.'
  },
  {
    q: 'Does Veydria replace our compliance team?',
    a: 'No. It does the heavy lifting of discovery, classification, testing, and documentation so your team spends its time on judgement, not paperwork.'
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

      {/* Hero */}
      <section className='relative overflow-hidden'>
        <div className='pointer-events-none absolute inset-0 -z-10'>
          <div className='bg-primary/15 absolute top-[-10%] left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full blur-3xl' />
          <div className='absolute top-[20%] right-[10%] h-[240px] w-[240px] rounded-full bg-[#F4A62A]/10 blur-3xl' />
        </div>
        <div className='mx-auto max-w-6xl px-4 pt-20 pb-12 sm:px-6 sm:pt-28'>
          <div className='mx-auto max-w-3xl text-center'>
            <p className='text-muted-foreground mb-4 text-sm font-medium'>
              AI governance for the EU AI Act, NIST AI RMF, and ISO 42001
            </p>
            <h1 className='text-4xl font-semibold tracking-tight text-balance sm:text-6xl'>
              Prove your AI agents are compliant
            </h1>
            <p className='text-muted-foreground mx-auto mt-6 max-w-2xl text-lg text-pretty'>
              Veydria helps your team govern, test, and document AI agents against the rules that
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

          <Reveal className='mx-auto mt-14 max-w-5xl' delay={100}>
            <BrowserFrame>
              <AuditScreenMock />
            </BrowserFrame>
          </Reveal>
        </div>
      </section>

      {/* Trust bar */}
      <section className='border-border/60 border-y'>
        <div className='mx-auto max-w-6xl px-4 py-8 sm:px-6'>
          <p className='text-muted-foreground text-center text-xs font-medium tracking-wide uppercase'>
            Built to map the frameworks your auditors use
          </p>
          <div className='mt-5 flex flex-wrap items-center justify-center gap-3'>
            {frameworks.map((name) => (
              <span
                key={name}
                className='border-border bg-card text-foreground/80 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium'
              >
                <Icons.badgeCheck className='text-primary size-4' />
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Feature sections */}
      <div className='mx-auto max-w-6xl space-y-24 px-4 py-24 sm:px-6'>
        {FEATURES.map((feature, index) => {
          const visual = featureVisuals[feature.slug];
          const Icon = Icons[visual.icon];
          const Mock = visual.Mock;
          const reversed = index % 2 === 1;
          return (
            <Reveal key={feature.slug}>
              <div className='grid items-center gap-10 md:grid-cols-2'>
                <div className={reversed ? 'md:order-2' : ''}>
                  <div className='bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium'>
                    <Icon className='size-4' />
                    {feature.name}
                  </div>
                  <h2 className='mt-4 text-2xl font-semibold tracking-tight sm:text-3xl'>
                    {feature.tagline}
                  </h2>
                  <p className='text-muted-foreground mt-3'>{feature.description}</p>
                  <ul className='mt-6 space-y-3'>
                    {feature.points.map((point) => (
                      <li key={point.title} className='flex items-start gap-3'>
                        <Icons.check className='text-primary mt-0.5 size-5 shrink-0' />
                        <span className='text-sm'>
                          <span className='font-medium'>{point.title}.</span>{' '}
                          <span className='text-muted-foreground'>{point.body}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={reversed ? 'md:order-1' : ''}>
                  <div className='relative'>
                    <div className='bg-primary/10 pointer-events-none absolute -inset-4 -z-10 rounded-3xl blur-2xl' />
                    <div className='border-border bg-card overflow-hidden rounded-xl border shadow-lg'>
                      <Mock />
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      {/* How it works */}
      <section className='border-border/60 border-y'>
        <div className='mx-auto max-w-6xl px-4 py-20 sm:px-6'>
          <Reveal>
            <div className='mx-auto max-w-2xl text-center'>
              <h2 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
                From connected to audit ready
              </h2>
              <p className='text-muted-foreground mt-3'>
                Three steps, and the paperwork keeps itself current.
              </p>
            </div>
          </Reveal>
          <div className='mt-12 grid gap-8 md:grid-cols-3'>
            {steps.map((step, index) => (
              <Reveal key={step.title} delay={index * 100}>
                <div>
                  <div className='bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-full text-sm font-semibold'>
                    {index + 1}
                  </div>
                  <h3 className='mt-4 font-medium'>{step.title}</h3>
                  <p className='text-muted-foreground mt-1 text-sm'>{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className='bg-[#111C4E] text-white'>
        <div className='mx-auto max-w-6xl px-4 py-20 sm:px-6'>
          <Reveal>
            <div className='grid items-center gap-10 md:grid-cols-2'>
              <div>
                <h2 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
                  The cost of getting AI compliance wrong is real
                </h2>
                <p className='mt-4 text-white/70'>
                  The EU AI Act is in force, with obligations phasing in through 2026 and 2027. The
                  penalties are not a footnote, and the paperwork is not optional for high risk
                  systems.
                </p>
                <div className='mt-6'>
                  <Button size='lg' variant='secondary' render={<Link href='/features/classify' />}>
                    Check your risk tier
                  </Button>
                </div>
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='rounded-xl border border-white/10 bg-white/5 p-5'>
                  <div className='text-3xl font-semibold text-[#F4A62A]'>35M euro</div>
                  <p className='mt-1 text-sm text-white/70'>
                    or 7 percent of worldwide annual turnover, whichever is higher, for the most
                    serious EU AI Act breaches.
                  </p>
                </div>
                <div className='rounded-xl border border-white/10 bg-white/5 p-5'>
                  <div className='text-3xl font-semibold'>Annex III</div>
                  <p className='mt-1 text-sm text-white/70'>
                    Uses like hiring and credit scoring are high risk and carry the full set of
                    obligations.
                  </p>
                </div>
                <div className='rounded-xl border border-white/10 bg-white/5 p-5'>
                  <div className='text-3xl font-semibold'>ISO 42001</div>
                  <p className='mt-1 text-sm text-white/70'>
                    The first international management system standard for AI, published in 2023.
                  </p>
                </div>
                <div className='rounded-xl border border-white/10 bg-white/5 p-5'>
                  <div className='text-3xl font-semibold'>NIST AI RMF</div>
                  <p className='mt-1 text-sm text-white/70'>
                    The US baseline many teams adopt to show a documented, repeatable process.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Security */}
      <section className='mx-auto max-w-6xl px-4 py-20 sm:px-6'>
        <Reveal>
          <div className='mx-auto max-w-2xl text-center'>
            <h2 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
              Compliance software you can trust with your data
            </h2>
            <p className='text-muted-foreground mt-3'>
              Veydria holds sensitive records, so it is built to protect them.
            </p>
          </div>
        </Reveal>
        <div className='mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          {[
            {
              icon: 'lock' as const,
              title: 'Encrypted in transit',
              body: 'All traffic runs over TLS, and secrets live in environment variables, never in the code.'
            },
            {
              icon: 'teams' as const,
              title: 'Access control',
              body: 'Owner, Admin, Member, and Viewer roles, backed by your organization in Clerk.'
            },
            {
              icon: 'fingerprint' as const,
              title: 'Tamper evident log',
              body: 'An append only, hash chained audit trail records every action and can be verified on demand.'
            },
            {
              icon: 'shield' as const,
              title: 'Tenant isolation',
              body: 'Every record is scoped to your organization, so one workspace never sees another.'
            }
          ].map((item) => {
            const Icon = Icons[item.icon];
            return (
              <Reveal key={item.title}>
                <div className='border-border bg-card h-full rounded-xl border p-6'>
                  <Icon className='text-primary size-6' />
                  <h3 className='mt-4 font-medium'>{item.title}</h3>
                  <p className='text-muted-foreground mt-1 text-sm'>{item.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
        <div className='mt-8 text-center'>
          <Link href='/security' className='text-primary text-sm font-medium hover:underline'>
            Read about our security practices
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className='border-border/60 border-t'>
        <div className='mx-auto max-w-3xl px-4 py-20 sm:px-6'>
          <h2 className='text-center text-2xl font-semibold tracking-tight sm:text-3xl'>
            Questions compliance teams ask
          </h2>
          <dl className='mt-10 space-y-6'>
            {faqs.map((faq) => (
              <div key={faq.q} className='border-border border-b pb-6'>
                <dt className='font-medium'>{faq.q}</dt>
                <dd className='text-muted-foreground mt-2 text-sm'>{faq.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Final CTA */}
      <section className='mx-auto max-w-6xl px-4 pt-8 pb-24 sm:px-6'>
        <div className='relative overflow-hidden rounded-2xl bg-[#111C4E] px-8 py-16 text-center'>
          <div className='pointer-events-none absolute inset-0 -z-0'>
            <div className='bg-primary/25 absolute top-[-40%] left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full blur-3xl' />
          </div>
          <div className='relative'>
            <h2 className='text-2xl font-semibold text-white sm:text-3xl'>
              Get ahead of your next audit
            </h2>
            <p className='mx-auto mt-3 max-w-xl text-white/70'>
              Start free, connect one system, and see your obligations in minutes.
            </p>
            <div className='mt-6'>
              <Button size='lg' variant='secondary' render={<Link href='/auth/sign-up' />}>
                Start free
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
