import { brand } from '@/config/brand';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Contact',
  description:
    'Reach the Veydria team. Talk to sales about plans and demos, get help from support, or report a security issue.',
  path: '/contact'
});

type ContactOption = {
  title: string;
  body: string;
  email: string;
};

const options: ContactOption[] = [
  {
    title: 'Sales',
    body: 'Questions about plans, a walkthrough, or a proof of concept on your own systems.',
    email: brand.contact.sales
  },
  {
    title: 'Support',
    body: 'Help with your account, billing, or something in the app that is not working right.',
    email: brand.contact.support
  },
  {
    title: 'Security',
    body: 'Report a vulnerability or ask a question about how we handle your data.',
    email: brand.contact.security
  }
];

export default function ContactPage() {
  return (
    <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6'>
      <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>Talk to us</h1>
      <p className='text-muted-foreground mt-4 text-lg text-pretty'>
        Pick the inbox that fits. A real person reads each one, and we try to reply within a
        business day.
      </p>

      <div className='mt-10 grid gap-4 sm:grid-cols-3'>
        {options.map((option) => (
          <div key={option.title} className='border-border rounded-xl border p-6'>
            <h2 className='text-lg font-medium'>{option.title}</h2>
            <p className='text-muted-foreground mt-2 text-sm'>{option.body}</p>
            <a
              href={`mailto:${option.email}`}
              className='text-foreground mt-4 inline-block text-sm font-medium underline'
            >
              {option.email}
            </a>
          </div>
        ))}
      </div>

      <section className='mt-12'>
        <h2 className='text-xl font-semibold'>Mailing address</h2>
        <p className='text-muted-foreground mt-3 text-sm'>
          We handle correspondence by email while we finalize a registered address. For legal
          notices, email{' '}
          <a href={`mailto:${brand.contact.legal}`} className='text-foreground underline'>
            {brand.contact.legal}
          </a>
          .
        </p>
      </section>
    </div>
  );
}
