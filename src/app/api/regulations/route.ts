import { NextRequest } from 'next/server';
import { handleRoute, ok } from '@/lib/api/handler';
import { requireTenant } from '@/lib/auth/require';
import { listRegulations, searchClauses, searchClausesSchema } from '@/server/services/regulations';

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    await requireTenant();
    const q = request.nextUrl.searchParams.get('q');
    if (q) {
      const input = searchClausesSchema.parse(
        Object.fromEntries(request.nextUrl.searchParams.entries())
      );
      return ok({ results: await searchClauses(input) });
    }
    return ok({ regulations: await listRegulations() });
  });
}
