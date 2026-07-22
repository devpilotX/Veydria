import { NextRequest } from 'next/server';
import { created, handleRoute, ok, readJsonBody } from '@/lib/api/handler';
import { requireRole, requireTenant } from '@/lib/auth/require';
import { enforceRateLimit } from '@/lib/api/rate-limit';
import {
  createEvaluation,
  createEvaluationSchema,
  listEvaluations,
  listEvaluationsSchema
} from '@/server/services/evaluations';
import { assertMonthlyAction } from '@/server/services/usage';

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
    enforceRateLimit(`evaluate:${ctx.organizationId}`, 30, 60_000);
    await assertMonthlyAction(ctx, 'evaluate');
    const input = createEvaluationSchema.parse(await readJsonBody(request));
    return created(await createEvaluation(ctx, input));
  });
}
