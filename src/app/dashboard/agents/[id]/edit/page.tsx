import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { AgentForm } from '@/features/dashboard/components/agent-form';
import { getDashboardContext } from '@/lib/auth/page';
import { getAgent } from '@/server/services/agents';
import { listAiSystems } from '@/server/services/ai-systems';
import { ApiError } from '@/lib/api/errors';

export const metadata = { title: 'Edit agent' };

export default async function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getDashboardContext();
  const { id } = await params;

  let agent;
  try {
    agent = await getAgent(ctx, id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const { items: systems } = await listAiSystems(ctx, {
    page: 1,
    pageSize: 100,
    sortBy: 'name',
    sortDir: 'asc'
  });

  return (
    <PageContainer
      pageTitle={`Edit ${agent.name}`}
      pageDescription='Update the agent details, model, linked system, or status.'
    >
      <AgentForm
        systems={systems.map((system) => ({ id: system.id, name: system.name }))}
        agent={{
          id: agent.id,
          aiSystemId: agent.aiSystemId,
          name: agent.name,
          description: agent.description,
          type: agent.type,
          modelProvider: agent.modelProvider,
          modelName: agent.modelName,
          systemPrompt: agent.systemPrompt,
          externalId: agent.externalId,
          status: agent.status
        }}
      />
    </PageContainer>
  );
}
