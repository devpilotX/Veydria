import { NextRequest } from 'next/server';
import { created, handleRoute, ok } from '@/lib/api/handler';
import { requireRole, requireTenant } from '@/lib/auth/require';
import {
  createEvaluation,
  createEvaluationSchema,
  listEvaluations,
  listEvaluationsSchema
} from '@/server/services/evaluations';

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const ctx = await requireTenant();
    const input = listEvaluationsSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );
    return ok(await listEvaluations(ctx, input));
  });
}

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const ctx = await requireRole('member');
    const input = createEvaluationSchema.parse(await request.json());
    return created(await createEvaluation(ctx, input));
  });
}
