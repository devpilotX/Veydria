/**
 * Single source of truth for product branding.
 *
 * Rename the product from here. Every screen, email, and document
 * reads from this file, so changing `name` updates the whole app.
 */

export const brand = {
  name: 'AgentProof',
  // Legal entity used in contracts, invoices, and legal pages.
  legalName: 'AgentProof, Inc.',
  // One line that explains what we do, used in hero sections and meta tags.
  tagline: 'Prove your AI agents are compliant',
  // A fuller description for meta tags and store listings.
  description:
    'AgentProof helps teams govern, test, and document their AI agents against the EU AI Act, NIST AI RMF, and ISO 42001. Discover every system, classify its risk, run evaluations, monitor production, and keep evidence ready for auditors.',
  // Marketing domain. Override with NEXT_PUBLIC_APP_URL in production.
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://agentproof.io',
  // Handles and links used in footers and structured data.
  social: {
    twitter: '@agentproof',
    github: 'https://github.com/agentproof/agentproof',
    linkedin: 'https://www.linkedin.com/company/agentproof'
  },
  contact: {
    sales: 'sales@agentproof.io',
    support: 'support@agentproof.io',
    security: 'security@agentproof.io',
    privacy: 'privacy@agentproof.io',
    legal: 'legal@agentproof.io'
  },
  // Registered address shown on legal pages and invoices.
  address: {
    line1: '2261 Market Street',
    line2: 'Suite 4210',
    city: 'San Francisco',
    region: 'CA',
    postalCode: '94114',
    country: 'United States'
  }
} as const;

export type Brand = typeof brand;
