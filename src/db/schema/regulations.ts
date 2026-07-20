import { relations } from 'drizzle-orm';
import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { embedding } from '../vector';
import { obligationCategory, obligationStatus, regulationCode, severity } from './enums';
import { aiSystems } from './systems';
import { organizations } from './identity';

/**
 * The regulation knowledge base. `regulations` holds the frameworks we track,
 * `regulationClauses` holds the individual articles and controls with an
 * embedding so we can search them by meaning. This is the source the rules
 * engine reads when it maps a system to its obligations.
 */
export const regulations = pgTable('regulations', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: regulationCode('code').notNull().unique(),
  name: text('name').notNull(),
  jurisdiction: text('jurisdiction').notNull(),
  version: text('version'),
  summary: text('summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const regulationClauses = pgTable(
  'regulation_clauses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    regulationId: uuid('regulation_id')
      .notNull()
      .references(() => regulations.id, { onDelete: 'cascade' }),
    // Denormalised so clause queries can filter by framework without a join.
    code: regulationCode('code').notNull(),
    // For example "Article 9", "GOVERN 1.1", or "Clause 6.1.2".
    ref: text('ref').notNull(),
    title: text('title').notNull(),
    text: text('text').notNull(),
    category: obligationCategory('category'),
    embedding: embedding('embedding'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index('regulation_clauses_reg_idx').on(table.regulationId)]
);

/**
 * An obligation is a duty that applies to one AI system under one clause. The
 * rules engine creates these when it classifies a system. Customers work them
 * to "met" and attach evidence.
 */
export const obligations = pgTable(
  'obligations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    aiSystemId: uuid('ai_system_id')
      .notNull()
      .references(() => aiSystems.id, { onDelete: 'cascade' }),
    regulationCode: regulationCode('regulation_code').notNull(),
    clauseRef: text('clause_ref').notNull(),
    regulationClauseId: uuid('regulation_clause_id').references(() => regulationClauses.id, {
      onDelete: 'set null'
    }),
    title: text('title').notNull(),
    description: text('description'),
    category: obligationCategory('category').notNull().default('risk_management'),
    severity: severity('severity').notNull().default('medium'),
    status: obligationStatus('status').notNull().default('not_started'),
    evidenceSummary: text('evidence_summary'),
    owner: text('owner'),
    dueDate: timestamp('due_date', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('obligations_org_idx').on(table.organizationId),
    index('obligations_system_idx').on(table.aiSystemId),
    index('obligations_status_idx').on(table.organizationId, table.status)
  ]
);

export const regulationsRelations = relations(regulations, ({ many }) => ({
  clauses: many(regulationClauses)
}));

export const regulationClausesRelations = relations(regulationClauses, ({ one }) => ({
  regulation: one(regulations, {
    fields: [regulationClauses.regulationId],
    references: [regulations.id]
  })
}));

export const obligationsRelations = relations(obligations, ({ one }) => ({
  aiSystem: one(aiSystems, { fields: [obligations.aiSystemId], references: [aiSystems.id] }),
  regulationClause: one(regulationClauses, {
    fields: [obligations.regulationClauseId],
    references: [regulationClauses.id]
  })
}));
