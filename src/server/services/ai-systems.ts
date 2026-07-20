import { and, asc, count, desc, eq, ilike } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { aiSystems } from '@/db/schema';
import type { TenantContext } from '@/lib/auth/tenant';
import { notFound } from '@/lib/api/errors';
import { appendAuditLog } from './audit';
import { paginated, paginationSchema, pageOffset, sortDir } from './shared';

const riskTierEnum = z.enum(['prohibited', 'high', 'limited', 'minimal', 'unknown']);
const lifecycleEnum = z.enum(['development', 'staging', 'production', 'retired']);
const statusEnum = z.enum(['draft', 'active', 'archived']);

export const createAiSystemSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  purpose: z.string().max(2000).optional(),
  domain: z.string().max(120).optional(),
  deploymentContext: z.string().max(120).optional(),
  actorRole: z.enum(['provider', 'deployer', 'importer', 'distributor']).default('provider'),
  lifecycle: lifecycleEnum.default('development'),
  ownerName: z.string().max(200).optional(),
  ownerEmail: z.string().email().optional()
});

export const updateAiSystemSchema = createAiSystemSchema.partial().extend({
  status: statusEnum.optional()
});

export const listAiSystemsSchema = paginationSchema.extend({
  search: z.string().optional(),
  riskTier: riskTierEnum.optional(),
  status: statusEnum.optional(),
  lifecycle: lifecycleEnum.optional(),
  sortBy: z.enum(['name', 'riskTier', 'createdAt', 'updatedAt']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc')
});

export type CreateAiSystemInput = z.infer<typeof createAiSystemSchema>;
export type UpdateAiSystemInput = z.infer<typeof updateAiSystemSchema>;
export type ListAiSystemsInput = z.infer<typeof listAiSystemsSchema>;

const sortColumns = {
  name: aiSystems.name,
  riskTier: aiSystems.riskTier,
  createdAt: aiSystems.createdAt,
  updatedAt: aiSystems.updatedAt
} as const;

export async function listAiSystems(ctx: TenantContext, input: ListAiSystemsInput) {
  const where = and(
    eq(aiSystems.organizationId, ctx.organizationId),
    input.search ? ilike(aiSystems.name, `%${input.search}%`) : undefined,
    input.riskTier ? eq(aiSystems.riskTier, input.riskTier) : undefined,
    input.status ? eq(aiSystems.status, input.status) : undefined,
    input.lifecycle ? eq(aiSystems.lifecycle, input.lifecycle) : undefined
  );

  const orderColumn = sortColumns[input.sortBy];
  const order = sortDir(input.sortDir) === 'asc' ? asc(orderColumn) : desc(orderColumn);

  const [items, [totals]] = await Promise.all([
    db
      .select()
      .from(aiSystems)
      .where(where)
      .orderBy(order)
      .limit(input.pageSize)
      .offset(pageOffset(input.page, input.pageSize)),
    db.select({ value: count() }).from(aiSystems).where(where)
  ]);

  return paginated(items, totals?.value ?? 0, input.page, input.pageSize);
}

export async function getAiSystem(ctx: TenantContext, id: string) {
  const row = await db.query.aiSystems.findFirst({
    where: and(eq(aiSystems.id, id), eq(aiSystems.organizationId, ctx.organizationId))
  });
  if (!row) throw notFound('That AI system does not exist.');
  return row;
}

export async function createAiSystem(ctx: TenantContext, input: CreateAiSystemInput) {
  const [row] = await db
    .insert(aiSystems)
    .values({ ...input, organizationId: ctx.organizationId, createdByUserId: ctx.userId })
    .returning();

  await appendAuditLog({
    organizationId: ctx.organizationId,
    actorType: ctx.userId ? 'user' : 'system',
    actorId: ctx.clerkUserId,
    action: 'ai_system.created',
    resourceType: 'ai_system',
    resourceId: row.id,
    data: { name: row.name }
  });

  return row;
}

export async function updateAiSystem(ctx: TenantContext, id: string, input: UpdateAiSystemInput) {
  await getAiSystem(ctx, id);

  const [row] = await db
    .update(aiSystems)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(aiSystems.id, id), eq(aiSystems.organizationId, ctx.organizationId)))
    .returning();

  await appendAuditLog({
    organizationId: ctx.organizationId,
    actorType: ctx.userId ? 'user' : 'system',
    actorId: ctx.clerkUserId,
    action: 'ai_system.updated',
    resourceType: 'ai_system',
    resourceId: row.id,
    data: { fields: Object.keys(input) }
  });

  return row;
}

export async function deleteAiSystem(ctx: TenantContext, id: string) {
  await getAiSystem(ctx, id);
  await db
    .delete(aiSystems)
    .where(and(eq(aiSystems.id, id), eq(aiSystems.organizationId, ctx.organizationId)));

  await appendAuditLog({
    organizationId: ctx.organizationId,
    actorType: ctx.userId ? 'user' : 'system',
    actorId: ctx.clerkUserId,
    action: 'ai_system.deleted',
    resourceType: 'ai_system',
    resourceId: id,
    data: null
  });
}
