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
import { EmptyState, Pagination } from '@/components/dashboard/empty-state';
import { Icons } from '@/components/icons';
import { getDashboardContext } from '@/lib/auth/page';
import { listAgents, listAgentsSchema } from '@/server/services/agents';

export const metadata = { title: 'Agents' };

function since(date: Date | null): string {
  if (!date) return 'never';
  const hours = Math.round((Date.now() - new Date(date).getTime()) / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default async function AgentsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await getDashboardContext();
  const params = await searchParams;
  const input = listAgentsSchema.parse({ page: params.page, search: params.search });
  const { items, page, pageCount } = await listAgents(ctx, input);

  return (
    <PageContainer
      pageTitle='Agents'
      pageDescription='Every agent connected through the SDK, the MCP server, or added by hand.'
      pageHeaderAction={
        <Button render={<Link href='/dashboard/agents/new' />}>
          <Icons.add className='h-4 w-4' />
          New agent
        </Button>
      }
    >
      <div className='space-y-4'>
        <form className='flex flex-wrap items-center gap-2'>
          <input
            name='search'
            defaultValue={params.search ?? ''}
            placeholder='Search agents'
            className='border-input bg-background h-9 w-56 rounded-md border px-3 text-sm'
          />
        </form>
        {items.length === 0 ? (
          <EmptyState
            icon='robot'
            title='No agents yet'
            description='Add your first agent with the New agent button, or connect one through the TypeScript SDK or the MCP server.'
          />
        ) : (
          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className='font-medium'>
                        <Link
                          href={`/dashboard/agents/${agent.id}`}
                          className='hover:text-primary font-medium'
                        >
                          {agent.name}
                        </Link>
                      </TableCell>
                      <TableCell className='capitalize'>{agent.type}</TableCell>
                      <TableCell>
                        {agent.modelProvider
                          ? `${agent.modelProvider} ${agent.modelName ?? ''}`
                          : '-'}
                      </TableCell>
                      <TableCell className='capitalize'>{agent.status}</TableCell>
                      <TableCell className='text-muted-foreground'>
                        {since(agent.lastSeenAt)}
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
          basePath='/dashboard/agents'
          params={params}
        />
      </div>
    </PageContainer>
  );
}
