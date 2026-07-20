import { NextRequest } from 'next/server';
import { handleRoute, ok } from '@/lib/api/handler';
import { requireRole } from '@/lib/auth/require';
import { classifyAndSaveSystem } from '@/server/services/classification';

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const ctx = await requireRole('member');
    const { id } = await params;
    return ok(await classifyAndSaveSystem(ctx, id));
  });
}
