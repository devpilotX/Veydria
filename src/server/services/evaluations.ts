import { and, count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { agents, evaluationCases, evaluations } from '@/db/schema';
import type { TenantContext } from '@/lib/auth/tenant';
import { badRequest, notFound } from '@/lib/api/errors';
import { pseudoEmbedding } from '@/lib/embedding-fallback';
import { appendAuditLog } from './audit';
import { isEvalsServiceConfigured, runOnEvalsService } from './evals-client';
import { paginated, paginationSchema, pageOffset } from './shared';

const evaluationTypeEnum = z.enum([
  'bias',
  'hallucination',
  'prompt_injection',
  'safety',
  'policy'
]);

export const listEvaluationsSchema = paginationSchema.extend({
  agentId: z.string().uuid().optional(),
  type: evaluationTypeEnum.optional(),
  status: z.enum(['queued', 'running', 'passed', 'failed', 'error']).optional()
});

export const createEvaluationSchema = z.object({
  agentId: z.string().uuid(),
  type: evaluationTypeEnum,
  threshold: z.number().min(0).max(100).default(70)
});

export type ListEvaluationsInput = z.infer<typeof listEvaluationsSchema>;
export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;

export async function listEvaluations(ctx: TenantContext, input: ListEvaluationsInput) {
  const where = and(
    eq(evaluations.organizationId, ctx.organizationId),
    input.agentId ? eq(evaluations.agentId, input.agentId) : undefined,
    input.type ? eq(evaluations.type, input.type) : undefined,
    input.status ? eq(evaluations.status, input.status) : undefined
  );
  const [items, [totals]] = await Promise.all([
    db
      .select()
      .from(evaluations)
      .where(where)
      .orderBy(desc(evaluations.createdAt))
      .limit(input.pageSize)
      .offset(pageOffset(input.page, input.pageSize)),
    db.select({ value: count() }).from(evaluations).where(where)
  ]);
  return paginated(items, totals?.value ?? 0, input.page, input.pageSize);
}

export async function getEvaluation(ctx: TenantContext, id: string) {
  const row = await db.query.evaluations.findFirst({
    where: and(eq(evaluations.id, id), eq(evaluations.organizationId, ctx.organizationId))
  });
  if (!row) throw notFound('That evaluation does not exist.');
  const cases = await db.select().from(evaluationCases).where(eq(evaluationCases.evaluationId, id));
  return { ...row, cases };
}

/**
 * Queues an evaluation. The Python service in services/evals picks it up, runs
 * the scoring, and writes the result back. Here we create the queued row and
 * record the intent in the audit log.
 */
export async function createEvaluation(ctx: TenantContext, input: CreateEvaluationInput) {
  const agent = await db.query.agents.findFirst({
    where: and(eq(agents.id, input.agentId), eq(agents.organizationId, ctx.organizationId))
  });
  if (!agent) throw badRequest('That agent does not belong to your organization.');

  const [row] = await db
    .insert(evaluations)
    .values({
      organizationId: ctx.organizationId,
      agentId: input.agentId,
      type: input.type,
      status: 'queued',
      threshold: input.threshold,
      triggeredByUserId: ctx.userId
    })
    .returning();

  await appendAuditLog({
    organizationId: ctx.organizationId,
    actorType: ctx.userId ? 'user' : 'system',
    actorId: ctx.clerkUserId,
    action: 'evaluation.queued',
    resourceType: 'evaluation',
    resourceId: row.id,
    data: { type: row.type, agentId: agent.id }
  });

  // Run it right away when the evals service is configured so results are ready.
  if (isEvalsServiceConfigured()) {
    try {
      return await runEvaluation(ctx, row.id);
    } catch (error) {
      console.error('Evaluation run failed, leaving it queued', error);
    }
  }

  return row;
}

/** Runs a queued evaluation on the evals service and stores the result. */
export async function runEvaluation(ctx: TenantContext, id: string) {
  const evaluation = await db.query.evaluations.findFirst({
    where: and(eq(evaluations.id, id), eq(evaluations.organizationId, ctx.organizationId))
  });
  if (!evaluation) throw notFound('That evaluation does not exist.');

  const agent = await db.query.agents.findFirst({ where: eq(agents.id, evaluation.agentId) });
  if (!agent) throw notFound('The agent for that evaluation is gone.');

  await db
    .update(evaluations)
    .set({ status: 'running', startedAt: new Date() })
    .where(eq(evaluations.id, id));

  const result = await runOnEvalsService({
    type: evaluation.type,
    agentName: agent.name,
    systemPrompt: agent.systemPrompt,
    model: agent.modelName,
    threshold: evaluation.threshold
  });

  const [updated] = await db
    .update(evaluations)
    .set({
      status: result.passed ? 'passed' : 'failed',
      score: result.score,
      passed: result.passed,
      summary: result.summary,
      details: { cases: result.cases.length },
      modelUsed: result.model_used,
      completedAt: new Date()
    })
    .where(eq(evaluations.id, id))
    .returning();

  if (result.cases.length) {
    await db.insert(evaluationCases).values(
      result.cases.map((testCase) => ({
        evaluationId: id,
        organizationId: ctx.organizationId,
        input: testCase.input,
        output: testCase.output,
        expected: testCase.expected ?? null,
        passed: testCase.passed,
        score: testCase.score,
        rationale: testCase.rationale,
        embedding: pseudoEmbedding(testCase.output || testCase.input)
      }))
    );
  }

  await appendAuditLog({
    organizationId: ctx.organizationId,
    actorType: ctx.userId ? 'user' : 'system',
    actorId: ctx.clerkUserId,
    action: 'evaluation.completed',
    resourceType: 'evaluation',
    resourceId: id,
    data: { type: evaluation.type, score: result.score, passed: result.passed }
  });

  return updated;
}
