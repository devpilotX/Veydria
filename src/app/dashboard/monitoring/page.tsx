import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState, Pagination } from '@/components/dashboard/empty-state';
import { getDashboardContext } from '@/lib/auth/page';
import { listEvents, listEventsSchema } from '@/server/services/monitoring';

export const metadata = { title: 'Monitoring' };

export default async function MonitoringPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await getDashboardContext();
  const params = await searchParams;
  const flaggedOnly = params.flagged === 'true';
  const input = listEventsSchema.parse({
    page: params.page,
    flagged: flaggedOnly ? 'true' : undefined
  });
  const { items, page, pageCount } = await listEvents(ctx, input);

  return (
    <PageContainer
      pageTitle='Monitoring'
      pageDescription='The live stream of agent actions in production, flagged when a rule fires.'
    >
      <div className='space-y-4'>
        <form className='flex items-center gap-2'>
          <label className='text-sm'>
            <input
              type='checkbox'
              name='flagged'
              value='true'
              defaultChecked={flaggedOnly}
              className='mr-2 align-middle'
            />
            Flagged only
          </label>
          <button
            type='submit'
            className='border-input bg-background hover:bg-muted h-9 rounded-md border px-3 text-sm'
          >
            Apply
          </button>
        </form>

        {items.length === 0 ? (
          <EmptyState
            icon='activity'
            title='No events yet'
            description='Stream events with the SDK to see agent activity and catch issues early.'
          />
        ) : (
          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Flag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className='text-muted-foreground'>
                        {new Date(event.occurredAt).toLocaleString()}
                      </TableCell>
                      <TableCell className='capitalize'>
                        {event.eventType.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>{event.latencyMs ? `${event.latencyMs} ms` : '-'}</TableCell>
                      <TableCell className='text-muted-foreground'>
                        {(event.tokensIn ?? 0) + (event.tokensOut ?? 0)}
                      </TableCell>
                      <TableCell>
                        {event.flagged ? (
                          <Badge
                            variant='outline'
                            className='border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                          >
                            Flagged
                          </Badge>
                        ) : (
                          <span className='text-muted-foreground text-xs'>ok</span>
                        )}
                      </TableCell>
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
          basePath='/dashboard/monitoring'
          params={params}
        />
      </div>
    </PageContainer>
  );
}
