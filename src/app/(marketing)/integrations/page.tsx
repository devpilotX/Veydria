import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Integrations',
  description:
    'AgentProof connects to the models, billing, auth, and data tools you already run: OpenAI, Anthropic, Google, Langfuse, Stripe, Clerk, Resend, PostHog, Postgres, and more.',
  path: '/integrations'
});

type Integration = {
  name: string;
  category: string;
  blurb: string;
};

const integrations: Integration[] = [
  {
    name: 'OpenAI',
    category: 'LLM gateway',
    blurb: 'Route GPT models through the provider agnostic gateway and score their output.'
  },
  {
    name: 'Anthropic',
    category: 'LLM gateway',
    blurb: 'Use Claude models with the same gateway and the same evaluation suites.'
  },
  {
    name: 'Google',
    category: 'LLM gateway',
    blurb:
      'Add Gemini models by configuration. Swapping a provider is a settings change, not a rewrite.'
  },
  {
    name: 'Langfuse',
    category: 'Observability',
    blurb: 'Send traces to Langfuse for detailed LLM observability alongside your audit log.'
  },
  {
    name: 'Stripe',
    category: 'Billing',
    blurb: 'Checkout and the billing portal for the plans that need more than Clerk Billing.'
  },
  {
    name: 'Clerk',
    category: 'Auth and organizations',
    blurb: 'Sign in, organizations, and the Owner, Admin, Member, and Viewer roles for your team.'
  },
  {
    name: 'TypeScript SDK',
    category: 'Developer',
    blurb: 'A few lines to track an agent action from any Node or edge runtime.'
  },
  {
    name: 'MCP server',
    category: 'Developer',
    blurb: 'Let agents that speak the Model Context Protocol report in with no custom glue code.'
  },
  {
    name: 'PostgreSQL with pgvector',
    category: 'Data',
    blurb: 'Your systems, results, and embeddings live in one Postgres database, search included.'
  },
  {
    name: 'Resend',
    category: 'Email',
    blurb: 'Transactional mail and alerts, written with React Email templates.'
  },
  {
    name: 'PostHog',
    category: 'Analytics',
    blurb: 'Product analytics so we can see how teams use the app and make it better.'
  }
];

export default function IntegrationsPage() {
  return (
    <div className='mx-auto max-w-6xl px-4 py-16 sm:px-6'>
      <div className='max-w-3xl'>
        <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>Integrations</h1>
        <p className='text-muted-foreground mt-4 text-lg text-pretty'>
          AgentProof fits the tools you already run. Connect your models through one gateway, keep
          your data in Postgres, and wire up billing, auth, and alerts without leaving the workflow.
        </p>
      </div>

      <div className='mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {integrations.map((item) => (
          <div key={item.name} className='border-border rounded-xl border p-6'>
            <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              {item.category}
            </p>
            <h2 className='mt-2 text-lg font-medium'>{item.name}</h2>
            <p className='text-muted-foreground mt-2 text-sm'>{item.blurb}</p>
          </div>
        ))}
      </div>

      <p className='text-muted-foreground mt-10 max-w-2xl text-sm'>
        Need a connection that is not listed here? The SDK and the REST ingest endpoint accept
        events from any stack, so most tools can report in today. Tell us what you use and we will
        help you wire it up.
      </p>
    </div>
  );
}
