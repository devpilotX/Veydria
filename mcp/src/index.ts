/**
 * Veydria MCP server.
 *
 * Exposes Veydria as tools an AI agent can call: report activity, look up
 * the systems and obligations it belongs to, and verify the audit trail. It
 * authenticates with an organization API key and talks to the Veydria HTTP
 * API, so it runs anywhere the API is reachable.
 *
 * Run it from the repo root so it can resolve dependencies:
 *   VEYDRIA_API_KEY=ap_live_... VEYDRIA_BASE_URL=http://localhost:3000 \
 *     pnpm exec tsx mcp/src/index.ts
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const apiKey = process.env.VEYDRIA_API_KEY;
const baseUrl = (process.env.VEYDRIA_BASE_URL ?? 'https://app.veydria.com').replace(/\/$/, '');

if (!apiKey) {
  console.error('Set VEYDRIA_API_KEY before starting the MCP server.');
  process.exit(1);
}

async function apiFetch(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...init?.headers
    }
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Veydria API ${response.status}: ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

const server = new McpServer({ name: 'veydria', version: '0.1.0' });

server.tool(
  'track_agent_event',
  'Record one action or output from an AI agent in the Veydria audit trail.',
  {
    agentExternalId: z.string().optional(),
    agentId: z.string().optional(),
    eventType: z
      .enum(['invocation', 'output', 'tool_call', 'error', 'policy_check', 'decision'])
      .optional(),
    input: z.string().optional(),
    output: z.string().optional()
  },
  async (args) => {
    const data = await apiFetch('/api/ingest', {
      method: 'POST',
      body: JSON.stringify({ events: [args] })
    });
    return textResult(data);
  }
);

server.tool('list_ai_systems', 'List the AI systems in the Veydria workspace.', {}, async () => {
  return textResult(await apiFetch('/api/v1/systems'));
});

server.tool(
  'get_obligations',
  'List compliance obligations, optionally for one AI system.',
  { aiSystemId: z.string().optional() },
  async (args) => {
    const query = args.aiSystemId ? `?aiSystemId=${encodeURIComponent(args.aiSystemId)}` : '';
    return textResult(await apiFetch(`/api/v1/obligations${query}`));
  }
);

server.tool(
  'verify_audit_trail',
  'Check that the Veydria audit log hash chain is intact.',
  {},
  async () => {
    return textResult(await apiFetch('/api/v1/audit/verify'));
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Veydria MCP server is running on stdio.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
