import { NextRequest } from 'next/server';
import { handleRoute, ok } from '@/lib/api/handler';
import { requireTenant } from '@/lib/auth/require';
import { listEvents, listEventsSchema } from '@/server/services/monitoring';

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const ctx = await requireTenant();
    const input = listEventsSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );
    return ok(await listEvents(ctx, input));
  });
}
