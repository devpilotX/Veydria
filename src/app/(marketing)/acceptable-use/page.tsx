import Link from 'next/link';
import { brand } from '@/config/brand';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Acceptable Use Policy',
  description:
    'The rules for using Veydria, including prohibited uses and prohibited AI practices.',
  path: '/acceptable-use'
});

export default function AcceptableUsePage() {
  return (
    <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6'>
      <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>Acceptable Use Policy</h1>
      <p className='text-muted-foreground mt-2 text-sm'>Last updated 1 March 2026</p>

      <div className='mt-10 space-y-10'>
        <section>
          <h2 className='text-xl font-semibold'>Scope</h2>
          <p className='text-muted-foreground mt-3'>
            This Acceptable Use Policy applies to everyone who uses {brand.name}, and it is part of
            our{' '}
            <Link href='/terms' className='text-foreground underline'>
              Terms of Service
            </Link>
            . The short version: use the service lawfully, do not harm others, and do not misuse our
            systems.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Prohibited uses</h2>
          <p className='text-muted-foreground mt-3'>
            You may not use the service to break the law or help others do so. You may not send
            malware, run denial of service attacks, probe or breach security without permission, or
            get around usage limits. You may not access accounts or data that are not yours, and you
            may not interfere with the service for other customers.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>The data you send</h2>
          <p className='text-muted-foreground mt-3'>
            You are responsible for the agent event data you send us. Do not send data you have no
            right to share, data that infringes someone else rights, or special category personal
            data you have no lawful basis to process. Do not send content that is unlawful, that
            sexualizes children, or that you are contractually barred from disclosing.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Prohibited AI uses</h2>
          <p className='text-muted-foreground mt-3'>
            Do not use {brand.name} to support AI practices that the EU AI Act prohibits or that are
            otherwise unlawful, such as social scoring of individuals, manipulative systems that
            cause harm, or untargeted scraping of faces to build recognition databases. Using our
            tool to document a system does not make an unlawful use lawful.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Enforcement</h2>
          <p className='text-muted-foreground mt-3'>
            If we believe you are breaking this policy, we may warn you, limit or suspend your
            access, remove offending content, or close your account. Where there is a risk to others
            or to the service, we may act first and explain afterward.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Reporting</h2>
          <p className='text-muted-foreground mt-3'>
            Seen something that breaks this policy? Tell us at{' '}
            <a href={`mailto:${brand.contact.support}`} className='text-foreground underline'>
              {brand.contact.support}
            </a>{' '}
            with enough detail for us to look into it.
          </p>
        </section>
      </div>
    </div>
  );
}
