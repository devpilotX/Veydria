export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO date
  author: string;
  readingMinutes: number;
  // Body as an array of paragraphs and headings. Keep it plain and human.
  body: Array<{ type: 'h2' | 'p'; text: string }>;
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'eu-ai-act-risk-classification',
    title: 'How to classify an AI system under the EU AI Act',
    description:
      'A practical walk through of the risk tiers in the EU AI Act and how to work out which one your system falls into.',
    date: '2026-03-18',
    author: 'Dana Okafor',
    readingMinutes: 6,
    body: [
      {
        type: 'p',
        text: 'The EU AI Act sorts systems into tiers. The tier decides how much work you have to do, so getting it right early saves a lot of back and forth later.'
      },
      { type: 'h2', text: 'Start with what the system does' },
      {
        type: 'p',
        text: 'Classification is about use, not technology. A model is not high risk on its own. It becomes high risk when you point it at something the Act lists in Annex III, like screening job applicants or judging creditworthiness.'
      },
      { type: 'h2', text: 'The four tiers' },
      {
        type: 'p',
        text: 'Prohibited uses are off the table, for example social scoring. High risk uses carry the full set of duties: risk management, data governance, logging, human oversight, and technical documentation. Limited risk mostly means transparency, so people know they are dealing with AI. Minimal risk carries no specific duties, though good practice still applies.'
      },
      { type: 'h2', text: 'Write down your reasoning' },
      {
        type: 'p',
        text: 'Whatever tier you land on, record why. An auditor will ask. A short paragraph that points to the specific Annex III entry, or explains why none apply, is usually enough. Veydria does this step for you and keeps the reasoning next to the system.'
      }
    ]
  },
  {
    slug: 'why-ai-agents-need-an-audit-log',
    title: 'Why your AI agents need an append only audit log',
    description:
      'When an AI agent makes a call that affects someone, you need to be able to show what happened. Here is why a hash chained log matters.',
    date: '2026-05-02',
    author: 'Sam Rivera',
    readingMinutes: 5,
    body: [
      {
        type: 'p',
        text: 'Agents act quickly and often. When one of those actions is questioned weeks later, a vague memory is not enough. You need a record you can stand behind.'
      },
      { type: 'h2', text: 'Logs that can change are not evidence' },
      {
        type: 'p',
        text: 'A normal log can be edited. That is fine for debugging, but it does not prove anything. If a row can be quietly changed, an auditor cannot trust any of it.'
      },
      { type: 'h2', text: 'Hash chaining, in plain terms' },
      {
        type: 'p',
        text: 'Each entry stores a fingerprint of the entry before it. Change one old row and every fingerprint after it stops matching. That break is easy to detect and hard to hide, which is exactly what you want from an audit trail.'
      },
      { type: 'h2', text: 'What to capture' },
      {
        type: 'p',
        text: 'Record who or what acted, what they did, when, and the data involved. Keep it append only. Veydria streams agent activity into a chain like this and lets you verify it on demand.'
      }
    ]
  }
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
