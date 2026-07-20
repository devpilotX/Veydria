import { Skeleton } from '@/components/ui/skeleton';

// Shown while a dashboard page fetches on the server, so navigation feels quick.
export default function DashboardLoading() {
  return (
    <div className='flex flex-1 flex-col gap-4 px-4 pt-4 md:px-6'>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-56' />
        <Skeleton className='h-4 w-96 max-w-full' />
      </div>
      <div className='mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className='h-28 w-full' />
        ))}
      </div>
      <Skeleton className='h-72 w-full' />
    </div>
  );
}
