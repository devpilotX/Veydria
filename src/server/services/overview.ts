import { and, count, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { aiSystems, alerts, evaluations, obligations } from '@/db/schema';
import type { TenantContext } from '@/lib/auth/tenant';
import { getMonitoringStats } from './monitoring';

/** Aggregates the numbers the dashboard shows in one place. */
export async function getOverviewStats(ctx: TenantContext) {
  const org = eq(aiSystems.organizationId, ctx.organizationId);

  const [systems, tiers, obligationRows, evalRows, openAlertCount, recentAlerts, monitoring] =
    await Promise.all([
      db.select({ value: count() }).from(aiSystems).where(org),
      db
        .select({ tier: aiSystems.riskTier, value: count() })
        .from(aiSystems)
        .where(org)
        .groupBy(aiSystems.riskTier),
      db
        .select({ status: obligations.status, value: count() })
        .from(obligations)
        .where(eq(obligations.organizationId, ctx.organizationId))
        .groupBy(obligations.status),
      db
        .select({ passed: evaluations.passed, value: count() })
        .from(evaluations)
        .where(eq(evaluations.organizationId, ctx.organizationId))
        .groupBy(evaluations.passed),
      db
        .select({ value: count() })
        .from(alerts)
        .where(and(eq(alerts.organizationId, ctx.organizationId), eq(alerts.status, 'open'))),
      db
        .select()
        .from(alerts)
        .where(eq(alerts.organizationId, ctx.organizationId))
        .orderBy(desc(alerts.createdAt))
        .limit(5),
      getMonitoringStats(ctx)
    ]);

  const tierBreakdown = { high: 0, limited: 0, minimal: 0, unknown: 0, prohibited: 0 };
  for (const row of tiers) {
    tierBreakdown[row.tier as keyof typeof tierBreakdown] = row.value;
  }

  const obligationsTotal = obligationRows.reduce((sum, row) => sum + row.value, 0);
  const obligationsMet = obligationRows.find((row) => row.status === 'met')?.value ?? 0;

  const evalsPassed = evalRows.find((row) => row.passed === true)?.value ?? 0;
  const evalsFailed = evalRows.find((row) => row.passed === false)?.value ?? 0;

  return {
    systemsTotal: systems[0]?.value ?? 0,
    highRiskTotal: tierBreakdown.high + tierBreakdown.prohibited,
    tierBreakdown,
    obligationsTotal,
    obligationsMet,
    obligationsMetPct:
      obligationsTotal === 0 ? 0 : Math.round((obligationsMet / obligationsTotal) * 100),
    evalsPassed,
    evalsFailed,
    openAlerts: openAlertCount[0]?.value ?? 0,
    recentAlerts,
    monitoring
  };
}
