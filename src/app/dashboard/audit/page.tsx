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
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { EmptyState, Pagination } from '@/components/dashboard/empty-state';
import { PostActionButton } from '@/features/dashboard/components/action-button';
import { getDashboardContext } from '@/lib/auth/page';
import { listAuditLog, verifyAuditChain } from '@/server/services/audit';
import { paginationSchema } from '@/server/services/shared';

export const metadata = { title: 'Audit log' };

export default async function AuditPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await getDashboardContext();
  const params = await searchParams;
  const { page, pageSize } = paginationSchema.parse({ page: params.page, pageSize: 20 });
  const [{ items, total }, chain] = await Promise.all([
    listAuditLog(ctx.organizationId, page, pageSize),
    verifyAuditChain(ctx.organizationId)
  ]);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <PageContainer
      pageTitle='Audit log'
      pageDescription='An append only, hash chained record of everything that happens in your workspace.'
      pageHeaderAction={
        <PostActionButton
          url='/api/audit/verify'
          method='POST'
          label='Re-verify'
          icon='fingerprint'
          variant='outline'
          successMessage='Chain re-verified.'
        />
      }
    >
      <div className='space-y-4'>
        <Card>
          <CardContent className='flex items-center gap-3 pt-6'>
            {chain.valid ? (
              <>
                <span className='flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10'>
                  <Icons.check className='h-5 w-5 text-emerald-600 dark:text-emerald-400' />
                </span>
                <div>
                  <p className='font-medium'>The chain is intact</p>
                  <p className='text-muted-foreground text-sm'>
                    All {chain.checked} entries verified. No record has been altered.
                  </p>
                </div>
              </>
            ) : (
              <>
                <span className='flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10'>
                  <Icons.warning className='h-5 w-5 text-red-600 dark:text-red-400' />
                </span>
                <div>
                  <p className='font-medium'>The chain failed verification</p>
                  <p className='text-muted-foreground text-sm'>
                    Break at entry {chain.brokenAtSeq}. {chain.reason}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {items.length === 0 ? (
          <EmptyState
            icon='fingerprint'
            title='No entries yet'
            description='Actions in your workspace will be recorded here.'
          />
        ) : (
          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seq</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className='text-muted-foreground'>{entry.seq}</TableCell>
                      <TableCell>
                        <Badge variant='outline'>{entry.action}</Badge>
                      </TableCell>
                      <TableCell>{entry.actorLabel ?? entry.actorType}</TableCell>
                      <TableCell className='text-muted-foreground'>
                        {new Date(entry.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        <Pagination page={page} pageCount={pageCount} basePath='/dashboard/audit' params={params} />
      </div>
    </PageContainer>
  );
}
