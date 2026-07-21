import { NextRequest } from 'next/server';
import { handleRoute, ok } from '@/lib/api/handler';
import { requireRole } from '@/lib/auth/require';
import { runEvaluation } from '@/server/services/evaluations';

type Params = { params: Promise<{ id: string }> };

/**
 * Runs an existing evaluation again. Useful after the evals service was down:
 * the earlier attempt is recorded as an error and this retries it. runEvaluation
 * records the outcome and does not throw when the service is unavailable.
 */
export async function POST(_request: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const ctx = await requireRole('member');
    const { id } = await params;
    return ok(await runEvaluation(ctx, id));
  });
}
