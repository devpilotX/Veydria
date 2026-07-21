import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { brand } from '@/config/brand';
import { footerGroups } from '@/config/marketing';

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className='border-border/60 border-t'>
      <div className='mx-auto max-w-6xl px-4 py-12 sm:px-6'>
        <div className='grid gap-8 md:grid-cols-5'>
          <div className='md:col-span-1'>
            <Link href='/' aria-label={`${brand.name} home`}>
              <Logo />
            </Link>
            <p className='text-muted-foreground mt-3 text-sm'>{brand.tagline}.</p>
          </div>
          {footerGroups.map((group) => (
            <div key={group.label}>
              <h3 className='text-sm font-medium'>{group.label}</h3>
              <ul className='mt-3 space-y-2'>
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className='text-muted-foreground hover:text-foreground text-sm transition-colors'
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className='border-border/60 text-muted-foreground mt-10 flex flex-col items-start justify-between gap-2 border-t pt-6 text-sm sm:flex-row'>
          <p>{brand.tagline}.</p>
          <p>
            Copyright {year} {brand.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
