import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { brand } from '@/config/brand';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'About',
  description:
    'Why we built AgentProof: teams ship AI faster than they can document it. We keep compliance work next to the systems it describes.',
  path: '/about'
});

export default function AboutPage() {
  return (
    <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6'>
      <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
        Why we built {brand.name}
      </h1>
      <p className='text-muted-foreground mt-4 text-lg text-pretty'>
        Most teams can ship an AI feature in a week. Writing down what it does, working out which
        rules apply, and proving it behaves takes far longer. That work usually happens last, in a
        hurry, right before a customer or a regulator asks. We built {brand.name} to close that gap.
      </p>

      <section className='mt-12'>
        <h2 className='text-xl font-semibold'>The problem</h2>
        <p className='text-muted-foreground mt-3'>
          AI went from demos to production faster than the paperwork could keep up. A model gets
          swapped, a prompt changes, a new agent goes live, and the risk assessment someone wrote
          three months ago is already wrong. Compliance done by hand in documents drifts away from
          the system it is supposed to describe. When an auditor shows up, teams end up
          reconstructing what happened from logs, chat threads, and memory.
        </p>
      </section>

      <section className='mt-10'>
        <h2 className='text-xl font-semibold'>The approach</h2>
        <p className='text-muted-foreground mt-3'>
          {brand.name} runs one workflow with five steps: discover, classify, evaluate, monitor, and
          prove. You connect your systems once. The rules engine maps each one to the obligations
          that apply. Evaluations score agents for the failures that matter. Production activity
          streams into an audit log you can verify. The documents auditors ask for are generated
          from that same live data, not typed up on the side. Because every step reads from the one
          before it, the record stays current without a person keeping it in sync.
        </p>
      </section>

      <section className='mt-10'>
        <h2 className='text-xl font-semibold'>What we believe</h2>
        <p className='text-muted-foreground mt-3'>Three ideas shape the product.</p>
        <ul className='mt-4 space-y-4'>
          <li className='border-border rounded-xl border p-6'>
            <h3 className='font-medium'>Evidence over promises</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              A claim you cannot show is not worth much. Everything in the product ties back to data
              you can open and check for yourself.
            </p>
          </li>
          <li className='border-border rounded-xl border p-6'>
            <h3 className='font-medium'>Keep it in your database</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              Your systems, results, and audit trail live in your own Postgres, embeddings included.
              There is no separate vector store to run and secure.
            </p>
          </li>
          <li className='border-border rounded-xl border p-6'>
            <h3 className='font-medium'>Documents that read like a person wrote them</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              An Annex IV file should be clear to the engineer who owns the system and to the
              auditor reading it. We aim for plain writing, not a wall of filler.
            </p>
          </li>
        </ul>
      </section>

      <section className='mt-10'>
        <h2 className='text-xl font-semibold'>Who we are</h2>
        <p className='text-muted-foreground mt-3'>
          We are a small team that has shipped AI inside regulated products and felt this pain first
          hand. We would rather build one honest workflow than a pile of dashboards nobody trusts.
          If that sounds like a tool you want, we would like to hear from you.
        </p>
        <div className='mt-6 flex flex-wrap gap-3'>
          <Button render={<Link href='/auth/sign-up' />}>Start free</Button>
          <Button variant='outline' render={<Link href='/contact' />}>
            Talk to us
          </Button>
        </div>
      </section>
    </div>
  );
}
