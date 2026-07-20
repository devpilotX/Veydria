import { NextRequest } from 'next/server';
import { handleRoute, ok } from '@/lib/api/handler';
import { requireTenant } from '@/lib/auth/require';
import { getEvaluation } from '@/server/services/evaluations';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const ctx = await requireTenant();
    const { id } = await params;
    return ok(await getEvaluation(ctx, id));
  });
}
