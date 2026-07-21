import { and, count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { agents, evaluationCases, evaluations } from '@/db/schema';
import type { TenantContext } from '@/lib/auth/tenant';
import { badRequest, notFound } from '@/lib/api/errors';
import { pseudoEmbedding } from '@/lib/embedding-fallback';
import { appendAuditLog } from './audit';
import {
  type EvalServiceResult,
  isEvalsServiceConfigured,
  runOnEvalsService
} from './evals-client';
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
 * Creates an evaluation and runs it. We insert the queued row, record the
 * intent, then hand off to runEvaluation, which scores it on the Python service
 * in services/evals. runEvaluation records the outcome and does not throw when
 * the service is unavailable, so the caller always gets back a terminal row.
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

  return runEvaluation(ctx, row.id);
}

/**
 * Runs an evaluation on the evals service and stores the result. It marks the
 * run as started, then either records the score or, when the service cannot be
 * reached, marks the run as an error with a clear message. It never throws for
 * a service outage, so a trigger from the UI always ends in a recorded attempt.
 */
export async function runEvaluation(ctx: TenantContext, id: string) {
  const evaluation = await db.query.evaluations.findFirst({
    where: and(eq(evaluations.id, id), eq(evaluations.organizationId, ctx.organizationId))
  });
  if (!evaluation) throw notFound('That evaluation does not exist.');

  const agent = await db.query.agents.findFirst({ where: eq(agents.id, evaluation.agentId) });
  if (!agent) throw notFound('The agent for that evaluation is gone.');

  await db
    .update(evaluations)
    .set({ status: 'running', startedAt: new Date(), completedAt: null })
    .where(eq(evaluations.id, id));

  await appendAuditLog({
    organizationId: ctx.organizationId,
    actorType: ctx.userId ? 'user' : 'system',
    actorId: ctx.clerkUserId,
    action: 'evaluation.started',
    resourceType: 'evaluation',
    resourceId: id,
    data: { type: evaluation.type, agentId: agent.id }
  });

  let result: EvalServiceResult;
  try {
    result = await runOnEvalsService({
      type: evaluation.type,
      agentName: agent.name,
      systemPrompt: agent.systemPrompt,
      model: agent.modelName,
      threshold: evaluation.threshold
    });
  } catch (error) {
    // The evals service is unavailable. Record the attempt as an error with a
    // clear message rather than throwing, so the trigger never crashes the app.
    const reason = isEvalsServiceConfigured()
      ? 'The evaluation service did not respond, so this run could not finish. The attempt is recorded. Check that the service is running, then run it again.'
      : 'The evaluation service is not set up yet, so this run could not start. The attempt is recorded. Set EVALS_SERVICE_URL, then run it again.';

    const [errored] = await db
      .update(evaluations)
      .set({ status: 'error', summary: reason, completedAt: new Date() })
      .where(eq(evaluations.id, id))
      .returning();

    await appendAuditLog({
      organizationId: ctx.organizationId,
      actorType: ctx.userId ? 'user' : 'system',
      actorId: ctx.clerkUserId,
      action: 'evaluation.failed',
      resourceType: 'evaluation',
      resourceId: id,
      data: {
        type: evaluation.type,
        reason: error instanceof Error ? error.message : 'unknown error'
      }
    });

    return errored;
  }

  const passedCases = result.cases.filter((testCase) => testCase.passed).length;
  const [updated] = await db
    .update(evaluations)
    .set({
      status: result.passed ? 'passed' : 'failed',
      score: result.score,
      passed: result.passed,
      summary: result.summary,
      details: {
        caseCount: result.cases.length,
        passedCases,
        failedCases: result.cases.length - passedCases
      },
      modelUsed: result.model_used,
      completedAt: new Date()
    })
    .where(eq(evaluations.id, id))
    .returning();

  // Replace any cases from an earlier run so re-running does not stack duplicates.
  await db.delete(evaluationCases).where(eq(evaluationCases.evaluationId, id));
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
