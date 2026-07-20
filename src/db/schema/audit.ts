import { relations } from 'drizzle-orm';
import {
  bigint,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core';
import { auditActorType } from './enums';
import { organizations } from './identity';

/**
 * The audit log is append only. Each row stores the hash of the row before it
 * in the same organization's chain, plus its own hash computed with an HMAC
 * key. Changing or removing a past row breaks every hash after it, which the
 * verify endpoint detects. A database trigger (installed in the migrate step)
 * blocks updates and deletes as a second line of defence.
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    // Monotonic sequence within an organization, starting at 1.
    seq: bigint('seq', { mode: 'number' }).notNull(),
    actorType: auditActorType('actor_type').notNull(),
    actorId: text('actor_id'),
    actorLabel: text('actor_label'),
    // Dotted action name, for example ai_system.created or evaluation.completed.
    action: text('action').notNull(),
    resourceType: text('resource_type'),
    resourceId: text('resource_id'),
    data: jsonb('data').$type<Record<string, unknown>>(),
    prevHash: text('prev_hash'),
    hash: text('hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('audit_log_org_seq_unique').on(table.organizationId, table.seq),
    index('audit_log_org_time_idx').on(table.organizationId, table.createdAt)
  ]
);

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLog.organizationId],
    references: [organizations.id]
  })
}));
