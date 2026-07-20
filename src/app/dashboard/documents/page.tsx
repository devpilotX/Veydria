import Link from 'next/link';
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
import { Badge } from '@/components/ui/badge';
import { EmptyState, Pagination } from '@/components/dashboard/empty-state';
import { PostActionButton } from '@/features/dashboard/components/action-button';
import { getDashboardContext } from '@/lib/auth/page';
import { listDocuments, listDocumentsSchema } from '@/server/services/documents';

export const metadata = { title: 'Documents' };

const typeLabel: Record<string, string> = {
  risk_assessment: 'Risk assessment',
  annex_iv: 'Annex IV file',
  model_card: 'Model card',
  audit_report: 'Audit report',
  dpia: 'DPIA',
  conformity_declaration: 'Conformity declaration'
};

export default async function DocumentsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await getDashboardContext();
  const params = await searchParams;
  const input = listDocumentsSchema.parse({ page: params.page });
  const { items, page, pageCount } = await listDocuments(ctx, input);

  return (
    <PageContainer
      pageTitle='Documents'
      pageDescription='The evidence auditors ask for, generated from your live data.'
      pageHeaderAction={
        <PostActionButton
          url='/api/documents'
          body={{ type: 'audit_report' }}
          label='Generate audit report'
          icon='page'
          successMessage='Audit report generated.'
        />
      }
    >
      <div className='space-y-4'>
        {items.length === 0 ? (
          <EmptyState
            icon='page'
            title='No documents yet'
            description='Generate a risk assessment or audit report to keep evidence ready.'
          />
        ) : (
          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/documents/${doc.id}`}
                          className='hover:text-primary font-medium'
                        >
                          {doc.title}
                        </Link>
                      </TableCell>
                      <TableCell>{typeLabel[doc.type] ?? doc.type}</TableCell>
                      <TableCell className='text-muted-foreground'>v{doc.version}</TableCell>
                      <TableCell>
                        <Badge variant='outline' className='capitalize'>
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {new Date(doc.updatedAt).toLocaleDateString()}
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
          basePath='/dashboard/documents'
          params={params}
        />
      </div>
    </PageContainer>
  );
}
