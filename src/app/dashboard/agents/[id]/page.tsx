import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { DeleteAgentButton } from '@/features/dashboard/components/delete-agent-button';
import { getDashboardContext } from '@/lib/auth/page';
import { getAgent } from '@/server/services/agents';
import { getAiSystem } from '@/server/services/ai-systems';
import { ApiError } from '@/lib/api/errors';

function since(date: Date | null): string {
  if (!date) return 'never';
  const hours = Math.round((Date.now() - new Date(date).getTime()) / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getDashboardContext();
  const { id } = await params;

  let agent;
  try {
    agent = await getAgent(ctx, id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const system = await getAiSystem(ctx, agent.aiSystemId).catch(() => null);

  const model = agent.modelProvider
    ? `${agent.modelProvider} ${agent.modelName ?? ''}`.trim()
    : 'Not set';

  return (
    <PageContainer
      pageTitle={agent.name}
      pageDescription={agent.description ?? 'Agent'}
      pageHeaderAction={
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            render={<Link href={`/dashboard/agents/${agent.id}/edit`} />}
          >
            <Icons.edit className='h-4 w-4' />
            Edit
          </Button>
          <DeleteAgentButton agentId={agent.id} agentName={agent.name} />
        </div>
      }
    >
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className='grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2'>
              <div>
                <dt className='text-muted-foreground'>AI system</dt>
                <dd className='mt-0.5'>
                  {system ? (
                    <Link
                      href={`/dashboard/systems/${system.id}`}
                      className='hover:text-primary font-medium'
                    >
                      {system.name}
                    </Link>
                  ) : (
                    <span className='text-muted-foreground'>Not linked</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>Type</dt>
                <dd className='mt-0.5 capitalize'>{agent.type}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>Model</dt>
                <dd className='mt-0.5'>{model}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>Status</dt>
                <dd className='mt-0.5 capitalize'>{agent.status}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>External ID</dt>
                <dd className='mt-0.5'>{agent.externalId ?? '-'}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>Last seen</dt>
                <dd className='mt-0.5'>{since(agent.lastSeenAt)}</dd>
              </div>
            </dl>
            {agent.systemPrompt ? (
              <div className='mt-6'>
                <p className='text-muted-foreground text-sm'>System prompt</p>
                <p className='bg-muted mt-1 rounded-md p-3 text-sm whitespace-pre-wrap'>
                  {agent.systemPrompt}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
