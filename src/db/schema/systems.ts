import { relations } from 'drizzle-orm';
import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { agentStatus, agentType, riskTier, systemLifecycle, systemStatus } from './enums';
import { organizations, users } from './identity';

/**
 * An AI system is the unit that regulations classify. The EU AI Act cares
 * about its purpose, who operates it, and where it runs. Agents are the
 * running parts of a system that we test and monitor.
 */
export const aiSystems = pgTable(
  'ai_systems',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    // What the system is used for, in plain language. Drives classification.
    purpose: text('purpose'),
    // Industry the system operates in, for example fintech or hr.
    domain: text('domain'),
    // customer_facing, internal, or research. Affects transparency duties.
    deploymentContext: text('deployment_context'),
    // The organization's role under the EU AI Act: provider or deployer.
    actorRole: text('actor_role').notNull().default('provider'),
    lifecycle: systemLifecycle('lifecycle').notNull().default('development'),
    status: systemStatus('status').notNull().default('draft'),
    riskTier: riskTier('risk_tier').notNull().default('unknown'),
    // Set when the rules engine last classified the system.
    classifiedAt: timestamp('classified_at', { withTimezone: true }),
    classificationRationale: text('classification_rationale'),
    ownerName: text('owner_name'),
    ownerEmail: text('owner_email'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null'
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('ai_systems_org_idx').on(table.organizationId),
    index('ai_systems_risk_idx').on(table.organizationId, table.riskTier)
  ]
);

export const agents = pgTable(
  'agents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    aiSystemId: uuid('ai_system_id')
      .notNull()
      .references(() => aiSystems.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    type: agentType('type').notNull().default('assistant'),
    modelProvider: text('model_provider'),
    modelName: text('model_name'),
    systemPrompt: text('system_prompt'),
    status: agentStatus('status').notNull().default('active'),
    // The customer's own identifier for this agent, sent by the SDK.
    externalId: text('external_id'),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('agents_org_idx').on(table.organizationId),
    index('agents_system_idx').on(table.aiSystemId)
  ]
);

export const aiSystemsRelations = relations(aiSystems, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [aiSystems.organizationId],
    references: [organizations.id]
  }),
  agents: many(agents)
}));

export const agentsRelations = relations(agents, ({ one }) => ({
  organization: one(organizations, {
    fields: [agents.organizationId],
    references: [organizations.id]
  }),
  aiSystem: one(aiSystems, { fields: [agents.aiSystemId], references: [aiSystems.id] })
}));
