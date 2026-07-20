import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { aiSystems, obligations, regulationClauses } from '@/db/schema';
import type { TenantContext } from '@/lib/auth/tenant';
import { notFound } from '@/lib/api/errors';
import { classifyAiSystem, planObligations } from '@/server/engine/rules';
import { appendAuditLog } from './audit';

/**
 * Classifies a system and rebuilds its obligation set from the knowledge base.
 * Regenerating replaces the machine planned obligations so the list always
 * reflects the current tier. Statuses reset because the applicable duties
 * changed.
 */
export async function classifyAndSaveSystem(ctx: TenantContext, systemId: string) {
  const system = await db.query.aiSystems.findFirst({
    where: and(eq(aiSystems.id, systemId), eq(aiSystems.organizationId, ctx.organizationId))
  });
  if (!system) throw notFound('That AI system does not exist.');

  const result = classifyAiSystem({
    name: system.name,
    purpose: system.purpose,
    domain: system.domain,
    deploymentContext: system.deploymentContext
  });

  const planned = planObligations(result.tier);
  const refs = planned.map((p) => p.clauseRef);

  // Pull the matching clauses so obligations link back to the knowledge base.
  const clauses = refs.length
    ? await db.select().from(regulationClauses).where(inArray(regulationClauses.ref, refs))
    : [];
  const clauseByKey = new Map(clauses.map((c) => [`${c.code}:${c.ref}`, c]));

  const rows = planned
    .map((plan) => {
      const clause = clauseByKey.get(`${plan.regulationCode}:${plan.clauseRef}`);
      if (!clause) return null;
      return {
        organizationId: ctx.organizationId,
        aiSystemId: system.id,
        regulationCode: plan.regulationCode,
        clauseRef: plan.clauseRef,
        regulationClauseId: clause.id,
        title: `${clause.title} for ${system.name}`,
        description: clause.text,
        category: clause.category ?? ('risk_management' as const),
        severity: plan.severity,
        status: 'not_started' as const
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  await db.transaction(async (tx) => {
    await tx
      .update(aiSystems)
      .set({
        riskTier: result.tier,
        classifiedAt: new Date(),
        classificationRationale: result.reference
          ? `${result.rationale} (${result.reference})`
          : result.rationale,
        updatedAt: new Date()
      })
      .where(eq(aiSystems.id, system.id));

    await tx.delete(obligations).where(eq(obligations.aiSystemId, system.id));
    if (rows.length) await tx.insert(obligations).values(rows);
  });

  await appendAuditLog({
    organizationId: ctx.organizationId,
    actorType: ctx.userId ? 'user' : 'system',
    actorId: ctx.clerkUserId,
    action: 'ai_system.classified',
    resourceType: 'ai_system',
    resourceId: system.id,
    data: { riskTier: result.tier, obligations: rows.length }
  });

  return {
    riskTier: result.tier,
    rationale: result.rationale,
    reference: result.reference,
    obligationsCreated: rows.length
  };
}
