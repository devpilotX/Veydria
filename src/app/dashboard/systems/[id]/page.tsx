import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ObligationStatusBadge, RiskBadge, SeverityBadge } from '@/components/dashboard/badges';
import { EmptyState } from '@/components/dashboard/empty-state';
import { PostActionButton } from '@/features/dashboard/components/action-button';
import { getDashboardContext } from '@/lib/auth/page';
import { getAiSystem } from '@/server/services/ai-systems';
import { listObligations } from '@/server/services/obligations';
import { listAgents } from '@/server/services/agents';
import { ApiError } from '@/lib/api/errors';

export default async function SystemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getDashboardContext();
  const { id } = await params;

  let system;
  try {
    system = await getAiSystem(ctx, id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const [{ items: obligations }, { items: agents }] = await Promise.all([
    listObligations(ctx, { page: 1, pageSize: 100, aiSystemId: id }),
    listAgents(ctx, {
      page: 1,
      pageSize: 100,
      aiSystemId: id,
      sortBy: 'createdAt',
      sortDir: 'desc'
    })
  ]);

  return (
    <PageContainer
      pageTitle={system.name}
      pageDescription={system.purpose ?? system.description ?? 'AI system'}
      pageHeaderAction={
        <PostActionButton
          url={`/api/ai-systems/${system.id}/classify`}
          label='Reclassify'
          icon='scale'
          successMessage='Classification updated.'
          variant='outline'
        />
      }
    >
      <div className='space-y-6'>
        <div className='grid gap-4 lg:grid-cols-3'>
          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle>Classification</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm'>
              <div className='flex items-center gap-3'>
                <RiskBadge tier={system.riskTier} />
                <span className='text-muted-foreground capitalize'>
                  {system.actorRole} in a {system.deploymentContext ?? 'unspecified'} setting
                </span>
              </div>
              <p className='text-muted-foreground'>
                {system.classificationRationale ??
                  'This system has not been classified yet. Run a classification to map its obligations.'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Generate documents</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col gap-2'>
              <PostActionButton
                url='/api/documents'
                body={{ type: 'risk_assessment', aiSystemId: system.id }}
                label='Risk assessment'
                icon='page'
                variant='outline'
                successMessage='Risk assessment generated.'
              />
              <PostActionButton
                url='/api/documents'
                body={{ type: 'annex_iv', aiSystemId: system.id }}
                label='Annex IV file'
                icon='page'
                variant='outline'
                successMessage='Annex IV file generated.'
              />
              <PostActionButton
                url='/api/documents'
                body={{ type: 'model_card', aiSystemId: system.id }}
                label='Model card'
                icon='page'
                variant='outline'
                successMessage='Model card generated.'
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Obligations ({obligations.length})</CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            {obligations.length === 0 ? (
              <div className='p-6'>
                <EmptyState
                  icon='checklist'
                  title='No obligations yet'
                  description='Classify this system to generate the obligations that apply.'
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Framework</TableHead>
                    <TableHead>Clause</TableHead>
                    <TableHead>Obligation</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {obligations.map((obligation) => (
                    <TableRow key={obligation.id}>
                      <TableCell className='uppercase'>
                        {obligation.regulationCode.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>{obligation.clauseRef}</TableCell>
                      <TableCell className='max-w-md'>
                        <span className='text-sm'>{obligation.title}</span>
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={obligation.severity} />
                      </TableCell>
                      <TableCell>
                        <ObligationStatusBadge status={obligation.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agents ({agents.length})</CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            {agents.length === 0 ? (
              <div className='p-6'>
                <EmptyState
                  icon='robot'
                  title='No agents connected'
                  description='Connect an agent with the SDK or add one manually to start monitoring.'
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className='font-medium'>{agent.name}</TableCell>
                      <TableCell className='capitalize'>{agent.type}</TableCell>
                      <TableCell>
                        {agent.modelProvider
                          ? `${agent.modelProvider} ${agent.modelName ?? ''}`
                          : '-'}
                      </TableCell>
                      <TableCell className='capitalize'>{agent.status}</TableCell>
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
