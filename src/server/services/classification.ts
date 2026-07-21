import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { aiSystems, obligations, regulationClauses } from '@/db/schema';
import type { TenantContext } from '@/lib/auth/tenant';
import { ApiError, notFound } from '@/lib/api/errors';
import { classifyAiSystem, planObligations, type RiskTier } from '@/server/engine/rules';
import type { CreateAiSystemInput } from './ai-systems';
import { appendAuditLogTx } from './audit';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type SystemRef = { id: string; name: string };

type ObligationRow = typeof obligations.$inferInsert;

/**
 * Builds the obligation rows for a system at a given tier by matching the
 * planned clauses to the global regulation knowledge base. Shared by create
 * and reclassify so both behave the same.
 */
async function buildObligationRows(
  tx: Tx,
  organizationId: string,
  system: SystemRef,
  tier: RiskTier
): Promise<ObligationRow[]> {
  const planned = planObligations(tier);
  const refs = planned.map((plan) => plan.clauseRef);
  const clauses = refs.length
    ? await tx.select().from(regulationClauses).where(inArray(regulationClauses.ref, refs))
    : [];
  if (refs.length > 0 && clauses.length === 0) {
    throw new ApiError(
      503,
      'The regulations knowledge base is empty, so obligations cannot be generated. Run pnpm db:seed:regulations or pnpm db:migrate first.',
      'regulations_not_seeded'
    );
  }
  const clauseByKey = new Map(clauses.map((clause) => [`${clause.code}:${clause.ref}`, clause]));

  const rows: ObligationRow[] = [];
  for (const plan of planned) {
    const clause = clauseByKey.get(`${plan.regulationCode}:${plan.clauseRef}`);
    if (!clause) continue;
    rows.push({
      organizationId,
      aiSystemId: system.id,
      regulationCode: plan.regulationCode,
      clauseRef: plan.clauseRef,
      regulationClauseId: clause.id,
      title: `${clause.title} for ${system.name}`,
      description: clause.text,
      category: clause.category ?? 'risk_management',
      severity: plan.severity,
      status: 'not_started'
    });
  }
  return rows;
}

function classificationRationale(rationale: string, reference: string | null): string {
  return reference ? `${rationale} (${reference})` : rationale;
}

/**
 * Creates a system and classifies it in a single transaction. Either the
 * system exists with its tier, obligations, and audit trail, or nothing is
 * written. Errors surface to the caller instead of leaving a half made system.
 */
export async function createAndClassifyAiSystem(ctx: TenantContext, input: CreateAiSystemInput) {
  return db.transaction(async (tx) => {
    const [system] = await tx
      .insert(aiSystems)
      .values({ ...input, organizationId: ctx.organizationId, createdByUserId: ctx.userId })
      .returning();

    await appendAuditLogTx(tx, {
      organizationId: ctx.organizationId,
      actorType: ctx.userId ? 'user' : 'system',
      actorId: ctx.clerkUserId,
      action: 'ai_system.created',
      resourceType: 'ai_system',
      resourceId: system.id,
      data: { name: system.name }
    });

    const result = classifyAiSystem({
      name: system.name,
      purpose: system.purpose,
      domain: system.domain,
      deploymentContext: system.deploymentContext
    });
    const rows = await buildObligationRows(tx, ctx.organizationId, system, result.tier);

    await tx
      .update(aiSystems)
      .set({
        riskTier: result.tier,
        classifiedAt: new Date(),
        classificationRationale: classificationRationale(result.rationale, result.reference),
        updatedAt: new Date()
      })
      .where(eq(aiSystems.id, system.id));

    if (rows.length) await tx.insert(obligations).values(rows);

    await appendAuditLogTx(tx, {
      organizationId: ctx.organizationId,
      actorType: ctx.userId ? 'user' : 'system',
      actorId: ctx.clerkUserId,
      action: 'ai_system.classified',
      resourceType: 'ai_system',
      resourceId: system.id,
      data: { riskTier: result.tier, obligations: rows.length }
    });

    return {
      id: system.id,
      name: system.name,
      riskTier: result.tier,
      rationale: result.rationale,
      reference: result.reference,
      obligationsCreated: rows.length
    };
  });
}

/**
 * Reclassifies an existing system and rebuilds its obligation set. Regenerating
 * replaces the machine planned obligations so the list always reflects the
 * current tier.
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

  const created = await db.transaction(async (tx) => {
    const rows = await buildObligationRows(tx, ctx.organizationId, system, result.tier);

    await tx
      .update(aiSystems)
      .set({
        riskTier: result.tier,
        classifiedAt: new Date(),
        classificationRationale: classificationRationale(result.rationale, result.reference),
        updatedAt: new Date()
      })
      .where(eq(aiSystems.id, system.id));

    await tx.delete(obligations).where(eq(obligations.aiSystemId, system.id));
    if (rows.length) await tx.insert(obligations).values(rows);

    await appendAuditLogTx(tx, {
      organizationId: ctx.organizationId,
      actorType: ctx.userId ? 'user' : 'system',
      actorId: ctx.clerkUserId,
      action: 'ai_system.classified',
      resourceType: 'ai_system',
      resourceId: system.id,
      data: { riskTier: result.tier, obligations: rows.length }
    });

    return rows.length;
  });

  return {
    riskTier: result.tier,
    rationale: result.rationale,
    reference: result.reference,
    obligationsCreated: created
  };
}
