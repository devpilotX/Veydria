import { and, count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { obligations } from '@/db/schema';
import type { TenantContext } from '@/lib/auth/tenant';
import { notFound } from '@/lib/api/errors';
import { appendAuditLog } from './audit';
import { paginated, paginationSchema, pageOffset } from './shared';

export const listObligationsSchema = paginationSchema.extend({
  aiSystemId: z.string().uuid().optional(),
  regulationCode: z.enum(['eu_ai_act', 'nist_ai_rmf', 'iso_42001']).optional(),
  status: z.enum(['not_started', 'in_progress', 'met', 'not_applicable']).optional()
});

export const updateObligationSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'met', 'not_applicable']).optional(),
  evidenceSummary: z.string().max(4000).nullish(),
  owner: z.string().max(200).nullish(),
  dueDate: z.coerce.date().nullish()
});

export type ListObligationsInput = z.infer<typeof listObligationsSchema>;
export type UpdateObligationInput = z.infer<typeof updateObligationSchema>;

export async function listObligations(ctx: TenantContext, input: ListObligationsInput) {
  const where = and(
    eq(obligations.organizationId, ctx.organizationId),
    input.aiSystemId ? eq(obligations.aiSystemId, input.aiSystemId) : undefined,
    input.regulationCode ? eq(obligations.regulationCode, input.regulationCode) : undefined,
    input.status ? eq(obligations.status, input.status) : undefined
  );
  const [items, [totals]] = await Promise.all([
    db
      .select()
      .from(obligations)
      .where(where)
      .orderBy(desc(obligations.createdAt))
      .limit(input.pageSize)
      .offset(pageOffset(input.page, input.pageSize)),
    db.select({ value: count() }).from(obligations).where(where)
  ]);
  return paginated(items, totals?.value ?? 0, input.page, input.pageSize);
}

export async function updateObligation(
  ctx: TenantContext,
  id: string,
  input: UpdateObligationInput
) {
  const existing = await db.query.obligations.findFirst({
    where: and(eq(obligations.id, id), eq(obligations.organizationId, ctx.organizationId))
  });
  if (!existing) throw notFound('That obligation does not exist.');

  const completedAt =
    input.status === 'met' ? new Date() : input.status ? null : existing.completedAt;

  const [row] = await db
    .update(obligations)
    .set({ ...input, completedAt, updatedAt: new Date() })
    .where(and(eq(obligations.id, id), eq(obligations.organizationId, ctx.organizationId)))
    .returning();

  await appendAuditLog({
    organizationId: ctx.organizationId,
    actorType: ctx.userId ? 'user' : 'system',
    actorId: ctx.clerkUserId,
    action: 'obligation.updated',
    resourceType: 'obligation',
    resourceId: row.id,
    data: { status: row.status }
  });
  return row;
}
