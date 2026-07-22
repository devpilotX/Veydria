import { brand } from '@/config/brand';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Sub processors',
  description: 'The vendors Veydria uses to run the service and the purpose each one serves.',
  path: '/subprocessors'
});

type Subprocessor = {
  name: string;
  purpose: string;
  location: string;
};

const subprocessors: Subprocessor[] = [
  { name: 'Clerk', purpose: 'Authentication and organizations', location: 'United States' },
  { name: 'Stripe', purpose: 'Payments and billing', location: 'United States' },
  { name: 'Sentry', purpose: 'Error monitoring, when enabled', location: 'United States' },
  {
    name: 'OpenAI',
    purpose: 'LLM provider, used only for systems where you configure it',
    location: 'United States'
  },
  {
    name: 'Anthropic',
    purpose: 'LLM provider, used only for systems where you configure it',
    location: 'United States'
  },
  {
    name: 'Google',
    purpose: 'LLM provider, used only for systems where you configure it',
    location: 'United States'
  },
  { name: 'Vercel', purpose: 'Application hosting and edge delivery', location: 'United States' },
  {
    name: 'Managed PostgreSQL provider',
    purpose: 'Database hosting for your systems, results, and audit log',
    location: 'United States or EU'
  }
];

export default function SubprocessorsPage() {
  return (
    <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6'>
      <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>Sub processors</h1>
      <p className='text-muted-foreground mt-2 text-sm'>Last updated 1 March 2026</p>

      <p className='text-muted-foreground mt-8'>
        We use a small set of vendors to run {brand.name}. Each one is bound by a contract that
        limits use of data to running the service. The LLM providers only process data for systems
        where you turn them on. The database and hosting region depends on your setup.
      </p>

      <div className='mt-8 overflow-x-auto'>
        <table className='w-full border-collapse text-left text-sm'>
          <thead>
            <tr className='border-border border-b'>
              <th scope='col' className='py-3 pr-4 font-medium'>
                Sub processor
              </th>
              <th scope='col' className='py-3 pr-4 font-medium'>
                Purpose
              </th>
              <th scope='col' className='py-3 font-medium'>
                Location
              </th>
            </tr>
          </thead>
          <tbody>
            {subprocessors.map((item) => (
              <tr key={item.name} className='border-border/60 border-b align-top'>
                <td className='py-3 pr-4 font-medium'>{item.name}</td>
                <td className='text-muted-foreground py-3 pr-4'>{item.purpose}</td>
                <td className='text-muted-foreground py-3'>{item.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className='mt-10'>
        <h2 className='text-xl font-semibold'>Changes and notice</h2>
        <p className='text-muted-foreground mt-3'>
          We update this list when it changes. Before we add or replace a sub processor, we give
          notice so you can object on reasonable grounds. To receive these notices, email{' '}
          <a href={`mailto:${brand.contact.privacy}`} className='text-foreground underline'>
            {brand.contact.privacy}
          </a>{' '}
          and ask to be added to the list.
        </p>
      </section>
    </div>
  );
}
