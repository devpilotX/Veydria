import { relations } from 'drizzle-orm';
import { boolean, index, jsonb, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { embedding } from '../vector';
import { evaluationStatus, evaluationType } from './enums';
import { agents } from './systems';
import { organizations, users } from './identity';

/**
 * An evaluation runs one kind of test against one agent, for example a bias
 * probe or a prompt injection suite. It rolls up many cases into a single
 * score. The Python service in services/evals does the scoring and writes the
 * result back.
 */
export const evaluations = pgTable(
  'evaluations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    type: evaluationType('type').notNull(),
    status: evaluationStatus('status').notNull().default('queued'),
    // Score out of 100. Null until the run completes.
    score: real('score'),
    // The score at or above which the run passes.
    threshold: real('threshold').notNull().default(70),
    passed: boolean('passed'),
    summary: text('summary'),
    // Per dimension breakdown and any raw metrics from the evals service.
    details: jsonb('details').$type<Record<string, unknown>>(),
    modelUsed: text('model_used'),
    triggeredByUserId: uuid('triggered_by_user_id').references(() => users.id, {
      onDelete: 'set null'
    }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('evaluations_org_idx').on(table.organizationId),
    index('evaluations_agent_idx').on(table.agentId),
    index('evaluations_type_idx').on(table.organizationId, table.type)
  ]
);

/**
 * One test case inside an evaluation. The embedding of the output feeds the
 * incident dataset that grows with usage, so similar failures can be found
 * across runs and customers.
 */
export const evaluationCases = pgTable(
  'evaluation_cases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    evaluationId: uuid('evaluation_id')
      .notNull()
      .references(() => evaluations.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    input: text('input').notNull(),
    expected: text('expected'),
    output: text('output'),
    passed: boolean('passed'),
    score: real('score'),
    rationale: text('rationale'),
    embedding: embedding('embedding'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index('evaluation_cases_eval_idx').on(table.evaluationId)]
);

export const evaluationsRelations = relations(evaluations, ({ one, many }) => ({
  agent: one(agents, { fields: [evaluations.agentId], references: [agents.id] }),
  cases: many(evaluationCases)
}));

export const evaluationCasesRelations = relations(evaluationCases, ({ one }) => ({
  evaluation: one(evaluations, {
    fields: [evaluationCases.evaluationId],
    references: [evaluations.id]
  })
}));
