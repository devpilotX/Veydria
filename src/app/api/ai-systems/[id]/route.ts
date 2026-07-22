import { NextRequest } from 'next/server';
import { handleRoute, ok, readJsonBody } from '@/lib/api/handler';
import { requireRole, requireTenant } from '@/lib/auth/require';
import {
  deleteAiSystem,
  getAiSystem,
  updateAiSystem,
  updateAiSystemSchema
} from '@/server/services/ai-systems';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const ctx = await requireTenant();
    const { id } = await params;
    return ok(await getAiSystem(ctx, id));
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const ctx = await requireRole('member');
    const { id } = await params;
    const input = updateAiSystemSchema.parse(await readJsonBody(request));
    return ok(await updateAiSystem(ctx, id, input));
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const ctx = await requireRole('admin');
    const { id } = await params;
    await deleteAiSystem(ctx, id);
    return ok({ deleted: true });
  });
}
