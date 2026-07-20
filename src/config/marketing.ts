import { blogPosts } from '@/content/blog';

/** One entry per core feature. Feature pages render from this data. */
export type Feature = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  points: { title: string; body: string }[];
};

export const FEATURES: Feature[] = [
  {
    slug: 'discover',
    name: 'Discover',
    tagline: 'See every AI system and agent in one inventory',
    description:
      'Connect your agents through an API key, the TypeScript SDK, or the MCP server. AgentProof builds a live inventory of every model, agent, prompt, and data flow so nothing ships in the dark.',
    points: [
      {
        title: 'Three ways to connect',
        body: 'Use the SDK, the MCP server, or plain HTTP. Whatever your stack, an agent can report in.'
      },
      {
        title: 'A single source of truth',
        body: 'Every system and agent lands in one place, with its owner, model, and status.'
      },
      {
        title: 'No agent left behind',
        body: 'Shadow AI is the hard part of compliance. Discovery makes the whole estate visible.'
      }
    ]
  },
  {
    slug: 'classify',
    name: 'Classify',
    tagline: 'Know which rules apply and what you owe',
    description:
      'A transparent rules engine maps each system to its EU AI Act risk tier and the exact obligations that follow, across the EU AI Act, NIST AI RMF, and ISO 42001.',
    points: [
      {
        title: 'Risk tier in seconds',
        body: 'Describe the system and get its tier with a plain reason and the Annex reference.'
      },
      {
        title: 'Obligations, not homework',
        body: 'Each tier expands into the specific duties you have to meet, linked to the source clause.'
      },
      {
        title: 'Auditable by design',
        body: 'Every classification records why, so a reviewer can check the logic by hand.'
      }
    ]
  },
  {
    slug: 'evaluate',
    name: 'Evaluate',
    tagline: 'Test agents for bias, hallucination, and abuse',
    description:
      'Automated evaluations score each agent for bias, hallucination, prompt injection, safety, and policy violations, and gate releases that fall below your threshold.',
    points: [
      {
        title: 'Five test types',
        body: 'Bias, hallucination, prompt injection, safety, and policy, each with a score and detail.'
      },
      {
        title: 'Thresholds that gate',
        body: 'Set a pass mark. A run below it is an open risk until it passes.'
      },
      {
        title: 'A dataset that grows',
        body: 'Every run adds to your evaluation history so regressions are easy to spot.'
      }
    ]
  },
  {
    slug: 'monitor',
    name: 'Monitor',
    tagline: 'Watch production and catch problems early',
    description:
      'In production the SDK streams every agent action into an append only, hash chained audit log. Anomalies and policy breaches raise alerts before they become incidents.',
    points: [
      {
        title: 'Every action recorded',
        body: 'Inputs, outputs, latency, and cost stream in as they happen.'
      },
      {
        title: 'Rules that fire',
        body: 'Policy checks flag personal data, unsafe output, and drift.'
      },
      {
        title: 'Alerts with context',
        body: 'When something looks wrong, you get an alert linked to the exact event.'
      }
    ]
  },
  {
    slug: 'prove',
    name: 'Prove',
    tagline: 'Generate the documents auditors ask for',
    description:
      'AgentProof turns your live data into risk assessments, Annex IV technical files, model cards, and audit reports, and keeps them ready for auditors and customers.',
    points: [
      {
        title: 'Documents from data',
        body: 'No copy and paste. Documents are built from the systems, obligations, and results you already have.'
      },
      {
        title: 'Always current',
        body: 'Regenerate any document in a click when something changes.'
      },
      {
        title: 'A verifiable trail',
        body: 'The audit log proves the record has not been altered, with a check anyone can run.'
      }
    ]
  }
];

export const headerNav = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
  { label: 'Security', href: '/security' },
  { label: 'Blog', href: '/blog' }
];

export const footerGroups = [
  {
    label: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Docs', href: '/docs' }
    ]
  },
  {
    label: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Customers', href: '/customers' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
      { label: 'Blog', href: '/blog' }
    ]
  },
  {
    label: 'Trust',
    links: [
      { label: 'Security', href: '/security' },
      { label: 'Responsible AI', href: '/responsible-ai' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Sub processors', href: '/subprocessors' }
    ]
  },
  {
    label: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'DPA', href: '/dpa' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Acceptable Use', href: '/acceptable-use' }
    ]
  }
];

export const legalPages = [
  { slug: 'privacy', title: 'Privacy Policy' },
  { slug: 'terms', title: 'Terms of Service' },
  { slug: 'dpa', title: 'Data Processing Addendum' },
  { slug: 'cookies', title: 'Cookie Policy' },
  { slug: 'acceptable-use', title: 'Acceptable Use Policy' },
  { slug: 'subprocessors', title: 'Sub processors' },
  { slug: 'responsible-ai', title: 'Responsible AI' }
];

/** Every public path, used to build the sitemap. */
export function allPublicPaths(): string[] {
  const staticPaths = [
    '/',
    '/features',
    '/pricing',
    '/about',
    '/customers',
    '/integrations',
    '/docs',
    '/changelog',
    '/security',
    '/contact',
    '/careers',
    '/blog'
  ];
  const featurePaths = FEATURES.map((feature) => `/features/${feature.slug}`);
  const blogPaths = blogPosts.map((post) => `/blog/${post.slug}`);
  const legalPaths = legalPages.map((page) => `/${page.slug}`);
  return [...staticPaths, ...featurePaths, ...blogPaths, ...legalPaths];
}
