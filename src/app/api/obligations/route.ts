import { NextRequest } from 'next/server';
import { handleRoute, ok } from '@/lib/api/handler';
import { requireTenant } from '@/lib/auth/require';
import { listObligations, listObligationsSchema } from '@/server/services/obligations';

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const ctx = await requireTenant();
    const input = listObligationsSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );
    return ok(await listObligations(ctx, input));
  });
}
