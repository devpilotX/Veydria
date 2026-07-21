import { brand } from '@/config/brand';
import { LogoMark } from '@/components/brand/logo';
import { cn } from '@/lib/utils';
import { SignIn as ClerkSignInForm } from '@clerk/nextjs';
import { Metadata } from 'next';
import Link from 'next/link';
import { InteractiveGridPattern } from './interactive-grid';

export const metadata: Metadata = {
  title: 'Sign in',
  description: `Sign in to your ${brand.name} workspace.`
};

export default function SignInViewPage() {
  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='relative hidden h-full flex-col p-10 lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-sidebar' />
        <div className='text-sidebar-foreground relative z-20 flex items-center gap-2 text-lg font-medium'>
          <LogoMark className='size-8' />
          {brand.name}
        </div>
        <InteractiveGridPattern
          className={cn(
            'mask-[radial-gradient(400px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[0%] h-full skew-y-12'
          )}
        />
        <div className='text-sidebar-foreground relative z-20 mt-auto'>
          <p className='text-2xl font-semibold'>Proof for every AI decision.</p>
          <p className='text-sidebar-foreground/70 mt-3 text-sm'>
            Map your AI systems to the EU AI Act, NIST AI RMF, and ISO 42001, test every agent, and
            keep an audit ready trail.
          </p>
        </div>
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          <ClerkSignInForm />
          <p className='text-muted-foreground px-8 text-center text-sm'>
            By continuing, you agree to our{' '}
            <Link href='/terms' className='hover:text-primary underline underline-offset-4'>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href='/privacy' className='hover:text-primary underline underline-offset-4'>
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
