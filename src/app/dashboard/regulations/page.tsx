import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDashboardContext } from '@/lib/auth/page';
import { listRegulations, searchClauses } from '@/server/services/regulations';

export const metadata = { title: 'Regulations' };

export default async function RegulationsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await getDashboardContext();
  const params = await searchParams;
  const query = params.q?.trim();

  const regulations = await listRegulations();
  const results = query && query.length >= 2 ? await searchClauses({ q: query, limit: 8 }) : [];

  return (
    <PageContainer
      pageTitle='Regulations'
      pageDescription='The frameworks we track and a search across their clauses by meaning.'
    >
      <div className='space-y-6'>
        <div className='grid gap-4 sm:grid-cols-3'>
          {regulations.map((reg) => (
            <Card key={reg.id}>
              <CardHeader className='pb-2'>
                <CardTitle className='text-base'>{reg.name}</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <p className='text-muted-foreground text-sm'>{reg.summary}</p>
                <div className='flex items-center gap-2 text-xs'>
                  <Badge variant='outline'>{reg.jurisdiction}</Badge>
                  <span className='text-muted-foreground'>{reg.clauseCount} clauses</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search the knowledge base</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <form className='flex gap-2'>
              <input
                name='q'
                defaultValue={query ?? ''}
                placeholder='For example: human oversight for high risk systems'
                className='border-input bg-background h-9 flex-1 rounded-md border px-3 text-sm'
              />
              <button
                type='submit'
                className='bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-4 text-sm'
              >
                Search
              </button>
            </form>

            {query && results.length === 0 && (
              <p className='text-muted-foreground text-sm'>No clauses matched that search.</p>
            )}

            <div className='divide-border divide-y'>
              {results.map((clause) => (
                <div key={clause.id} className='py-3'>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='uppercase'>
                      {clause.code.replace(/_/g, ' ')}
                    </Badge>
                    <span className='text-sm font-medium'>
                      {clause.ref}: {clause.title}
                    </span>
                  </div>
                  <p className='text-muted-foreground mt-1 text-sm'>{clause.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
