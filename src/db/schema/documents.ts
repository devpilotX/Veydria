import { relations } from 'drizzle-orm';
import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { documentStatus, documentType } from './enums';
import { aiSystems } from './systems';
import { organizations, users } from './identity';

/**
 * Documents are the proof auditors ask for: risk assessments, Annex IV
 * technical files, model cards, and audit reports. They are generated from the
 * live data, stored as markdown, and versioned.
 */
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    aiSystemId: uuid('ai_system_id').references(() => aiSystems.id, { onDelete: 'set null' }),
    type: documentType('type').notNull(),
    title: text('title').notNull(),
    status: documentStatus('status').notNull().default('draft'),
    content: text('content').notNull(),
    format: text('format').notNull().default('markdown'),
    version: integer('version').notNull().default(1),
    generatedByUserId: uuid('generated_by_user_id').references(() => users.id, {
      onDelete: 'set null'
    }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('documents_org_idx').on(table.organizationId),
    index('documents_system_idx').on(table.aiSystemId),
    index('documents_type_idx').on(table.organizationId, table.type)
  ]
);

export const documentsRelations = relations(documents, ({ one }) => ({
  aiSystem: one(aiSystems, { fields: [documents.aiSystemId], references: [aiSystems.id] })
}));
