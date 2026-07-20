import Stripe from 'stripe';

let cached: Stripe | null | undefined;

/** Returns a Stripe client, or null when STRIPE_SECRET_KEY is not set. */
export function getStripe(): Stripe | null {
  if (cached !== undefined) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  cached = key ? new Stripe(key) : null;
  return cached;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
