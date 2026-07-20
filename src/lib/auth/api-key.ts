import { createHash, randomBytes } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { apiKeys } from '@/db/schema';

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/** Mints a new key. Only the plaintext is ever shown to the user, once. */
export function generateApiKey(): { plaintext: string; prefix: string; hash: string } {
  const raw = randomBytes(24).toString('base64url');
  const plaintext = `ap_live_${raw}`;
  return { plaintext, prefix: plaintext.slice(0, 12), hash: hashApiKey(plaintext) };
}

function readToken(request: Request): string | null {
  const header = request.headers.get('authorization') ?? '';
  if (header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim();
  }
  const alt = request.headers.get('x-api-key');
  return alt ? alt.trim() : null;
}

/** Resolves the organization behind an API key, or null if the key is invalid. */
export async function resolveApiKey(
  request: Request
): Promise<{ organizationId: string; apiKeyId: string; keyPrefix: string } | null> {
  const token = readToken(request);
  if (!token) return null;

  const row = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.keyHash, hashApiKey(token)), isNull(apiKeys.revokedAt))
  });
  if (!row) return null;

  // Record use without blocking the caller on the result.
  void db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, row.id));

  return { organizationId: row.organizationId, apiKeyId: row.id, keyPrefix: row.keyPrefix };
}
