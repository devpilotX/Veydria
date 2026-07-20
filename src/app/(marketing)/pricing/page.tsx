import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { JsonLd } from '@/components/marketing/json-ld';
import { PLANS, PLAN_ORDER, type PlanKey } from '@/config/plans';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Pricing',
  description:
    'Simple plans that grow with the number of AI systems you run. Start free, upgrade when you need more, and talk to sales when you outgrow the tiers.',
  path: '/pricing'
});

function planCta(key: PlanKey): { href: string; label: string } {
  if (key === 'enterprise') return { href: '/contact', label: 'Contact sales' };
  if (key === 'free') return { href: '/auth/sign-up', label: 'Start free' };
  return { href: '/auth/sign-up', label: 'Choose plan' };
}

const faqs = [
  {
    q: 'Can I switch plans later?',
    a: 'Yes. Move up or down whenever you like. Changes are prorated on your next invoice, so you only pay for what you use.'
  },
  {
    q: 'What counts as an AI system?',
    a: 'One model or agent that you connect and track. A support chatbot and a separate scoring model are two systems. You can group agents under one system when they serve the same purpose.'
  },
  {
    q: 'What happens if I pass my monitoring limit?',
    a: 'We tell you as you get close, and again when you reach it. Events are never dropped without warning, and you can upgrade at any point in the month.'
  },
  {
    q: 'Do you offer annual billing or discounts?',
    a: 'Annual billing saves two months against the monthly price. If you are an early stage startup or a nonprofit, write to sales and we will see what we can do.'
  },
  {
    q: 'Is there a trial for the paid plans?',
    a: 'The free plan runs the full loop on one system, so you can try everything before you pay. For a larger proof of concept, talk to sales.'
  }
];

export default function PricingPage() {
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
    <div className='mx-auto max-w-6xl px-4 py-16 sm:px-6'>
      <JsonLd data={faqPage} />

      <div className='mx-auto max-w-3xl text-center'>
        <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
          Simple pricing that grows with you
        </h1>
        <p className='text-muted-foreground mt-4 text-lg text-pretty'>
          Pay for the number of AI systems you track, not per seat games. Every plan includes risk
          classification and the audit log. Start free and move up when you add systems.
        </p>
      </div>

      <div className='mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
        {PLAN_ORDER.map((key) => {
          const plan = PLANS[key];
          const cta = planCta(key);
          const popular = key === 'growth';
          return (
            <div
              key={plan.key}
              className={`flex flex-col rounded-xl border p-6 ${
                popular ? 'border-foreground shadow-sm' : 'border-border'
              }`}
            >
              <div className='flex items-center justify-between'>
                <h2 className='text-lg font-medium'>{plan.name}</h2>
                {popular ? (
                  <span className='bg-foreground text-background rounded-full px-2 py-0.5 text-xs font-medium'>
                    Popular
                  </span>
                ) : null}
              </div>

              <div className='mt-4'>
                {plan.priceMonthly === null ? (
                  <span className='text-2xl font-semibold'>Talk to sales</span>
                ) : plan.priceMonthly === 0 ? (
                  <span className='text-3xl font-semibold'>Free</span>
                ) : (
                  <span>
                    <span className='text-3xl font-semibold'>${plan.priceMonthly}</span>
                    <span className='text-muted-foreground text-sm'>/mo</span>
                  </span>
                )}
              </div>

              <p className='text-muted-foreground mt-3 text-sm'>{plan.blurb}</p>

              <ul className='mt-5 flex-1 space-y-2 text-sm'>
                {plan.features.map((item) => (
                  <li key={item} className='flex items-start gap-2'>
                    <Icons.check className='text-foreground mt-0.5 h-4 w-4 shrink-0' />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className='mt-6'>
                <Button
                  className='w-full'
                  variant={popular ? 'default' : 'outline'}
                  render={<Link href={cta.href} />}
                >
                  {cta.label}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <p className='text-muted-foreground mt-6 text-center text-sm'>
        Prices are in US dollars and exclude tax. Enterprise plans can be billed by invoice.
      </p>

      <section className='mx-auto mt-20 max-w-3xl'>
        <h2 className='text-center text-2xl font-semibold sm:text-3xl'>Pricing questions</h2>
        <dl className='mt-8 space-y-6'>
          {faqs.map((faq) => (
            <div key={faq.q} className='border-border border-b pb-6'>
              <dt className='font-medium'>{faq.q}</dt>
              <dd className='text-muted-foreground mt-2 text-sm'>{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
