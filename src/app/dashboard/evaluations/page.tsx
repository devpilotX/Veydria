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
import { EvaluationStatusBadge } from '@/components/dashboard/badges';
import { EmptyState, Pagination } from '@/components/dashboard/empty-state';
import { Icons } from '@/components/icons';
import { getDashboardContext } from '@/lib/auth/page';
import { listEvaluations, listEvaluationsSchema } from '@/server/services/evaluations';

export const metadata = { title: 'Evaluations' };

const typeOptions = ['', 'bias', 'hallucination', 'prompt_injection', 'safety', 'policy'];

export default async function EvaluationsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await getDashboardContext();
  const params = await searchParams;
  const input = listEvaluationsSchema.parse({ page: params.page, type: params.type || undefined });
  const { items, page, pageCount } = await listEvaluations(ctx, input);

  return (
    <PageContainer
      pageTitle='Evaluations'
      pageDescription='Automated tests for bias, hallucination, prompt injection, safety, and policy.'
      pageHeaderAction={
        <Button render={<Link href='/dashboard/evaluations/new' />}>
          <Icons.gauge className='h-4 w-4' />
          Run evaluation
        </Button>
      }
    >
      <div className='space-y-4'>
        <form className='flex flex-wrap items-center gap-2'>
          <select
            name='type'
            defaultValue={params.type ?? ''}
            className='border-input bg-background h-9 rounded-md border px-3 text-sm capitalize'
          >
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option === '' ? 'All types' : option.replace(/_/g, ' ')}
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
            icon='gauge'
            title='No evaluations yet'
            description='Run an evaluation on an agent to score it and track the result over time.'
          />
        ) : (
          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ran</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell className='font-medium capitalize'>
                        <Link
                          href={`/dashboard/evaluations/${evaluation.id}`}
                          className='hover:text-primary'
                        >
                          {evaluation.type.replace(/_/g, ' ')}
                        </Link>
                      </TableCell>
                      <TableCell>{evaluation.score ?? '-'}</TableCell>
                      <TableCell className='text-muted-foreground'>
                        {evaluation.threshold}
                      </TableCell>
                      <TableCell>
                        <EvaluationStatusBadge status={evaluation.status} />
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {evaluation.completedAt
                          ? new Date(evaluation.completedAt).toLocaleDateString()
                          : 'pending'}
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
          basePath='/dashboard/evaluations'
          params={params}
        />
      </div>
    </PageContainer>
  );
}
