import { and, count, eq, gte } from 'drizzle-orm';
import { db } from '@/db';
import { aiSystems, auditLog, documents, memberships, monitoringEvents } from '@/db/schema';
import { PLANS, type PlanKey } from '@/config/plans';
import { quotaExceeded } from '@/lib/api/errors';
import type { TenantContext } from '@/lib/auth/tenant';
import { getSubscription } from './billing';

/**
 * Hard safety caps. Two layers:
 *  1. Plan limits from src/config/plans.ts: aiSystems (resource) and
 *     monitoringEventsPerMonth (monthly quota). Seats are reported through
 *     seatUsage but governed by Clerk, since membership is created there.
 *  2. A defensive monthly ceiling on the actions that can drive real cost
 *     (LLM tokens once a provider key is set, plus compute and storage):
 *     classify, evaluate, and document.
 *
 * Counts come from existing tables and the append only audit log, so there is
 * no new table and no migration. Move to a dedicated counter or Redis later if
 * the query volume warrants it.
 */

export type MeteredAction = 'classify' | 'evaluate' | 'document';

// null means no monthly ceiling for that action on that plan. Deliberately
// generous; these are an abuse and cost backstop, not the product's pricing.
const MONTHLY_ACTION_CAPS: Record<PlanKey, Record<MeteredAction, number | null>> = {
  free: { classify: 50, evaluate: 50, document: 20 },
  starter: { classify: 500, evaluate: 500, document: 200 },
  growth: { classify: 5000, evaluate: 5000, document: 2000 },
  scale: { classify: null, evaluate: null, document: null },
  enterprise: { classify: null, evaluate: null, document: null }
};

// The append only audit action that records one occurrence of each metered
// action. Documents are counted from the documents table instead.
const ACTION_AUDIT: Record<'classify' | 'evaluate', string> = {
  classify: 'ai_system.classified',
  evaluate: 'evaluation.started'
};

function monthStartUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

async function planKeyFor(ctx: TenantContext): Promise<PlanKey> {
  const sub = await getSubscription(ctx);
  return sub.plan;
}

/** Blocks creating an AI system past the plan's aiSystems limit. */
export async function assertCanCreateAiSystem(ctx: TenantContext): Promise<void> {
  const plan = await planKeyFor(ctx);
  const limit = PLANS[plan].limits.aiSystems;
  if (limit === null) return;

  const [row] = await db
    .select({ value: count() })
    .from(aiSystems)
    .where(eq(aiSystems.organizationId, ctx.organizationId));

  if (Number(row?.value ?? 0) >= limit) {
    throw quotaExceeded(
      `Plan limit reached: the ${PLANS[plan].name} plan allows ${limit} AI ${
        limit === 1 ? 'system' : 'systems'
      }. Remove one or upgrade to add more.`
    );
  }
}

/** Blocks a metered action past the plan's monthly ceiling. */
export async function assertMonthlyAction(
  ctx: TenantContext,
  action: MeteredAction
): Promise<void> {
  const plan = await planKeyFor(ctx);
  const cap = MONTHLY_ACTION_CAPS[plan][action];
  if (cap === null) return;

  const since = monthStartUtc();
  let used: number;

  if (action === 'document') {
    const [row] = await db
      .select({ value: count() })
      .from(documents)
      .where(
        and(eq(documents.organizationId, ctx.organizationId), gte(documents.createdAt, since))
      );
    used = Number(row?.value ?? 0);
  } else {
    const [row] = await db
      .select({ value: count() })
      .from(auditLog)
      .where(
        and(
          eq(auditLog.organizationId, ctx.organizationId),
          eq(auditLog.action, ACTION_AUDIT[action]),
          gte(auditLog.createdAt, since)
        )
      );
    used = Number(row?.value ?? 0);
  }

  if (used >= cap) {
    throw quotaExceeded(
      `Monthly limit reached: the ${PLANS[plan].name} plan allows ${cap} ${action} runs per month. It resets at the start of next month, or upgrade for more.`
    );
  }
}

/** Blocks ingesting monitoring events past the plan's monthly quota. */
export async function assertMonitoringQuota(ctx: TenantContext, incoming = 1): Promise<void> {
  const plan = await planKeyFor(ctx);
  const limit = PLANS[plan].limits.monitoringEventsPerMonth;
  if (limit === null) return;

  const since = monthStartUtc();
  const [row] = await db
    .select({ value: count() })
    .from(monitoringEvents)
    .where(
      and(
        eq(monitoringEvents.organizationId, ctx.organizationId),
        gte(monitoringEvents.createdAt, since)
      )
    );

  if (Number(row?.value ?? 0) + incoming > limit) {
    throw quotaExceeded(
      `Monthly monitoring limit reached: the ${PLANS[plan].name} plan allows ${limit} monitoring events per month.`
    );
  }
}

/**
 * Seat usage against the plan limit. Membership is created and owned by Clerk,
 * so this is reported for enforcement in Clerk (organization membership limit)
 * rather than hard blocked in the app.
 */
export async function seatUsage(
  ctx: TenantContext
): Promise<{ used: number; limit: number | null; withinLimit: boolean }> {
  const plan = await planKeyFor(ctx);
  const limit = PLANS[plan].limits.seats;
  const [row] = await db
    .select({ value: count() })
    .from(memberships)
    .where(eq(memberships.organizationId, ctx.organizationId));
  const used = Number(row?.value ?? 0);
  return { used, limit, withinLimit: limit === null || used <= limit };
}
