import { NextRequest } from 'next/server';
import { created, handleRoute, ok, readJsonBody } from '@/lib/api/handler';
import { requireRole, requireTenant } from '@/lib/auth/require';
import {
  createAgent,
  createAgentSchema,
  listAgents,
  listAgentsSchema
} from '@/server/services/agents';

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const ctx = await requireTenant();
    const input = listAgentsSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );
    return ok(await listAgents(ctx, input));
  });
}

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const ctx = await requireRole('member');
    const input = createAgentSchema.parse(await readJsonBody(request));
    return created(await createAgent(ctx, input));
  });
}
