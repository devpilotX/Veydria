import { NextRequest } from 'next/server';
import { handleRoute, ok, readJsonBody } from '@/lib/api/handler';
import { rateLimited, unauthorized } from '@/lib/api/errors';
import { rateLimit } from '@/lib/api/rate-limit';
import { resolveApiKey } from '@/lib/auth/api-key';
import { apiKeyContext } from '@/lib/auth/tenant';
import { ingestBatchSchema, ingestEvents } from '@/server/services/monitoring';
import { assertMonitoringQuota } from '@/server/services/usage';

/**
 * Ingestion endpoint for the TypeScript SDK and the MCP server. Authenticated
 * with an organization API key, not a user session, and rate limited per key.
 */
export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const key = await resolveApiKey(request);
    if (!key) throw unauthorized('A valid API key is required.');

    const limit = rateLimit(`ingest:${key.apiKeyId}`, 600, 60_000);
    if (!limit.allowed) {
      throw rateLimited('You are sending events too fast. Try again in a moment.');
    }

    const input = ingestBatchSchema.parse(await readJsonBody(request));
    // Hard safety cap: the org plan's monthly monitoring event quota.
    await assertMonitoringQuota(apiKeyContext(key.organizationId), input.events.length);
    return ok(await ingestEvents(key.organizationId, input));
  });
}
