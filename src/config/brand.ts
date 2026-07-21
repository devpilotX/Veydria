/**
 * Single source of truth for product branding.
 *
 * Rename the product from here. Every screen, email, and document
 * reads from this file, so changing `name` updates the whole app.
 */

export const brand = {
  name: 'Veydria',
  // Legal entity used in contracts, invoices, and legal pages.
  legalName: 'Veydria, Inc.',
  // One line that explains what we do, used in hero sections and meta tags.
  tagline: 'Proof for every AI decision',
  // A fuller description for meta tags and store listings.
  description:
    'Veydria helps teams govern, test, and document their AI agents against the EU AI Act, NIST AI RMF, and ISO 42001. Discover every system, classify its risk, run evaluations, monitor production, and keep evidence ready for auditors.',
  // Marketing domain. Override with NEXT_PUBLIC_APP_URL in production.
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://veydria.com',
  // Handles and links used in footers and structured data.
  social: {
    twitter: '@veydria',
    github: 'https://github.com/veydria/veydria',
    linkedin: 'https://www.linkedin.com/company/veydria'
  },
  contact: {
    sales: 'sales@veydria.com',
    support: 'support@veydria.com',
    security: 'security@veydria.com',
    privacy: 'privacy@veydria.com',
    legal: 'legal@veydria.com'
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
