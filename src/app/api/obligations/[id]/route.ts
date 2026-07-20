import { NextRequest } from 'next/server';
import { handleRoute, ok } from '@/lib/api/handler';
import { requireRole } from '@/lib/auth/require';
import { updateObligation, updateObligationSchema } from '@/server/services/obligations';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const ctx = await requireRole('member');
    const { id } = await params;
    const input = updateObligationSchema.parse(await request.json());
    return ok(await updateObligation(ctx, id, input));
  });
}
