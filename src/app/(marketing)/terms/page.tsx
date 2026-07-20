import Link from 'next/link';
import { brand } from '@/config/brand';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Terms of Service',
  description:
    'The terms that govern your use of AgentProof, including billing, data ownership, and liability.',
  path: '/terms'
});

export default function TermsPage() {
  return (
    <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6'>
      <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>Terms of Service</h1>
      <p className='text-muted-foreground mt-2 text-sm'>Last updated 1 March 2026</p>

      <div className='mt-10 space-y-10'>
        <section>
          <h2 className='text-xl font-semibold'>Acceptance</h2>
          <p className='text-muted-foreground mt-3'>
            These Terms of Service are a contract between you and {brand.legalName}. By creating an
            account or using {brand.name}, you agree to them. If you accept on behalf of a company,
            you confirm you have authority to bind it. If you do not agree, do not use the service.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>The service</h2>
          <p className='text-muted-foreground mt-3'>
            {brand.name} helps you discover, classify, evaluate, monitor, and document AI systems
            against frameworks such as the EU AI Act, the NIST AI Risk Management Framework, and ISO
            42001. It supports your compliance work. It is a tool, not legal advice, and it does not
            guarantee that you meet any legal or regulatory requirement. You remain responsible for
            your own compliance decisions.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Accounts and organizations</h2>
          <p className='text-muted-foreground mt-3'>
            You sign in through our auth provider. Work is grouped into organizations, and access is
            set by role: Owner, Admin, Member, and Viewer. You are responsible for the activity
            under your account and for keeping your credentials and API keys secret. Tell us
            promptly if you suspect someone is using your account without permission.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Acceptable use</h2>
          <p className='text-muted-foreground mt-3'>
            Your use of the service must follow our{' '}
            <Link href='/acceptable-use' className='text-foreground underline'>
              Acceptable Use Policy
            </Link>
            . We may suspend or close accounts that break it.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Fees and billing</h2>
          <p className='text-muted-foreground mt-3'>
            Paid plans are billed in advance on a monthly or annual cycle through our billing
            provider. Fees are shown on the pricing page and exclude taxes, which are your
            responsibility. Charges are non refundable except where the law requires otherwise. If a
            payment fails, we may suspend paid features until it clears. We will give notice before
            a price change takes effect.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Intellectual property</h2>
          <p className='text-muted-foreground mt-3'>
            We own the service, the software, and everything in it except your data. We grant you a
            limited, non exclusive, non transferable right to use the service during your
            subscription. You may not copy, resell, reverse engineer, or build a competing product
            from it.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Your data</h2>
          <p className='text-muted-foreground mt-3'>
            You own the data you and your users put into the service, including your agent event
            data. You grant us the rights we need to host and process it so we can run the service
            for you. How we handle personal data is covered by our{' '}
            <Link href='/privacy' className='text-foreground underline'>
              Privacy Policy
            </Link>{' '}
            and, for data we process on your behalf, our{' '}
            <Link href='/dpa' className='text-foreground underline'>
              Data Processing Addendum
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Warranties and disclaimers</h2>
          <p className='text-muted-foreground mt-3'>
            We work hard to keep the service running and accurate, but we provide it as is and as
            available, without warranties of any kind to the extent the law allows. We do not
            warrant that the service will be uninterrupted or error free, or that its output will
            satisfy any regulator or auditor.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Limitation of liability</h2>
          <p className='text-muted-foreground mt-3'>
            To the extent the law allows, neither party is liable for indirect, incidental, or
            consequential damages, or for lost profits or data. Our total liability for any claim is
            limited to the fees you paid us in the twelve months before the event that gave rise to
            the claim. Nothing here limits liability that cannot be limited by law.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Term and termination</h2>
          <p className='text-muted-foreground mt-3'>
            These terms apply while you use the service. You may cancel at any time from billing
            settings, effective at the end of the current cycle. We may suspend or end access if you
            break these terms or fail to pay, with notice where it is practical. On termination you
            can export your data for a limited window, after which we delete it as set out in the
            Data Processing Addendum.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Changes</h2>
          <p className='text-muted-foreground mt-3'>
            We may update the service and these terms. If a change to the terms is significant, we
            will give notice in the app or by email before it takes effect. If you keep using the
            service after that, you accept the new terms.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Governing law</h2>
          <p className='text-muted-foreground mt-3'>
            These terms are governed by the laws of the State of California, without regard to its
            conflict of laws rules. The state and federal courts located in San Francisco County,
            California have exclusive jurisdiction, unless a mandatory law in your location says
            otherwise.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Contact</h2>
          <p className='text-muted-foreground mt-3'>
            Questions about these terms? Email{' '}
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
