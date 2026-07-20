import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import {
  agents,
  aiSystems,
  alerts,
  documents,
  evaluations,
  obligations,
  organizations
} from '@/db/schema';
import { badRequest, notFound } from '@/lib/api/errors';
import type { TenantContext } from '@/lib/auth/tenant';
import {
  generateAnnexIv,
  generateAuditReport,
  generateModelCard,
  generateRiskAssessment
} from '@/server/engine/documents';
import { appendAuditLog, verifyAuditChain } from './audit';

export const generateDocumentSchema = z.object({
  type: z.enum(['risk_assessment', 'model_card', 'annex_iv', 'audit_report']),
  aiSystemId: z.string().uuid().optional()
});

export type GenerateDocumentInput = z.infer<typeof generateDocumentSchema>;

const titles: Record<string, string> = {
  risk_assessment: 'Risk assessment',
  model_card: 'Model card',
  annex_iv: 'Annex IV technical file',
  audit_report: 'Audit report'
};

export async function generateDocument(ctx: TenantContext, input: GenerateDocumentInput) {
  let content: string;
  let title: string;
  let aiSystemId: string | null = null;

  if (input.type === 'audit_report') {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, ctx.organizationId)
    });
    const [[systemsCount], [highRiskCount], [openAlertsCount], chain] = await Promise.all([
      db
        .select({ v: count() })
        .from(aiSystems)
        .where(eq(aiSystems.organizationId, ctx.organizationId)),
      db
        .select({ v: count() })
        .from(aiSystems)
        .where(
          and(eq(aiSystems.organizationId, ctx.organizationId), eq(aiSystems.riskTier, 'high'))
        ),
      db
        .select({ v: count() })
        .from(alerts)
        .where(and(eq(alerts.organizationId, ctx.organizationId), eq(alerts.status, 'open'))),
      verifyAuditChain(ctx.organizationId)
    ]);
    content = generateAuditReport({
      organizationName: org?.name ?? 'Your organization',
      chainValid: chain.valid,
      chainChecked: chain.checked,
      systems: systemsCount?.v ?? 0,
      highRisk: highRiskCount?.v ?? 0,
      openAlerts: openAlertsCount?.v ?? 0
    });
    title = titles[input.type];
  } else {
    if (!input.aiSystemId) throw badRequest('This document type needs an aiSystemId.');
    const system = await db.query.aiSystems.findFirst({
      where: and(
        eq(aiSystems.id, input.aiSystemId),
        eq(aiSystems.organizationId, ctx.organizationId)
      )
    });
    if (!system) throw notFound('That AI system does not exist.');
    aiSystemId = system.id;

    const systemAgents = await db.select().from(agents).where(eq(agents.aiSystemId, system.id));
    const agentIds = systemAgents.map((a) => a.id);
    const [systemObligations, systemEvals] = await Promise.all([
      db.select().from(obligations).where(eq(obligations.aiSystemId, system.id)),
      agentIds.length
        ? db
            .select()
            .from(evaluations)
            .where(inArray(evaluations.agentId, agentIds))
            .orderBy(desc(evaluations.createdAt))
        : Promise.resolve([])
    ]);

    if (input.type === 'risk_assessment') {
      content = generateRiskAssessment(system, systemObligations, systemEvals);
    } else if (input.type === 'model_card') {
      content = generateModelCard(system, systemAgents);
    } else {
      content = generateAnnexIv(system, systemObligations, systemAgents);
    }
    title = `${titles[input.type]}: ${system.name}`;
  }

  const [existing] = await db
    .select({ v: count() })
    .from(documents)
    .where(and(eq(documents.organizationId, ctx.organizationId), eq(documents.type, input.type)));

  const [row] = await db
    .insert(documents)
    .values({
      organizationId: ctx.organizationId,
      aiSystemId,
      type: input.type,
      title,
      status: 'draft',
      content,
      version: (existing?.v ?? 0) + 1,
      generatedByUserId: ctx.userId
    })
    .returning();

  await appendAuditLog({
    organizationId: ctx.organizationId,
    actorType: ctx.userId ? 'user' : 'system',
    actorId: ctx.clerkUserId,
    action: 'document.generated',
    resourceType: 'document',
    resourceId: row.id,
    data: { type: input.type }
  });

  return row;
}
