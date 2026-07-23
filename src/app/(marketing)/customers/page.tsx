import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Early design partners',
  description:
    'Veydria is early and looking for a small number of design partners who govern real AI systems against the EU AI Act, NIST AI RMF, and ISO 42001.',
  path: '/customers'
});

const benefits = [
  {
    title: 'A direct line to the team',
    body: 'You talk to the people building the product, and your feedback shapes what we build next.'
  },
  {
    title: 'Help mapping your obligations',
    body: 'We help you connect your systems and get to your EU AI Act, NIST, and ISO obligations quickly.'
  },
  {
    title: 'Founder pricing',
    body: 'Early partners get fair pricing that stays locked in while the product matures.'
  }
];

export default function CustomersPage() {
  return (
    <div className='mx-auto max-w-4xl px-4 py-16 sm:px-6'>
      <div className='max-w-3xl'>
        <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
          Become an early design partner
        </h1>
        <p className='text-muted-foreground mt-4 text-lg text-pretty'>
          Veydria is new. We would rather earn trust than borrow it, so you will not find logos or
          quotes here that we have not earned. Instead, we are working with a small number of teams
          who govern real AI systems and want a say in what we build.
        </p>
      </div>

      <div className='mt-10 grid gap-4 sm:grid-cols-3'>
        {benefits.map((item) => (
          <div key={item.title} className='border-border rounded-xl border p-6'>
            <h2 className='font-medium'>{item.title}</h2>
            <p className='text-muted-foreground mt-2 text-sm'>{item.body}</p>
          </div>
        ))}
      </div>

      <div className='border-border mt-14 rounded-2xl border p-8 text-center sm:p-12'>
        <h2 className='text-2xl font-semibold'>Want to help shape Veydria?</h2>
        <p className='text-muted-foreground mx-auto mt-3 max-w-xl'>
          Connect one agent on the free plan, or talk to us about becoming a design partner. We are
          honest about what is ready today and what is still on the way.
        </p>
        <div className='mt-6 flex flex-wrap justify-center gap-3'>
          <Button size='lg' render={<Link href='/auth/sign-up' />}>
            Start free
          </Button>
          <Button size='lg' variant='outline' render={<Link href='/contact' />}>
            Talk to the team
          </Button>
        </div>
      </div>
    </div>
  );
}
