import { NextRequest } from 'next/server';
import { created, handleRoute, ok } from '@/lib/api/handler';
import { requireRole, requireTenant } from '@/lib/auth/require';
import {
  createAiSystem,
  createAiSystemSchema,
  listAiSystems,
  listAiSystemsSchema
} from '@/server/services/ai-systems';

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const ctx = await requireTenant();
    const input = listAiSystemsSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );
    return ok(await listAiSystems(ctx, input));
  });
}

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const ctx = await requireRole('member');
    const input = createAiSystemSchema.parse(await request.json());
    return created(await createAiSystem(ctx, input));
  });
}
