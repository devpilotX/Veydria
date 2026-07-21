import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Changelog',
  description:
    'What is new in Veydria: audit log verification, the MCP server, evaluation suites, risk classification, and the document generator.',
  path: '/changelog'
});

type ChangelogEntry = {
  date: string;
  title: string;
  body: string;
};

const entries: ChangelogEntry[] = [
  {
    date: '2026-06-12',
    title: 'One click audit log verification',
    body: 'Verify the whole hash chain from the dashboard. If any past entry was changed, the check points to the exact row where the chain breaks, so you can trust the record or find the problem fast.'
  },
  {
    date: '2026-05-20',
    title: 'MCP server is generally available',
    body: 'Connect agents that speak the Model Context Protocol without writing custom code. Point the server at your API key and actions start flowing into the inventory and the audit log.'
  },
  {
    date: '2026-04-15',
    title: 'Five evaluation suites',
    body: 'Bias, hallucination, prompt injection, safety, and policy checks now run as separate suites. Each has its own score and its own pass threshold, so a release can be gated on the tests that matter for that system.'
  },
  {
    date: '2026-03-08',
    title: 'Risk classification with source citations',
    body: 'Every risk tier now links to the exact EU AI Act clause behind it. A reviewer can trace each decision by hand, and the reasoning is stored next to the system it describes.'
  },
  {
    date: '2026-02-02',
    title: 'Document generator',
    body: 'Generate risk assessments, Annex IV technical files, model cards, and audit reports straight from your live data. When a system changes, regenerate the document in a click rather than editing it by hand.'
  }
];

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(iso));
}

export default function ChangelogPage() {
  return (
    <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6'>
      <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>Changelog</h1>
      <p className='text-muted-foreground mt-4 text-lg text-pretty'>
        A running list of what we have shipped. We post the changes that affect how you work, not
        every internal tweak.
      </p>

      <ol className='mt-12 space-y-10'>
        {entries.map((entry) => (
          <li key={entry.date} className='border-border border-l pl-6'>
            <time dateTime={entry.date} className='text-muted-foreground text-sm'>
              {formatDate(entry.date)}
            </time>
            <h2 className='mt-1 text-xl font-medium'>{entry.title}</h2>
            <p className='text-muted-foreground mt-2'>{entry.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
