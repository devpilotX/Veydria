import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { PostActionButton } from '@/features/dashboard/components/action-button';
import { getDashboardContext } from '@/lib/auth/page';
import { getDocument } from '@/server/services/documents';
import { ApiError } from '@/lib/api/errors';

export default async function DocumentViewPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getDashboardContext();
  const { id } = await params;

  let doc;
  try {
    doc = await getDocument(ctx, id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <PageContainer
      pageTitle={doc.title}
      pageDescription={`Version ${doc.version}, ${doc.status}`}
      pageHeaderAction={
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' render={<Link href='/dashboard/documents' />}>
            <Icons.chevronLeft className='h-4 w-4' />
            Back
          </Button>
          {doc.status !== 'final' && (
            <PostActionButton
              url={`/api/documents/${doc.id}`}
              method='PATCH'
              body={{ status: 'final' }}
              label='Mark final'
              successMessage='Document marked final.'
            />
          )}
        </div>
      }
    >
      <Card>
        <CardContent className='pt-6'>
          <div className='mx-auto max-w-3xl leading-7 whitespace-pre-wrap'>{doc.content}</div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
