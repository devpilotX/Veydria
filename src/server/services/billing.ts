// Deferred for launch. Billing is hidden in the UI (the billing dashboard page
// is a placeholder and the nav entry is removed). This custom Stripe layer is
// kept in place but unused, to be wired up after first-user feedback. The Stripe
// webhook and /api/billing route remain so it can be turned on without a rebuild.
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { organizations, subscriptions } from '@/db/schema';
import { PLANS, type PlanKey } from '@/config/plans';
import { badRequest } from '@/lib/api/errors';
import type { TenantContext } from '@/lib/auth/tenant';
import { getStripe } from '@/lib/stripe';
import { appendAuditLog } from './audit';

/** Returns the organization's subscription, creating a free one if missing. */
export async function getSubscription(ctx: TenantContext) {
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, ctx.organizationId)
  });
  if (existing) return existing;

  const [created] = await db
    .insert(subscriptions)
    .values({ organizationId: ctx.organizationId, plan: 'free', status: 'trialing' })
    .onConflictDoNothing({ target: subscriptions.organizationId })
    .returning();
  if (created) return created;

  const row = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, ctx.organizationId)
  });
  if (!row) throw new Error('Failed to resolve subscription');
  return row;
}

/** True when the org's plan is at least the required plan. */
export async function planAtLeast(ctx: TenantContext, required: PlanKey): Promise<boolean> {
  const sub = await getSubscription(ctx);
  const order: PlanKey[] = ['free', 'starter', 'growth', 'scale', 'enterprise'];
  return order.indexOf(sub.plan) >= order.indexOf(required);
}

/** Starts a Stripe Checkout session for a plan and returns the redirect URL. */
export async function createCheckoutSession(
  ctx: TenantContext,
  planKey: PlanKey,
  returnUrl: string
) {
  const stripe = getStripe();
  if (!stripe) throw badRequest('Billing is not configured on this environment.');

  const plan = PLANS[planKey];
  const priceId = plan.stripePriceEnv ? process.env[plan.stripePriceEnv] : undefined;
  if (!priceId) throw badRequest(`No Stripe price is configured for the ${plan.name} plan.`);

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, ctx.organizationId)
  });

  const sub = await getSubscription(ctx);
  const customerId = sub.stripeCustomerId ?? undefined;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer: customerId,
    client_reference_id: ctx.organizationId,
    metadata: { organizationId: ctx.organizationId, plan: planKey, orgName: org?.name ?? '' },
    success_url: `${returnUrl}?billing=success`,
    cancel_url: `${returnUrl}?billing=cancelled`
  });

  await appendAuditLog({
    organizationId: ctx.organizationId,
    actorType: 'user',
    actorId: ctx.clerkUserId,
    action: 'billing.checkout_started',
    resourceType: 'subscription',
    resourceId: sub.id,
    data: { plan: planKey }
  });

  return session.url;
}

/** Opens the Stripe billing portal for the org's customer. */
export async function createPortalSession(ctx: TenantContext, returnUrl: string) {
  const stripe = getStripe();
  if (!stripe) throw badRequest('Billing is not configured on this environment.');
  const sub = await getSubscription(ctx);
  if (!sub.stripeCustomerId) throw badRequest('This organization has no billing account yet.');

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: returnUrl
  });
  return session.url;
}

/** Applies subscription state from a Stripe webhook to our mirror table. */
export async function syncSubscriptionFromStripe(params: {
  organizationId: string;
  plan: PlanKey;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}) {
  await db
    .insert(subscriptions)
    .values({
      organizationId: params.organizationId,
      plan: params.plan,
      status: params.status,
      stripeCustomerId: params.stripeCustomerId,
      stripeSubscriptionId: params.stripeSubscriptionId,
      currentPeriodEnd: params.currentPeriodEnd,
      cancelAtPeriodEnd: params.cancelAtPeriodEnd
    })
    .onConflictDoUpdate({
      target: subscriptions.organizationId,
      set: {
        plan: params.plan,
        status: params.status,
        stripeCustomerId: params.stripeCustomerId,
        stripeSubscriptionId: params.stripeSubscriptionId,
        currentPeriodEnd: params.currentPeriodEnd,
        cancelAtPeriodEnd: params.cancelAtPeriodEnd,
        updatedAt: new Date()
      }
    });

  await appendAuditLog({
    organizationId: params.organizationId,
    actorType: 'system',
    actorId: 'stripe',
    action: 'billing.subscription_updated',
    resourceType: 'subscription',
    resourceId: params.stripeSubscriptionId,
    data: { plan: params.plan, status: params.status }
  });
}
