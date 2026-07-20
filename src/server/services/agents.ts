import { and, asc, count, desc, eq, ilike } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { agents, aiSystems } from '@/db/schema';
import type { TenantContext } from '@/lib/auth/tenant';
import { badRequest, notFound } from '@/lib/api/errors';
import { appendAuditLog } from './audit';
import { paginated, paginationSchema, pageOffset, sortDir } from './shared';

const agentTypeEnum = z.enum([
  'assistant',
  'rag',
  'autonomous',
  'classifier',
  'generator',
  'workflow'
]);
const agentStatusEnum = z.enum(['active', 'paused', 'archived']);

export const createAgentSchema = z.object({
  aiSystemId: z.string().uuid(),
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  type: agentTypeEnum.default('assistant'),
  modelProvider: z.string().max(120).optional(),
  modelName: z.string().max(120).optional(),
  systemPrompt: z.string().max(8000).optional(),
  externalId: z.string().max(200).optional()
});

export const updateAgentSchema = createAgentSchema.partial().extend({
  status: agentStatusEnum.optional()
});

export const listAgentsSchema = paginationSchema.extend({
  search: z.string().optional(),
  aiSystemId: z.string().uuid().optional(),
  status: agentStatusEnum.optional(),
  type: agentTypeEnum.optional(),
  sortBy: z.enum(['name', 'createdAt', 'lastSeenAt']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc')
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type ListAgentsInput = z.infer<typeof listAgentsSchema>;

const sortColumns = {
  name: agents.name,
  createdAt: agents.createdAt,
  lastSeenAt: agents.lastSeenAt
} as const;

async function assertSystemInOrg(ctx: TenantContext, aiSystemId: string) {
  const system = await db.query.aiSystems.findFirst({
    where: and(eq(aiSystems.id, aiSystemId), eq(aiSystems.organizationId, ctx.organizationId))
  });
  if (!system) throw badRequest('That AI system does not belong to your organization.');
}

export async function listAgents(ctx: TenantContext, input: ListAgentsInput) {
  const where = and(
    eq(agents.organizationId, ctx.organizationId),
    input.search ? ilike(agents.name, `%${input.search}%`) : undefined,
    input.aiSystemId ? eq(agents.aiSystemId, input.aiSystemId) : undefined,
    input.status ? eq(agents.status, input.status) : undefined,
    input.type ? eq(agents.type, input.type) : undefined
  );
  const orderColumn = sortColumns[input.sortBy];
  const order = sortDir(input.sortDir) === 'asc' ? asc(orderColumn) : desc(orderColumn);

  const [items, [totals]] = await Promise.all([
    db
      .select()
      .from(agents)
      .where(where)
      .orderBy(order)
      .limit(input.pageSize)
      .offset(pageOffset(input.page, input.pageSize)),
    db.select({ value: count() }).from(agents).where(where)
  ]);
  return paginated(items, totals?.value ?? 0, input.page, input.pageSize);
}

export async function getAgent(ctx: TenantContext, id: string) {
  const row = await db.query.agents.findFirst({
    where: and(eq(agents.id, id), eq(agents.organizationId, ctx.organizationId))
  });
  if (!row) throw notFound('That agent does not exist.');
  return row;
}

export async function createAgent(ctx: TenantContext, input: CreateAgentInput) {
  await assertSystemInOrg(ctx, input.aiSystemId);
  const [row] = await db
    .insert(agents)
    .values({ ...input, organizationId: ctx.organizationId })
    .returning();

  await appendAuditLog({
    organizationId: ctx.organizationId,
    actorType: ctx.userId ? 'user' : 'system',
    actorId: ctx.clerkUserId,
    action: 'agent.created',
    resourceType: 'agent',
    resourceId: row.id,
    data: { name: row.name }
  });
  return row;
}

export async function updateAgent(ctx: TenantContext, id: string, input: UpdateAgentInput) {
  await getAgent(ctx, id);
  if (input.aiSystemId) await assertSystemInOrg(ctx, input.aiSystemId);
  const [row] = await db
    .update(agents)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(agents.id, id), eq(agents.organizationId, ctx.organizationId)))
    .returning();

  await appendAuditLog({
    organizationId: ctx.organizationId,
    actorType: ctx.userId ? 'user' : 'system',
    actorId: ctx.clerkUserId,
    action: 'agent.updated',
    resourceType: 'agent',
    resourceId: row.id,
    data: { fields: Object.keys(input) }
  });
  return row;
}

export async function deleteAgent(ctx: TenantContext, id: string) {
  await getAgent(ctx, id);
  await db
    .delete(agents)
    .where(and(eq(agents.id, id), eq(agents.organizationId, ctx.organizationId)));
  await appendAuditLog({
    organizationId: ctx.organizationId,
    actorType: ctx.userId ? 'user' : 'system',
    actorId: ctx.clerkUserId,
    action: 'agent.deleted',
    resourceType: 'agent',
    resourceId: id,
    data: null
  });
}
