/**
 * Plan catalog. Prices are placeholders. When Stripe is connected, set the
 * price IDs from environment variables so the same plan keys map to real
 * Stripe prices. Feature gating reads `limits` and `features` from here.
 */
export type PlanKey = 'free' | 'starter' | 'growth' | 'scale' | 'enterprise';

export type Plan = {
  key: PlanKey;
  name: string;
  priceMonthly: number | null; // null means talk to sales
  blurb: string;
  features: string[];
  limits: {
    aiSystems: number | null; // null means unlimited
    seats: number | null;
    monitoringEventsPerMonth: number | null;
  };
  stripePriceEnv?: string;
};

export const PLANS: Record<PlanKey, Plan> = {
  free: {
    key: 'free',
    name: 'Free',
    priceMonthly: 0,
    blurb: 'Try the workflow on a single system.',
    features: ['1 AI system', 'Risk classification', 'Manual evaluations', 'Community support'],
    limits: { aiSystems: 1, seats: 2, monitoringEventsPerMonth: 5000 }
  },
  starter: {
    key: 'starter',
    name: 'Starter',
    priceMonthly: 99,
    blurb: 'For a small team shipping its first AI features.',
    features: [
      'Up to 5 AI systems',
      'Automated evaluations',
      'Monitoring and alerts',
      'Email support'
    ],
    limits: { aiSystems: 5, seats: 5, monitoringEventsPerMonth: 100000 },
    stripePriceEnv: 'STRIPE_PRICE_STARTER'
  },
  growth: {
    key: 'growth',
    name: 'Growth',
    priceMonthly: 399,
    blurb: 'For teams with several systems under review.',
    features: [
      'Up to 25 AI systems',
      'All evaluation suites',
      'Audit ready documents',
      'Priority support'
    ],
    limits: { aiSystems: 25, seats: 20, monitoringEventsPerMonth: 1000000 },
    stripePriceEnv: 'STRIPE_PRICE_GROWTH'
  },
  scale: {
    key: 'scale',
    name: 'Scale',
    priceMonthly: 999,
    blurb: 'For companies with AI across many products.',
    features: ['Unlimited AI systems', 'SSO and SAML', 'Custom evaluations', 'Dedicated support'],
    limits: { aiSystems: null, seats: 100, monitoringEventsPerMonth: null },
    stripePriceEnv: 'STRIPE_PRICE_SCALE'
  },
  enterprise: {
    key: 'enterprise',
    name: 'Enterprise',
    priceMonthly: null,
    blurb: 'For regulated organizations with custom needs.',
    features: [
      'Everything in Scale',
      'On premise option',
      'Custom DPA and terms',
      'Named account team'
    ],
    limits: { aiSystems: null, seats: null, monitoringEventsPerMonth: null }
  }
};

export const PLAN_ORDER: PlanKey[] = ['free', 'starter', 'growth', 'scale', 'enterprise'];
