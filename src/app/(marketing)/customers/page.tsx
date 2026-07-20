import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Customers',
  description:
    'How AI teams in fintech, HR tech, and healthcare software use AgentProof to keep compliance close to the systems it describes.',
  path: '/customers'
});

type Story = {
  company: string;
  sector: string;
  challenge: string;
  solution: string;
  quote: string;
  attribution: string;
};

const stories: Story[] = [
  {
    company: 'Larkfield Pay',
    sector: 'Fintech',
    challenge: 'A credit decision model that has to show fair treatment on demand.',
    solution:
      'Larkfield connects its scoring model through the SDK, runs bias evaluations on every release, and keeps an Annex IV technical file that updates whenever the model changes.',
    quote:
      'When our regulator asked how the model treats different applicants, we sent a report we already had.',
    attribution: 'Head of Risk, Larkfield Pay'
  },
  {
    company: 'Rolela',
    sector: 'HR tech',
    challenge: 'A resume screening assistant that sits squarely in the EU AI Act high risk tier.',
    solution:
      'Rolela classified the system in minutes, saw the exact obligations that follow, and set evaluation thresholds that block a release if fairness scores slip.',
    quote: 'We knew screening was high risk. AgentProof told us precisely what that meant for us.',
    attribution: 'VP Engineering, Rolela'
  },
  {
    company: 'Verda Health',
    sector: 'Healthcare software',
    challenge: 'A clinical note assistant where an invented detail is a real safety issue.',
    solution:
      'Verda monitors every generation in production, checks output against the source record for hallucinations, and keeps a verifiable log of what the assistant produced.',
    quote: 'The audit log lets us answer what the assistant said on a given date without guessing.',
    attribution: 'CTO, Verda Health'
  }
];

export default function CustomersPage() {
  return (
    <div className='mx-auto max-w-6xl px-4 py-16 sm:px-6'>
      <div className='max-w-3xl'>
        <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
          Teams shipping AI with confidence
        </h1>
        <p className='text-muted-foreground mt-4 text-lg text-pretty'>
          The teams that get the most out of AgentProof treat compliance as part of building, not a
          task for the end. Here is how that looks across three kinds of product.
        </p>
        <p className='text-muted-foreground mt-3 text-sm'>
          These are illustrative examples that show common ways teams use the product. They are not
          named customers.
        </p>
      </div>

      <div className='mt-12 grid gap-4 md:grid-cols-3'>
        {stories.map((story) => (
          <article
            key={story.company}
            className='border-border flex flex-col rounded-xl border p-6'
          >
            <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              {story.sector}
            </p>
            <h2 className='mt-2 text-xl font-medium'>{story.company}</h2>
            <p className='text-foreground/80 mt-3 text-sm font-medium'>The challenge</p>
            <p className='text-muted-foreground mt-1 text-sm'>{story.challenge}</p>
            <p className='text-foreground/80 mt-3 text-sm font-medium'>With AgentProof</p>
            <p className='text-muted-foreground mt-1 text-sm'>{story.solution}</p>
            <figure className='border-border mt-5 flex-1 border-t pt-5'>
              <blockquote className='text-sm'>{`"${story.quote}"`}</blockquote>
              <figcaption className='text-muted-foreground mt-2 text-xs'>
                {story.attribution}
              </figcaption>
            </figure>
          </article>
        ))}
      </div>

      <div className='border-border mt-16 rounded-2xl border p-8 text-center sm:p-12'>
        <h2 className='text-2xl font-semibold'>Want to see it on your own systems?</h2>
        <p className='text-muted-foreground mx-auto mt-3 max-w-xl'>
          Connect one agent on the free plan, or book time with our team to walk through your setup.
        </p>
        <div className='mt-6 flex flex-wrap justify-center gap-3'>
          <Button size='lg' render={<Link href='/auth/sign-up' />}>
            Start free
          </Button>
          <Button size='lg' variant='outline' render={<Link href='/contact' />}>
            Talk to sales
          </Button>
        </div>
      </div>
    </div>
  );
}
