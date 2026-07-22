import { NextRequest } from 'next/server';
import { handleRoute, ok, readJsonBody } from '@/lib/api/handler';
import { requireRole, requireTenant } from '@/lib/auth/require';
import { deleteAgent, getAgent, updateAgent, updateAgentSchema } from '@/server/services/agents';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const ctx = await requireTenant();
    const { id } = await params;
    return ok(await getAgent(ctx, id));
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const ctx = await requireRole('member');
    const { id } = await params;
    const input = updateAgentSchema.parse(await readJsonBody(request));
    return ok(await updateAgent(ctx, id, input));
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const ctx = await requireRole('admin');
    const { id } = await params;
    await deleteAgent(ctx, id);
    return ok({ deleted: true });
  });
}
