import { NextRequest } from 'next/server';
import { handleRoute, ok } from '@/lib/api/handler';
import { requireRole } from '@/lib/auth/require';
import { enforceRateLimit } from '@/lib/api/rate-limit';
import { classifyAndSaveSystem } from '@/server/services/classification';
import { assertMonthlyAction } from '@/server/services/usage';

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const ctx = await requireRole('member');
    enforceRateLimit(`classify:${ctx.organizationId}`, 60, 60_000);
    await assertMonthlyAction(ctx, 'classify');
    const { id } = await params;
    return ok(await classifyAndSaveSystem(ctx, id));
  });
}
