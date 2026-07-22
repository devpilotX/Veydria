import Link from 'next/link';
import { brand } from '@/config/brand';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Security',
  description:
    'How Veydria handles your data: secrets in environment variables, encryption in transit, a hash chained audit log, tenant isolation, and role based access.',
  path: '/security'
});

export default function SecurityPage() {
  return (
    <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6'>
      <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
        Security at {brand.name}
      </h1>
      <p className='text-muted-foreground mt-4 text-lg text-pretty'>
        {brand.name} holds records that teams use to prove how their AI behaves, so the integrity of
        that data matters as much as keeping it private. This page explains how we build. It
        describes our practices, not a formal certification.
      </p>

      <section className='mt-12'>
        <h2 className='text-xl font-semibold'>Data handling</h2>
        <p className='text-muted-foreground mt-3'>
          Secrets live in environment variables and are never committed to source control. Traffic
          to the app and the API is encrypted in transit with TLS. Data at rest sits on managed
          infrastructure from our hosting and database providers, which encrypt storage volumes. We
          collect the data needed to run the service and the events you choose to send, and nothing
          beyond that.
        </p>
      </section>

      <section className='mt-10'>
        <h2 className='text-xl font-semibold'>The append only audit log</h2>
        <p className='text-muted-foreground mt-3'>
          Agent activity streams into an append only log. Each row stores a hash of the row before
          it, which forms a chain. Change one past entry and every hash after it stops matching, so
          tampering is easy to detect and hard to hide. You can verify the chain on demand, and the
          check tells you the exact point where it breaks if it ever does.
        </p>
      </section>

      <section className='mt-10'>
        <h2 className='text-xl font-semibold'>Tenant isolation</h2>
        <p className='text-muted-foreground mt-3'>
          Every record belongs to an organization. Queries are scoped to the organization making the
          request, and API keys are tied to a single organization, so one tenant cannot read another
          tenant data. Embeddings and search results follow the same scoping because they live in
          the same database.
        </p>
      </section>

      <section className='mt-10'>
        <h2 className='text-xl font-semibold'>Access control</h2>
        <p className='text-muted-foreground mt-3'>
          Access is governed by roles backed by Clerk Organizations. There are four: Owner, Admin,
          Member, and Viewer. Owners and Admins manage billing, members, and settings. Members do
          the day to day work. Viewers can read but not change. These checks run on the server, not
          just in the interface, so hiding a button is never the only thing standing between a user
          and an action.
        </p>
      </section>

      <section className='mt-10'>
        <h2 className='text-xl font-semibold'>Responsible disclosure</h2>
        <p className='text-muted-foreground mt-3'>
          If you find a vulnerability, please tell us before you tell anyone else. Email{' '}
          <a href={`mailto:${brand.contact.security}`} className='text-foreground underline'>
            {brand.contact.security}
          </a>{' '}
          with steps to reproduce and any proof of concept. We will confirm receipt, keep you
          updated while we investigate, and we will not pursue action against good faith research
          that respects user privacy and avoids service disruption.
        </p>
      </section>

      <section className='mt-10'>
        <h2 className='text-xl font-semibold'>Subprocessors</h2>
        <p className='text-muted-foreground mt-3'>
          We use a small set of vendors to run the service, such as our authentication, billing, and
          hosting providers. The current list, with the purpose of each, is on the{' '}
          <Link href='/subprocessors' className='text-foreground underline'>
            sub processors page
          </Link>
          . We update it when the list changes.
        </p>
      </section>
    </div>
  );
}
