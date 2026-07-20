import { handleRoute, ok } from '@/lib/api/handler';
import { requireTenant } from '@/lib/auth/require';
import { verifyAuditChain } from '@/server/services/audit';

export async function GET() {
  return handleRoute(async () => {
    const ctx = await requireTenant();
    return ok(await verifyAuditChain(ctx.organizationId));
  });
}
