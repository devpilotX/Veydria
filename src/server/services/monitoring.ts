import { and, count, desc, eq, gte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { agents, monitoringEvents } from '@/db/schema';
import type { TenantContext } from '@/lib/auth/tenant';
import { badRequest } from '@/lib/api/errors';
import { paginated, paginationSchema, pageOffset } from './shared';

const eventTypeEnum = z.enum([
  'invocation',
  'output',
  'tool_call',
  'error',
  'policy_check',
  'decision'
]);

export const ingestEventSchema = z.object({
  agentId: z.string().uuid().optional(),
  agentExternalId: z.string().max(200).optional(),
  eventType: eventTypeEnum.default('output'),
  input: z.string().optional(),
  output: z.string().optional(),
  latencyMs: z.number().int().nonnegative().optional(),
  tokensIn: z.number().int().nonnegative().optional(),
  tokensOut: z.number().int().nonnegative().optional(),
  costUsd: z.number().nonnegative().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  occurredAt: z.coerce.date().default(() => new Date())
});

export const ingestBatchSchema = z.object({
  events: z.array(ingestEventSchema).min(1).max(500)
});

export const listEventsSchema = paginationSchema.extend({
  agentId: z.string().uuid().optional(),
  flagged: z.coerce.boolean().optional()
});

export type IngestEventInput = z.infer<typeof ingestEventSchema>;
export type ListEventsInput = z.infer<typeof listEventsSchema>;

// A light policy check that flags obvious personal data leaking into output.
const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
function screenOutput(output: string | undefined): { flagged: boolean; reason: string | null } {
  if (output && emailPattern.test(output)) {
    return { flagged: true, reason: 'Output looks like it contains an email address.' };
  }
  return { flagged: false, reason: null };
}

/** Ingests a batch of agent events from the SDK, keyed to one organization. */
export async function ingestEvents(
  organizationId: string,
  input: z.infer<typeof ingestBatchSchema>
) {
  const orgAgents = await db
    .select({ id: agents.id, externalId: agents.externalId })
    .from(agents)
    .where(eq(agents.organizationId, organizationId));

  const byId = new Map(orgAgents.map((a) => [a.id, a.id]));
  const byExternal = new Map(
    orgAgents.filter((a) => a.externalId).map((a) => [a.externalId as string, a.id])
  );

  const rows = input.events.map((event) => {
    const agentId = event.agentId
      ? byId.get(event.agentId)
      : event.agentExternalId
        ? byExternal.get(event.agentExternalId)
        : undefined;
    if (!agentId) {
      throw badRequest('Every event must reference a known agentId or agentExternalId.');
    }
    const screen = screenOutput(event.output);
    return {
      organizationId,
      agentId,
      eventType: event.eventType,
      input: event.input,
      output: event.output,
      latencyMs: event.latencyMs,
      tokensIn: event.tokensIn,
      tokensOut: event.tokensOut,
      costUsd: event.costUsd,
      metadata: event.metadata,
      flagged: screen.flagged,
      flagReason: screen.reason,
      occurredAt: event.occurredAt
    };
  });

  const inserted = await db
    .insert(monitoringEvents)
    .values(rows)
    .returning({ id: monitoringEvents.id });

  const touchedAgentIds = [...new Set(rows.map((r) => r.agentId))];
  await Promise.all(
    touchedAgentIds.map((id) =>
      db.update(agents).set({ lastSeenAt: new Date() }).where(eq(agents.id, id))
    )
  );

  return { accepted: inserted.length, flagged: rows.filter((r) => r.flagged).length };
}

export async function listEvents(ctx: TenantContext, input: ListEventsInput) {
  const where = and(
    eq(monitoringEvents.organizationId, ctx.organizationId),
    input.agentId ? eq(monitoringEvents.agentId, input.agentId) : undefined,
    input.flagged === undefined ? undefined : eq(monitoringEvents.flagged, input.flagged)
  );
  const [items, [totals]] = await Promise.all([
    db
      .select()
      .from(monitoringEvents)
      .where(where)
      .orderBy(desc(monitoringEvents.occurredAt))
      .limit(input.pageSize)
      .offset(pageOffset(input.page, input.pageSize)),
    db.select({ value: count() }).from(monitoringEvents).where(where)
  ]);
  return paginated(items, totals?.value ?? 0, input.page, input.pageSize);
}

/** Rolls up recent monitoring activity for the dashboard. */
export async function getMonitoringStats(ctx: TenantContext) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [[total], [flagged], byDay] = await Promise.all([
    db
      .select({ value: count() })
      .from(monitoringEvents)
      .where(
        and(
          eq(monitoringEvents.organizationId, ctx.organizationId),
          gte(monitoringEvents.occurredAt, since)
        )
      ),
    db
      .select({ value: count() })
      .from(monitoringEvents)
      .where(
        and(
          eq(monitoringEvents.organizationId, ctx.organizationId),
          eq(monitoringEvents.flagged, true),
          gte(monitoringEvents.occurredAt, since)
        )
      ),
    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${monitoringEvents.occurredAt}), 'YYYY-MM-DD')`,
        value: count()
      })
      .from(monitoringEvents)
      .where(
        and(
          eq(monitoringEvents.organizationId, ctx.organizationId),
          gte(monitoringEvents.occurredAt, since)
        )
      )
      .groupBy(sql`date_trunc('day', ${monitoringEvents.occurredAt})`)
      .orderBy(sql`date_trunc('day', ${monitoringEvents.occurredAt})`)
  ]);

  return {
    last7Days: total?.value ?? 0,
    flaggedLast7Days: flagged?.value ?? 0,
    byDay
  };
}
