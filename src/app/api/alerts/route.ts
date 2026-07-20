import { NextRequest } from 'next/server';
import { handleRoute, ok } from '@/lib/api/handler';
import { requireTenant } from '@/lib/auth/require';
import { listAlerts, listAlertsSchema } from '@/server/services/alerts';

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const ctx = await requireTenant();
    const input = listAlertsSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );
    return ok(await listAlerts(ctx, input));
  });
}
