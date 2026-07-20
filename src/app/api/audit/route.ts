import { NextRequest } from 'next/server';
import { handleRoute, ok } from '@/lib/api/handler';
import { requireTenant } from '@/lib/auth/require';
import { paginationSchema } from '@/server/services/shared';
import { listAuditLog } from '@/server/services/audit';

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const ctx = await requireTenant();
    const { page, pageSize } = paginationSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );
    return ok(await listAuditLog(ctx.organizationId, page, pageSize));
  });
}
