import Link from 'next/link';
import { brand } from '@/config/brand';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Data Processing Addendum',
  description:
    'How AgentProof processes personal data on behalf of customers as a processor under data protection law.',
  path: '/dpa'
});

export default function DpaPage() {
  return (
    <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6'>
      <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
        Data Processing Addendum
      </h1>
      <p className='text-muted-foreground mt-2 text-sm'>Last updated 1 March 2026</p>

      <div className='mt-10 space-y-10'>
        <section>
          <h2 className='text-xl font-semibold'>Parties and roles</h2>
          <p className='text-muted-foreground mt-3'>
            This Data Processing Addendum (the DPA) forms part of the agreement between the customer
            (you) and {brand.legalName}. It applies when we process personal data on your behalf.
            For that data you are the controller and we are the processor. You decide what data to
            send and why. We process it only to provide the service and on your documented
            instructions, which include the agreement and your use of the product.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Scope and purpose</h2>
          <p className='text-muted-foreground mt-3'>
            We process the account data and agent event data you send so we can run discovery,
            classification, evaluation, monitoring, documentation, and support. The categories of
            data and data subjects depend on what you choose to send. You confirm you have a lawful
            basis to send that data and to have us process it.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Our obligations as processor</h2>
          <p className='text-muted-foreground mt-3'>
            We will process personal data only on your instructions, keep it confidential, and limit
            access to staff who need it. We will help you respond to data subject requests and meet
            your security, breach notification, and impact assessment duties, taking into account
            the nature of the processing. We will tell you if we believe an instruction breaks data
            protection law.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Sub processors</h2>
          <p className='text-muted-foreground mt-3'>
            You authorize us to use the sub processors listed on our{' '}
            <Link href='/subprocessors' className='text-foreground underline'>
              sub processors page
            </Link>{' '}
            to help run the service. Each is bound by data protection terms at least as protective
            as this DPA. We will give notice before we add or replace a sub processor so you can
            object on reasonable grounds.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Security measures</h2>
          <p className='text-muted-foreground mt-3'>
            We keep appropriate technical and organizational measures, including encryption in
            transit, access controls, tenant isolation, and the append only audit log described on
            our{' '}
            <Link href='/security' className='text-foreground underline'>
              security page
            </Link>
            . We review these measures and improve them over time.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>International transfers</h2>
          <p className='text-muted-foreground mt-3'>
            Where we transfer personal data out of the EEA, the UK, or Switzerland, we rely on the
            Standard Contractual Clauses and any required addenda, along with extra safeguards where
            they are needed.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Data subject requests</h2>
          <p className='text-muted-foreground mt-3'>
            If a data subject contacts us about data we process for you, we will refer them to you
            unless the law requires otherwise, and we will give you reasonable help to respond.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Breach notification</h2>
          <p className='text-muted-foreground mt-3'>
            If we become aware of a personal data breach affecting your data, we will notify you
            without undue delay and share the information you need to meet your own notification
            duties.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Return and deletion</h2>
          <p className='text-muted-foreground mt-3'>
            On termination, or at your request, we will delete or return the personal data we
            process for you within a reasonable period, unless the law requires us to keep it.
            Backups are deleted on our normal cycle.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Audits</h2>
          <p className='text-muted-foreground mt-3'>
            You may audit our compliance with this DPA once a year, or after a breach, on reasonable
            notice and in a way that does not disrupt the service. We may satisfy an audit by
            providing our documentation and answering your questions. You bear your own audit costs.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Order of precedence</h2>
          <p className='text-muted-foreground mt-3'>
            If this DPA conflicts with the rest of the agreement on the processing of personal data,
            this DPA controls for that subject.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Contact</h2>
          <p className='text-muted-foreground mt-3'>
            To ask about this DPA or request a signed copy, email{' '}
            <a href={`mailto:${brand.contact.legal}`} className='text-foreground underline'>
              {brand.contact.legal}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
