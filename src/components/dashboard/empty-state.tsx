import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export function EmptyState({
  icon = 'page',
  title,
  description
}: {
  icon?: keyof typeof Icons;
  title: string;
  description: string;
}) {
  const Icon = Icons[icon];
  return (
    <div className='border-border flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center'>
      <div className='bg-muted mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
        <Icon className='text-muted-foreground h-6 w-6' />
      </div>
      <h3 className='text-lg font-medium'>{title}</h3>
      <p className='text-muted-foreground mt-1 max-w-sm text-sm'>{description}</p>
    </div>
  );
}

/**
 * Server side pagination. Renders previous and next links that carry the
 * current search params, so filters survive page changes.
 */
export function Pagination({
  page,
  pageCount,
  basePath,
  params
}: {
  page: number;
  pageCount: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;

  const build = (targetPage: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value && key !== 'page') search.set(key, value);
    }
    search.set('page', String(targetPage));
    return `${basePath}?${search.toString()}`;
  };

  return (
    <div className='flex items-center justify-between pt-2'>
      <p className='text-muted-foreground text-sm'>
        Page {page} of {pageCount}
      </p>
      <div className='flex gap-2'>
        {page > 1 ? (
          <Button variant='outline' size='sm' render={<Link href={build(page - 1)} />}>
            <Icons.chevronLeft className='h-4 w-4' />
            Previous
          </Button>
        ) : (
          <Button variant='outline' size='sm' disabled>
            <Icons.chevronLeft className='h-4 w-4' />
            Previous
          </Button>
        )}
        {page < pageCount ? (
          <Button variant='outline' size='sm' render={<Link href={build(page + 1)} />}>
            Next
            <Icons.chevronRight className='h-4 w-4' />
          </Button>
        ) : (
          <Button variant='outline' size='sm' disabled>
            Next
            <Icons.chevronRight className='h-4 w-4' />
          </Button>
        )}
      </div>
    </div>
  );
}
