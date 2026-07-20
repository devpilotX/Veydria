import Link from 'next/link';
import { brand } from '@/config/brand';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Privacy Policy',
  description:
    'What personal data AgentProof collects, why we process it, and the choices you have.',
  path: '/privacy'
});

export default function PrivacyPage() {
  return (
    <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6'>
      <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>Privacy Policy</h1>
      <p className='text-muted-foreground mt-2 text-sm'>Last updated 1 March 2026</p>

      <div className='mt-10 space-y-10'>
        <section>
          <h2 className='text-xl font-semibold'>Who we are</h2>
          <p className='text-muted-foreground mt-3'>
            {brand.legalName} (referred to as {brand.name}, we, or us) runs a platform that helps
            teams govern, test, and document their AI systems. This policy explains what personal
            data we handle, why we handle it, and the choices you have. For personal data our
            customers send us about their own users, the customer is the controller and we act as a
            processor under their instructions. That data is governed by our Data Processing
            Addendum.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Data we collect</h2>
          <ul className='text-muted-foreground mt-3 list-disc space-y-2 pl-5'>
            <li>
              Account data: your name, work email, organization, role, and the sign in identifiers
              our auth provider returns when you register or accept an invite.
            </li>
            <li>
              Billing data: company details and the payment references our billing provider gives
              us. We do not store full card numbers.
            </li>
            <li>
              Usage data: pages viewed, features used, device and browser details, and log data such
              as IP address and timestamps, used to run and improve the service.
            </li>
            <li>
              Agent event data: the inputs, outputs, and metadata you choose to send about your AI
              systems. This can contain personal data if you include it, so you decide what to send.
            </li>
            <li>Support data: the content of messages you send us when you ask for help.</li>
          </ul>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>How we use data</h2>
          <p className='text-muted-foreground mt-3'>
            We use personal data to provide and maintain the service, to authenticate you and secure
            your account, to process payments, to answer support requests, to send service messages
            and product updates you can opt out of, to debug and improve the product, and to meet
            our legal obligations.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Legal bases</h2>
          <p className='text-muted-foreground mt-3'>
            Where the GDPR applies, we rely on the following bases: performance of our contract with
            you to run the service, our legitimate interests in securing and improving the product
            balanced against your rights, your consent for optional analytics and marketing email
            which you can withdraw, and legal obligation for records we must keep such as tax and
            accounting data.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Sharing and subprocessors</h2>
          <p className='text-muted-foreground mt-3'>
            We do not sell personal data. We share it with the vendors that help us run the service,
            including hosting, auth, billing, email, and analytics providers, and each is bound by a
            contract that limits use to our instructions. The current list is on the{' '}
            <Link href='/subprocessors' className='text-foreground underline'>
              sub processors page
            </Link>
            . We may also disclose data if the law requires it, to protect our rights and our users,
            or to a buyer in a merger or acquisition, with notice where we can give it.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>International transfers</h2>
          <p className='text-muted-foreground mt-3'>
            We are based in the United States, and some of our vendors process data in other
            countries. Where we move personal data out of the EEA, the UK, or Switzerland, we rely
            on the Standard Contractual Clauses and add further safeguards where they are needed.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>How long we keep data</h2>
          <p className='text-muted-foreground mt-3'>
            We keep account data while your account is active and for a limited period afterward,
            then delete or anonymize it, unless we must keep records for legal reasons. Agent event
            data is retained according to your plan and settings, and is deleted on request or when
            your account closes, as set out in the Data Processing Addendum.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Security</h2>
          <p className='text-muted-foreground mt-3'>
            We protect data with encryption in transit, access controls, and the append only audit
            log described on our{' '}
            <Link href='/security' className='text-foreground underline'>
              security page
            </Link>
            . No system is perfect, but we work to reduce risk and to respond quickly when something
            goes wrong.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Your rights</h2>
          <p className='text-muted-foreground mt-3'>
            Depending on where you live, you may have the right to access, correct, delete, or port
            your personal data, to object to or restrict some processing, and to withdraw consent.
            Under the GDPR you can also complain to a supervisory authority. Under the CCPA,
            California residents can request access and deletion and can opt out of any sale, though
            we do not sell personal data. To make a request, email{' '}
            <a href={`mailto:${brand.contact.privacy}`} className='text-foreground underline'>
              {brand.contact.privacy}
            </a>
            . For data we process on behalf of a customer, we will pass your request to that
            customer.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Children</h2>
          <p className='text-muted-foreground mt-3'>
            The service is built for businesses and is not directed at children. We do not knowingly
            collect personal data from anyone under 16.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Changes to this policy</h2>
          <p className='text-muted-foreground mt-3'>
            We will update this policy as the product and the law change. If a change is
            significant, we will give notice in the app or by email. The date at the top shows the
            current version.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Contact</h2>
          <p className='text-muted-foreground mt-3'>
            Questions about privacy? Email{' '}
            <a href={`mailto:${brand.contact.privacy}`} className='text-foreground underline'>
              {brand.contact.privacy}
            </a>{' '}
            or write to us:
          </p>
          <address className='text-muted-foreground mt-3 text-sm not-italic'>
            {brand.legalName}
            <br />
            {brand.address.line1}, {brand.address.line2}
            <br />
            {brand.address.city}, {brand.address.region} {brand.address.postalCode}
            <br />
            {brand.address.country}
          </address>
        </section>
      </div>
    </div>
  );
}
