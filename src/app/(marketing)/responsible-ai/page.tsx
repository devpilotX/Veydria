import Link from 'next/link';
import { brand } from '@/config/brand';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Responsible AI',
  description:
    'The principles that guide how AgentProof builds its product and how we suggest you use it.',
  path: '/responsible-ai'
});

export default function ResponsibleAiPage() {
  return (
    <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6'>
      <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>Responsible AI</h1>
      <p className='text-muted-foreground mt-2 text-sm'>Last updated 1 March 2026</p>

      <p className='text-muted-foreground mt-8 text-lg text-pretty'>
        {brand.name} is a tool for building AI responsibly, so we hold ourselves to the standard we
        help customers meet. These principles guide how we build the product and how we suggest you
        use it.
      </p>

      <div className='mt-10 space-y-10'>
        <section>
          <h2 className='text-xl font-semibold'>Human oversight</h2>
          <p className='text-muted-foreground mt-3'>
            A person stays in charge. We surface risk tiers, scores, and draft documents, but a
            human reviews and decides. The product is built to make that review quick, not to remove
            it.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Transparency</h2>
          <p className='text-muted-foreground mt-3'>
            We show our work. Every risk classification records the reason and links to the source
            clause. Evaluation results come with detail, not just a number. You can see why a system
            was scored the way it was.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Fairness testing</h2>
          <p className='text-muted-foreground mt-3'>
            We give you bias evaluations so you can check how a system treats different groups, and
            we make it easy to run them on every release rather than once at launch.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Security and privacy</h2>
          <p className='text-muted-foreground mt-3'>
            Responsible AI includes keeping data safe. We use encryption, tenant isolation, and an
            append only audit log, and we collect only what we need. Our{' '}
            <Link href='/security' className='text-foreground underline'>
              security page
            </Link>{' '}
            has the detail.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Accountability</h2>
          <p className='text-muted-foreground mt-3'>
            The audit log gives you a record you can stand behind. When someone asks what an agent
            did, you can answer with evidence rather than memory, and you can verify the record has
            not been changed.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>How we use AI ourselves</h2>
          <p className='text-muted-foreground mt-3'>
            We use AI inside the product to speed up classification and drafting. It assists, it
            does not replace human judgement. A model can propose a risk tier or draft a document,
            but you review and sign off, and the reasoning is always there to check.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Questions</h2>
          <p className='text-muted-foreground mt-3'>
            Want to talk about how we approach this? Email{' '}
            <a href={`mailto:${brand.contact.support}`} className='text-foreground underline'>
              {brand.contact.support}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
