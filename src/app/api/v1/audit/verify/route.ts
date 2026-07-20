import { NextRequest } from 'next/server';
import { handleRoute, ok } from '@/lib/api/handler';
import { unauthorized } from '@/lib/api/errors';
import { resolveApiKey } from '@/lib/auth/api-key';
import { verifyAuditChain } from '@/server/services/audit';

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const key = await resolveApiKey(request);
    if (!key) throw unauthorized('A valid API key is required.');
    return ok(await verifyAuditChain(key.organizationId));
  });
}
