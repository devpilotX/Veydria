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
import { ObligationStatusBadge, SeverityBadge } from '@/components/dashboard/badges';
import { EmptyState, Pagination } from '@/components/dashboard/empty-state';
import { PostActionButton } from '@/features/dashboard/components/action-button';
import { getDashboardContext } from '@/lib/auth/page';
import { listObligations, listObligationsSchema } from '@/server/services/obligations';

export const metadata = { title: 'Obligations' };

const statusOptions = ['', 'not_started', 'in_progress', 'met', 'not_applicable'];

export default async function ObligationsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await getDashboardContext();
  const params = await searchParams;
  const input = listObligationsSchema.parse({
    page: params.page,
    status: params.status || undefined,
    regulationCode: params.regulationCode || undefined,
    aiSystemId: params.aiSystemId || undefined
  });
  const { items, page, pageCount } = await listObligations(ctx, input);

  return (
    <PageContainer
      pageTitle='Obligations'
      pageDescription='The duties that apply across your systems, with evidence and status.'
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
                {option === '' ? 'All statuses' : option.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <select
            name='regulationCode'
            defaultValue={params.regulationCode ?? ''}
            className='border-input bg-background h-9 rounded-md border px-3 text-sm'
          >
            <option value=''>All frameworks</option>
            <option value='eu_ai_act'>EU AI Act</option>
            <option value='nist_ai_rmf'>NIST AI RMF</option>
            <option value='iso_42001'>ISO 42001</option>
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
            icon='checklist'
            title='No obligations here'
            description='Classify a system to generate the obligations that apply to it.'
          />
        ) : (
          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Obligation</TableHead>
                    <TableHead>Framework</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((obligation) => (
                    <TableRow key={obligation.id}>
                      <TableCell className='max-w-md'>
                        <span className='text-sm font-medium'>{obligation.title}</span>
                        <p className='text-muted-foreground truncate text-xs'>
                          {obligation.clauseRef}
                        </p>
                      </TableCell>
                      <TableCell className='uppercase'>
                        {obligation.regulationCode.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={obligation.severity} />
                      </TableCell>
                      <TableCell>
                        <ObligationStatusBadge status={obligation.status} />
                      </TableCell>
                      <TableCell className='text-right'>
                        {obligation.status !== 'met' && (
                          <PostActionButton
                            url={`/api/obligations/${obligation.id}`}
                            method='PATCH'
                            body={{ status: 'met' }}
                            label='Mark met'
                            variant='outline'
                            successMessage='Obligation marked as met.'
                          />
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
          basePath='/dashboard/obligations'
          params={params}
        />
      </div>
    </PageContainer>
  );
}
