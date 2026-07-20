import { NextRequest } from 'next/server';
import { handleRoute, ok } from '@/lib/api/handler';
import { unauthorized } from '@/lib/api/errors';
import { resolveApiKey } from '@/lib/auth/api-key';
import { ingestBatchSchema, ingestEvents } from '@/server/services/monitoring';

/**
 * Ingestion endpoint for the TypeScript SDK and the MCP server. Authenticated
 * with an organization API key, not a user session.
 */
export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const key = await resolveApiKey(request);
    if (!key) throw unauthorized('A valid API key is required.');
    const input = ingestBatchSchema.parse(await request.json());
    return ok(await ingestEvents(key.organizationId, input));
  });
}
