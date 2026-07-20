import { NextRequest } from 'next/server';
import { handleRoute, ok } from '@/lib/api/handler';
import { requireRole } from '@/lib/auth/require';
import { revokeApiKey } from '@/server/services/api-keys';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const ctx = await requireRole('admin');
    const { id } = await params;
    await revokeApiKey(ctx, id);
    return ok({ revoked: true });
  });
}
