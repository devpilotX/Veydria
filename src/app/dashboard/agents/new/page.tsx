import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Icons } from '@/components/icons';
import { AgentForm } from '@/features/dashboard/components/agent-form';
import { getDashboardContext } from '@/lib/auth/page';
import { listAiSystems } from '@/server/services/ai-systems';

export const metadata = { title: 'New agent' };

export default async function NewAgentPage() {
  const ctx = await getDashboardContext();
  const { items: systems } = await listAiSystems(ctx, {
    page: 1,
    pageSize: 100,
    sortBy: 'name',
    sortDir: 'asc'
  });

  return (
    <PageContainer
      pageTitle='New agent'
      pageDescription='Register an agent so you can evaluate it, monitor it, and tie its actions to a system.'
    >
      {systems.length === 0 ? (
        <EmptyState
          icon='robot'
          title='Add an AI system first'
          description='An agent belongs to an AI system, which decides what regulations apply. Create a system, then come back to add its agents.'
        />
      ) : (
        <div className='space-y-4'>
          <AgentForm systems={systems.map((system) => ({ id: system.id, name: system.name }))} />
          <Button variant='ghost' size='sm' render={<Link href='/dashboard/systems/new' />}>
            <Icons.add className='h-4 w-4' />
            Need a new system first
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
