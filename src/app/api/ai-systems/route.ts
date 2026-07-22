import { NextRequest } from 'next/server';
import { created, handleRoute, ok, readJsonBody } from '@/lib/api/handler';
import { requireRole, requireTenant } from '@/lib/auth/require';
import {
  createAiSystemSchema,
  listAiSystems,
  listAiSystemsSchema
} from '@/server/services/ai-systems';
import { createAndClassifyAiSystem } from '@/server/services/classification';

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
    const input = createAiSystemSchema.parse(await readJsonBody(request));
    // Create and classify in one transaction so a system never lands without
    // its risk tier and obligations. Any failure surfaces to the caller.
    return created(await createAndClassifyAiSystem(ctx, input));
  });
}
