import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { planTier, subscriptionStatus } from './enums';
import { organizations } from './identity';

/**
 * One subscription per organization. This mirrors the state held in Stripe and
 * Clerk Billing so the app can gate features without calling out on every
 * request. Webhooks keep it current.
 */
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .unique()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  plan: planTier('plan').notNull().default('free'),
  status: subscriptionStatus('status').notNull().default('trialing'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  seats: integer('seats').notNull().default(1),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id]
  })
}));
