import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/logo';
import { brand } from '@/config/brand';
import { headerNav } from '@/config/marketing';

export function MarketingHeader() {
  return (
    <header className='border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur'>
      <div className='mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6'>
        <Link href='/' aria-label={`${brand.name} home`}>
          <Logo />
        </Link>

        <nav className='hidden items-center gap-6 md:flex'>
          {headerNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className='text-muted-foreground hover:text-foreground text-sm transition-colors'
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='sm' render={<Link href='/auth/sign-in' />}>
            Sign in
          </Button>
          <Button size='sm' render={<Link href='/auth/sign-up' />}>
            Start free
          </Button>
        </div>
      </div>
    </header>
  );
}
