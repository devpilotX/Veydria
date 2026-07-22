import { brand } from '@/config/brand';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Cookie Policy',
  description: 'The cookies Veydria uses, why we use them, and how you can control them.',
  path: '/cookies'
});

export default function CookiesPage() {
  return (
    <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6'>
      <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>Cookie Policy</h1>
      <p className='text-muted-foreground mt-2 text-sm'>Last updated 1 March 2026</p>

      <div className='mt-10 space-y-10'>
        <section>
          <h2 className='text-xl font-semibold'>What cookies are</h2>
          <p className='text-muted-foreground mt-3'>
            Cookies are small files a site stores on your device. Similar technologies, like local
            storage, do much the same job. We use a small number of them, and each kind is explained
            below.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Cookies we use</h2>
          <p className='text-muted-foreground mt-3'>
            Essential cookies keep you signed in and keep your session secure. They are set by our
            auth provider and cannot be turned off without breaking sign in. We do not use analytics
            or advertising cookies.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>What we do not do</h2>
          <p className='text-muted-foreground mt-3'>
            We do not use advertising cookies, we do not track you across other sites to serve ads,
            and we do not sell your personal data.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>How to control cookies</h2>
          <p className='text-muted-foreground mt-3'>
            Your browser lets you block or delete cookies, though blocking the essential cookies
            will stop sign in from working. We only set essential cookies, so there is nothing
            optional to turn on or off.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Do Not Track</h2>
          <p className='text-muted-foreground mt-3'>
            Some browsers send a Do Not Track signal. There is no agreed standard for how sites
            should respond. We do not run analytics or advertising trackers at all, so there is
            nothing for it to switch off.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold'>Changes and contact</h2>
          <p className='text-muted-foreground mt-3'>
            We will update this policy if our use of cookies changes. Questions? Email{' '}
            <a href={`mailto:${brand.contact.privacy}`} className='text-foreground underline'>
              {brand.contact.privacy}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
