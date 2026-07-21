import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/dashboard/empty-state';
import { RunEvaluationForm } from '@/features/dashboard/components/run-evaluation-form';
import { getDashboardContext } from '@/lib/auth/page';
import { listAgents } from '@/server/services/agents';

export const metadata = { title: 'Run evaluation' };

export default async function NewEvaluationPage() {
  const ctx = await getDashboardContext();
  const { items: agents } = await listAgents(ctx, {
    page: 1,
    pageSize: 100,
    sortBy: 'name',
    sortDir: 'asc'
  });

  return (
    <PageContainer
      pageTitle='Run evaluation'
      pageDescription='Score an agent for bias, hallucination, prompt injection, safety, or policy.'
    >
      {agents.length === 0 ? (
        <EmptyState
          icon='gauge'
          title='Add an agent first'
          description='Evaluations run against an agent. Add an agent, then come back to run its first evaluation.'
        />
      ) : (
        <Card>
          <CardContent className='space-y-3 pt-6'>
            <RunEvaluationForm
              agents={agents.map((agent) => ({ id: agent.id, name: agent.name }))}
            />
            <p className='text-muted-foreground text-sm'>
              The run scores the agent on the evaluation service. If the service is not reachable,
              the attempt is still recorded and you can run it again.
            </p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
