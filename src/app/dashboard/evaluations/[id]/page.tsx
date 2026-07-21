import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { EvaluationStatusBadge } from '@/components/dashboard/badges';
import { PostActionButton } from '@/features/dashboard/components/action-button';
import { getDashboardContext } from '@/lib/auth/page';
import { getAgent } from '@/server/services/agents';
import { getEvaluation } from '@/server/services/evaluations';
import { ApiError } from '@/lib/api/errors';

function readDimensions(details: Record<string, unknown> | null): Record<string, number> | null {
  if (!details || typeof details.dimensions !== 'object' || details.dimensions === null) {
    return null;
  }
  const entries = Object.entries(details.dimensions as Record<string, unknown>).filter(
    ([, value]) => typeof value === 'number'
  ) as [string, number][];
  return entries.length ? Object.fromEntries(entries) : null;
}

export default async function EvaluationDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getDashboardContext();
  const { id } = await params;

  let evaluation;
  try {
    evaluation = await getEvaluation(ctx, id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const agent = await getAgent(ctx, evaluation.agentId).catch(() => null);
  const dimensions = readDimensions(evaluation.details);
  const ranAt = evaluation.completedAt ?? evaluation.startedAt ?? evaluation.createdAt;

  return (
    <PageContainer
      pageTitle={`${evaluation.type.replace(/_/g, ' ')} evaluation`}
      pageDescription={agent ? `Agent: ${agent.name}` : 'Evaluation'}
      pageHeaderAction={
        <PostActionButton
          url={`/api/evaluations/${evaluation.id}/run`}
          label='Run again'
          icon='gauge'
          successMessage='Evaluation run again.'
          variant='outline'
        />
      }
    >
      <div className='space-y-6'>
        {evaluation.status === 'error' ? (
          <Alert variant='destructive'>
            <AlertTitle>This run could not finish</AlertTitle>
            <AlertDescription>
              {evaluation.summary ??
                'The evaluation service was unavailable. The attempt is recorded. Try running it again.'}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className='grid gap-4 lg:grid-cols-3'>
          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center gap-3'>
                <EvaluationStatusBadge status={evaluation.status} />
                {agent ? (
                  <Link
                    href={`/dashboard/agents/${agent.id}`}
                    className='text-muted-foreground hover:text-primary text-sm'
                  >
                    {agent.name}
                  </Link>
                ) : null}
              </div>

              {evaluation.score === null ? (
                <p className='text-muted-foreground text-sm'>
                  No score yet. The run has not produced a result.
                </p>
              ) : (
                <div className='space-y-2'>
                  <div className='flex items-end justify-between'>
                    <span className='text-3xl font-semibold'>{Math.round(evaluation.score)}</span>
                    <span className='text-muted-foreground text-sm'>
                      Pass mark {evaluation.threshold}
                    </span>
                  </div>
                  <Progress value={Math.max(0, Math.min(100, evaluation.score))} />
                </div>
              )}

              {evaluation.summary && evaluation.status !== 'error' ? (
                <p className='text-sm'>{evaluation.summary}</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Run details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className='space-y-3 text-sm'>
                <div className='flex justify-between gap-4'>
                  <dt className='text-muted-foreground'>Type</dt>
                  <dd className='capitalize'>{evaluation.type.replace(/_/g, ' ')}</dd>
                </div>
                <div className='flex justify-between gap-4'>
                  <dt className='text-muted-foreground'>Passed</dt>
                  <dd>{evaluation.passed === null ? '-' : evaluation.passed ? 'Yes' : 'No'}</dd>
                </div>
                <div className='flex justify-between gap-4'>
                  <dt className='text-muted-foreground'>Model</dt>
                  <dd>{evaluation.modelUsed ?? '-'}</dd>
                </div>
                <div className='flex justify-between gap-4'>
                  <dt className='text-muted-foreground'>Ran</dt>
                  <dd>{new Date(ranAt).toLocaleString()}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {dimensions ? (
          <Card>
            <CardHeader>
              <CardTitle>Score breakdown</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {Object.entries(dimensions).map(([name, value]) => (
                <div key={name} className='space-y-1'>
                  <div className='flex justify-between text-sm'>
                    <span className='capitalize'>{name.replace(/_/g, ' ')}</span>
                    <span className='text-muted-foreground'>{Math.round(value)}</span>
                  </div>
                  <Progress value={Math.max(0, Math.min(100, value))} />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Results ({evaluation.cases.length})</CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            {evaluation.cases.length === 0 ? (
              <p className='text-muted-foreground p-6 text-sm'>
                No case level detail for this run.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Probe</TableHead>
                    <TableHead>Output</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluation.cases.map((testCase) => (
                    <TableRow key={testCase.id}>
                      <TableCell className='max-w-xs'>
                        <span className='text-sm'>{testCase.input}</span>
                        {testCase.rationale ? (
                          <p className='text-muted-foreground mt-1 text-xs'>{testCase.rationale}</p>
                        ) : null}
                      </TableCell>
                      <TableCell className='text-muted-foreground max-w-xs text-sm'>
                        {testCase.output ?? '-'}
                      </TableCell>
                      <TableCell>
                        {testCase.score === null ? '-' : Math.round(testCase.score)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            testCase.passed
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }
                        >
                          {testCase.passed ? 'Pass' : 'Fail'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
