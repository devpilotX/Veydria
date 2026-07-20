import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { buildMetadata, baseUrl } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Docs',
  description:
    'Quickstart for AgentProof: create an API key, install the TypeScript SDK, track an agent action, connect over MCP, or send events with plain HTTP.',
  path: '/docs'
});

const installExample = `pnpm add @agentproof/sdk`;

const trackExample = `import { AgentProof } from '@agentproof/sdk';

const agentproof = new AgentProof({ apiKey: process.env.AGENTPROOF_API_KEY });

await agentproof.track({
  agentExternalId: 'support-bot',
  input: userMessage,
  output: modelReply
});`;

const mcpExample = `{
  "mcpServers": {
    "agentproof": {
      "command": "npx",
      "args": ["-y", "@agentproof/mcp"],
      "env": { "AGENTPROOF_API_KEY": "your_key_here" }
    }
  }
}`;

const ingestExample = `curl -X POST ${baseUrl}/api/ingest \\
  -H "Authorization: Bearer $AGENTPROOF_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentExternalId": "support-bot",
    "input": "How do I reset my password?",
    "output": "Open Settings, then Security, then Reset password."
  }'`;

export default function DocsPage() {
  return (
    <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6'>
      <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>Docs</h1>
      <p className='text-muted-foreground mt-4 text-lg text-pretty'>
        This quickstart takes you from a fresh account to your first tracked agent action. Pick the
        path that suits your stack: the SDK, the MCP server, or plain HTTP. All three send events to
        the same place.
      </p>
      <p className='text-muted-foreground mt-3 text-sm'>
        Your API key is scoped to one organization. Treat it like a password and read it from an
        environment variable rather than hard coding it.
      </p>

      <section className='mt-12'>
        <h2 className='text-xl font-semibold'>1. Create an API key</h2>
        <p className='text-muted-foreground mt-2'>
          Open Settings in the dashboard, go to API keys, and create one for the organization you
          want to track. Copy it once and store it as <code>AGENTPROOF_API_KEY</code> in your
          environment. You can revoke a key at any time without affecting the others.
        </p>
      </section>

      <section className='mt-10'>
        <h2 className='text-xl font-semibold'>2. Install the SDK</h2>
        <p className='text-muted-foreground mt-2'>
          The TypeScript SDK works in any Node or edge runtime.
        </p>
        <pre className='mt-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm'>
          <code>{installExample}</code>
        </pre>
      </section>

      <section className='mt-10'>
        <h2 className='text-xl font-semibold'>3. Track an agent action</h2>
        <p className='text-muted-foreground mt-2'>
          Call <code>track</code> after your agent produces a result. Pass a stable
          <code> agentExternalId</code> so events line up with the right agent in your inventory.
          The call is non blocking and safe to run in production paths.
        </p>
        <pre className='mt-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm'>
          <code>{trackExample}</code>
        </pre>
      </section>

      <section className='mt-10'>
        <h2 className='text-xl font-semibold'>4. Connect over MCP</h2>
        <p className='text-muted-foreground mt-2'>
          If your agent speaks the Model Context Protocol, add the AgentProof MCP server to your
          client config. It reports actions in for you, so there is no custom code to maintain.
        </p>
        <pre className='mt-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm'>
          <code>{mcpExample}</code>
        </pre>
      </section>

      <section className='mt-10'>
        <h2 className='text-xl font-semibold'>5. Send events with plain HTTP</h2>
        <p className='text-muted-foreground mt-2'>
          No SDK on your platform? Post to the ingest endpoint with a bearer token. The body matches
          the SDK payload, so you can move between the two later without changing your data.
        </p>
        <pre className='mt-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm'>
          <code>{ingestExample}</code>
        </pre>
      </section>

      <section className='mt-12'>
        <h2 className='text-xl font-semibold'>Next steps</h2>
        <p className='text-muted-foreground mt-2'>
          Once events are flowing, classify the system to see its risk tier, run an evaluation, and
          generate your first document. Each step reads from the data you just connected.
        </p>
        <div className='mt-6 flex flex-wrap gap-3'>
          <Button render={<Link href='/auth/sign-up' />}>Create an account</Button>
          <Button variant='outline' render={<Link href='/features' />}>
            See the workflow
          </Button>
        </div>
      </section>
    </div>
  );
}
