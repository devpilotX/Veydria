import { NextRequest } from 'next/server';
import { handleRoute, ok } from '@/lib/api/handler';
import { unauthorized } from '@/lib/api/errors';
import { resolveApiKey } from '@/lib/auth/api-key';
import { apiKeyContext } from '@/lib/auth/tenant';
import { listObligations, listObligationsSchema } from '@/server/services/obligations';

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const key = await resolveApiKey(request);
    if (!key) throw unauthorized('A valid API key is required.');
    const ctx = apiKeyContext(key.organizationId);
    const input = listObligationsSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );
    return ok(await listObligations(ctx, input));
  });
}
