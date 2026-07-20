import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { RiskBadge } from '@/components/dashboard/badges';
import { EmptyState, Pagination } from '@/components/dashboard/empty-state';
import { Icons } from '@/components/icons';
import { getDashboardContext } from '@/lib/auth/page';
import { listAiSystems, listAiSystemsSchema } from '@/server/services/ai-systems';

export const metadata = { title: 'AI Systems' };

const riskOptions = ['', 'high', 'limited', 'minimal', 'unknown'];

export default async function SystemsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await getDashboardContext();
  const params = await searchParams;
  const input = listAiSystemsSchema.parse({
    page: params.page,
    search: params.search,
    riskTier: params.riskTier || undefined
  });
  const { items, page, pageCount } = await listAiSystems(ctx, input);

  return (
    <PageContainer
      pageTitle='AI Systems'
      pageDescription='Your inventory of AI systems, each mapped to a risk tier and its obligations.'
      pageHeaderAction={
        <Button render={<Link href='/dashboard/systems/new' />}>
          <Icons.add className='h-4 w-4' />
          New system
        </Button>
      }
    >
      <div className='space-y-4'>
        <form className='flex flex-wrap items-center gap-2'>
          <input
            name='search'
            defaultValue={params.search ?? ''}
            placeholder='Search by name'
            className='border-input bg-background h-9 w-56 rounded-md border px-3 text-sm'
          />
          <select
            name='riskTier'
            defaultValue={params.riskTier ?? ''}
            className='border-input bg-background h-9 rounded-md border px-3 text-sm capitalize'
          >
            {riskOptions.map((option) => (
              <option key={option} value={option}>
                {option === '' ? 'All risk tiers' : option}
              </option>
            ))}
          </select>
          <Button type='submit' variant='outline' size='sm'>
            Filter
          </Button>
        </form>

        {items.length === 0 ? (
          <EmptyState
            icon='shield'
            title='No AI systems yet'
            description='Add your first system to classify its risk and see the obligations that apply.'
          />
        ) : (
          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Risk tier</TableHead>
                    <TableHead>Lifecycle</TableHead>
                    <TableHead>Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((system) => (
                    <TableRow key={system.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/systems/${system.id}`}
                          className='hover:text-primary font-medium'
                        >
                          {system.name}
                        </Link>
                        <p className='text-muted-foreground truncate text-xs'>
                          {system.purpose ?? system.description ?? ''}
                        </p>
                      </TableCell>
                      <TableCell className='capitalize'>{system.domain ?? '-'}</TableCell>
                      <TableCell>
                        <RiskBadge tier={system.riskTier} />
                      </TableCell>
                      <TableCell className='capitalize'>{system.lifecycle}</TableCell>
                      <TableCell>{system.ownerName ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Pagination
          page={page}
          pageCount={pageCount}
          basePath='/dashboard/systems'
          params={params}
        />
      </div>
    </PageContainer>
  );
}
