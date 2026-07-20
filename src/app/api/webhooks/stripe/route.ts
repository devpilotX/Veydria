import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { PLANS, PLAN_ORDER, type PlanKey } from '@/config/plans';
import { getStripe } from '@/lib/stripe';
import { syncSubscriptionFromStripe } from '@/server/services/billing';

// Maps a Stripe price id back to one of our plan keys using the configured env.
function planFromPriceId(priceId: string | undefined): PlanKey {
  if (!priceId) return 'free';
  for (const key of PLAN_ORDER) {
    const envName = PLANS[key].stripePriceEnv;
    if (envName && process.env[envName] === priceId) return key;
  }
  return 'starter';
}

async function orgIdForCustomer(customerId: string): Promise<string | null> {
  const row = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeCustomerId, customerId)
  });
  return row?.organizationId ?? null;
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: 'Billing is not configured.' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId =
        (session.metadata?.organizationId as string | undefined) ??
        session.client_reference_id ??
        undefined;
      if (organizationId && session.customer && session.subscription) {
        await syncSubscriptionFromStripe({
          organizationId,
          plan: (session.metadata?.plan as PlanKey) ?? 'starter',
          status: 'active',
          stripeCustomerId: String(session.customer),
          stripeSubscriptionId: String(session.subscription),
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false
        });
      }
    } else if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const organizationId = await orgIdForCustomer(String(sub.customer));
      if (organizationId) {
        const priceId = sub.items.data[0]?.price?.id;
        const periodEnd = sub.items.data[0]?.current_period_end;
        await syncSubscriptionFromStripe({
          organizationId,
          plan: event.type === 'customer.subscription.deleted' ? 'free' : planFromPriceId(priceId),
          status:
            event.type === 'customer.subscription.deleted' ? 'canceled' : (sub.status as never),
          stripeCustomerId: String(sub.customer),
          stripeSubscriptionId: sub.id,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          cancelAtPeriodEnd: sub.cancel_at_period_end ?? false
        });
      }
    }
  } catch (error) {
    console.error('Stripe webhook handling failed', error);
    return NextResponse.json({ error: 'Handler failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
