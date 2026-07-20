import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid
} from 'drizzle-orm/pg-core';
import { alertSource, alertStatus, alertType, monitoringEventType, severity } from './enums';
import { agents, aiSystems } from './systems';
import { organizations, users } from './identity';

/**
 * Every action an agent takes in production lands here through the ingestion
 * endpoint. This is the raw stream the audit log and the alerting rules read
 * from. It is the highest volume table, so it is indexed by time.
 */
export const monitoringEvents = pgTable(
  'monitoring_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    eventType: monitoringEventType('event_type').notNull().default('invocation'),
    input: text('input'),
    output: text('output'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    latencyMs: integer('latency_ms'),
    tokensIn: integer('tokens_in'),
    tokensOut: integer('tokens_out'),
    costUsd: real('cost_usd'),
    flagged: boolean('flagged').notNull().default(false),
    flagReason: text('flag_reason'),
    // When the event happened on the customer side.
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    // When we received it.
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('monitoring_events_org_time_idx').on(table.organizationId, table.occurredAt),
    index('monitoring_events_agent_time_idx').on(table.agentId, table.occurredAt),
    index('monitoring_events_flagged_idx').on(table.organizationId, table.flagged)
  ]
);

/**
 * An alert is raised when a rule fires: an anomaly, a policy breach, a failed
 * evaluation, model drift, or a break in the audit log hash chain.
 */
export const alerts = pgTable(
  'alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'set null' }),
    aiSystemId: uuid('ai_system_id').references(() => aiSystems.id, { onDelete: 'set null' }),
    type: alertType('type').notNull(),
    severity: severity('severity').notNull().default('medium'),
    source: alertSource('source').notNull().default('monitoring'),
    status: alertStatus('status').notNull().default('open'),
    title: text('title').notNull(),
    description: text('description'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    acknowledgedByUserId: uuid('acknowledged_by_user_id').references(() => users.id, {
      onDelete: 'set null'
    }),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('alerts_org_idx').on(table.organizationId),
    index('alerts_status_idx').on(table.organizationId, table.status)
  ]
);

export const monitoringEventsRelations = relations(monitoringEvents, ({ one }) => ({
  agent: one(agents, { fields: [monitoringEvents.agentId], references: [agents.id] })
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  agent: one(agents, { fields: [alerts.agentId], references: [agents.id] }),
  aiSystem: one(aiSystems, { fields: [alerts.aiSystemId], references: [aiSystems.id] })
}));
