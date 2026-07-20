import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import type { TenantContext } from '@/lib/auth/tenant';
import { notFound } from '@/lib/api/errors';
import { generateApiKey } from '@/lib/auth/api-key';
import { appendAuditLog } from './audit';

export const createApiKeySchema = z.object({
  name: z.string().min(2).max(120),
  scopes: z.array(z.enum(['ingest', 'read'])).default(['ingest', 'read'])
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

export async function listApiKeys(ctx: TenantContext) {
  return db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      scopes: apiKeys.scopes,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
      createdAt: apiKeys.createdAt
    })
    .from(apiKeys)
    .where(eq(apiKeys.organizationId, ctx.organizationId))
    .orderBy(desc(apiKeys.createdAt));
}

/** Creates a key and returns the plaintext once. It is never stored or shown again. */
export async function createApiKey(ctx: TenantContext, input: CreateApiKeyInput) {
  const { plaintext, prefix, hash } = generateApiKey();
  const [row] = await db
    .insert(apiKeys)
    .values({
      organizationId: ctx.organizationId,
      name: input.name,
      keyPrefix: prefix,
      keyHash: hash,
      scopes: input.scopes,
      createdByUserId: ctx.userId
    })
    .returning({ id: apiKeys.id, name: apiKeys.name, keyPrefix: apiKeys.keyPrefix });

  await appendAuditLog({
    organizationId: ctx.organizationId,
    actorType: ctx.userId ? 'user' : 'system',
    actorId: ctx.clerkUserId,
    action: 'api_key.created',
    resourceType: 'api_key',
    resourceId: row.id,
    data: { name: row.name }
  });

  return { ...row, plaintext };
}

export async function revokeApiKey(ctx: TenantContext, id: string) {
  const existing = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.id, id), eq(apiKeys.organizationId, ctx.organizationId))
  });
  if (!existing) throw notFound('That API key does not exist.');

  await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.organizationId, ctx.organizationId)));

  await appendAuditLog({
    organizationId: ctx.organizationId,
    actorType: ctx.userId ? 'user' : 'system',
    actorId: ctx.clerkUserId,
    action: 'api_key.revoked',
    resourceType: 'api_key',
    resourceId: id,
    data: null
  });
}
