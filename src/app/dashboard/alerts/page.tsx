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
import { AlertStatusBadge, SeverityBadge } from '@/components/dashboard/badges';
import { EmptyState, Pagination } from '@/components/dashboard/empty-state';
import { PostActionButton } from '@/features/dashboard/components/action-button';
import { getDashboardContext } from '@/lib/auth/page';
import { listAlerts, listAlertsSchema } from '@/server/services/alerts';

export const metadata = { title: 'Alerts' };

const statusOptions = ['', 'open', 'acknowledged', 'resolved'];

export default async function AlertsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await getDashboardContext();
  const params = await searchParams;
  const input = listAlertsSchema.parse({ page: params.page, status: params.status || undefined });
  const { items, page, pageCount } = await listAlerts(ctx, input);

  return (
    <PageContainer
      pageTitle='Alerts'
      pageDescription='Anomalies, policy breaches, failed evaluations, and drift that need a look.'
    >
      <div className='space-y-4'>
        <form className='flex flex-wrap items-center gap-2'>
          <select
            name='status'
            defaultValue={params.status ?? ''}
            className='border-input bg-background h-9 rounded-md border px-3 text-sm capitalize'
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === '' ? 'All statuses' : option}
              </option>
            ))}
          </select>
          <button
            type='submit'
            className='border-input bg-background hover:bg-muted h-9 rounded-md border px-3 text-sm'
          >
            Filter
          </button>
        </form>

        {items.length === 0 ? (
          <EmptyState
            icon='notification'
            title='No alerts'
            description='When monitoring or evaluations flag something, it shows up here.'
          />
        ) : (
          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alert</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className='max-w-md'>
                        <span className='text-sm font-medium'>{alert.title}</span>
                        <p className='text-muted-foreground truncate text-xs'>
                          {alert.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={alert.severity} />
                      </TableCell>
                      <TableCell>
                        <AlertStatusBadge status={alert.status} />
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          {alert.status === 'open' && (
                            <PostActionButton
                              url={`/api/alerts/${alert.id}`}
                              method='PATCH'
                              body={{ status: 'acknowledged' }}
                              label='Acknowledge'
                              variant='outline'
                              successMessage='Alert acknowledged.'
                            />
                          )}
                          {alert.status !== 'resolved' && (
                            <PostActionButton
                              url={`/api/alerts/${alert.id}`}
                              method='PATCH'
                              body={{ status: 'resolved' }}
                              label='Resolve'
                              variant='outline'
                              successMessage='Alert resolved.'
                            />
                          )}
                        </div>
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
          basePath='/dashboard/alerts'
          params={params}
        />
      </div>
    </PageContainer>
  );
}
