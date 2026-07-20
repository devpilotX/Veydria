import { and, count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { alerts } from '@/db/schema';
import type { TenantContext } from '@/lib/auth/tenant';
import { notFound } from '@/lib/api/errors';
import { appendAuditLog } from './audit';
import { paginated, paginationSchema, pageOffset } from './shared';

export const listAlertsSchema = paginationSchema.extend({
  status: z.enum(['open', 'acknowledged', 'resolved']).optional(),
  severity: z.enum(['info', 'low', 'medium', 'high', 'critical']).optional(),
  agentId: z.string().uuid().optional()
});

export const updateAlertSchema = z.object({
  status: z.enum(['open', 'acknowledged', 'resolved'])
});

export type ListAlertsInput = z.infer<typeof listAlertsSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;

export async function listAlerts(ctx: TenantContext, input: ListAlertsInput) {
  const where = and(
    eq(alerts.organizationId, ctx.organizationId),
    input.status ? eq(alerts.status, input.status) : undefined,
    input.severity ? eq(alerts.severity, input.severity) : undefined,
    input.agentId ? eq(alerts.agentId, input.agentId) : undefined
  );
  const [items, [totals]] = await Promise.all([
    db
      .select()
      .from(alerts)
      .where(where)
      .orderBy(desc(alerts.createdAt))
      .limit(input.pageSize)
      .offset(pageOffset(input.page, input.pageSize)),
    db.select({ value: count() }).from(alerts).where(where)
  ]);
  return paginated(items, totals?.value ?? 0, input.page, input.pageSize);
}

export async function updateAlert(ctx: TenantContext, id: string, input: UpdateAlertInput) {
  const existing = await db.query.alerts.findFirst({
    where: and(eq(alerts.id, id), eq(alerts.organizationId, ctx.organizationId))
  });
  if (!existing) throw notFound('That alert does not exist.');

  const [row] = await db
    .update(alerts)
    .set({
      status: input.status,
      acknowledgedByUserId:
        input.status === 'acknowledged' ? ctx.userId : existing.acknowledgedByUserId,
      acknowledgedAt: input.status === 'acknowledged' ? new Date() : existing.acknowledgedAt,
      resolvedAt: input.status === 'resolved' ? new Date() : existing.resolvedAt
    })
    .where(and(eq(alerts.id, id), eq(alerts.organizationId, ctx.organizationId)))
    .returning();

  await appendAuditLog({
    organizationId: ctx.organizationId,
    actorType: ctx.userId ? 'user' : 'system',
    actorId: ctx.clerkUserId,
    action: `alert.${input.status}`,
    resourceType: 'alert',
    resourceId: row.id,
    data: { status: row.status }
  });
  return row;
}
