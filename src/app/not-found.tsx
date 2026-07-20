'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogoMark } from '@/components/brand/logo';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className='absolute top-1/2 left-1/2 mb-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center'>
      <div className='mb-4 flex justify-center'>
        <span className='bg-foreground text-background flex size-10 items-center justify-center rounded-lg'>
          <LogoMark className='size-6' />
        </span>
      </div>
      <span className='from-foreground bg-linear-to-b to-transparent bg-clip-text text-[10rem] leading-none font-extrabold text-transparent'>
        404
      </span>
      <h2 className='font-heading my-2 text-2xl font-bold'>This page is missing</h2>
      <p className='text-muted-foreground'>
        The page you are looking for does not exist or has moved.
      </p>
      <div className='mt-8 flex justify-center gap-2'>
        <Button onClick={() => router.back()} variant='outline' size='lg'>
          Go back
        </Button>
        <Button size='lg' render={<Link href='/' />}>
          Go home
        </Button>
      </div>
    </div>
  );
}
