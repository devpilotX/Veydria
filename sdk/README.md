# @agentproof/sdk

The TypeScript SDK for AgentProof. Stream what your AI agents do in production into an append only, hash chained audit log, and let AgentProof watch for policy breaches.

## Install

```bash
pnpm add @agentproof/sdk
```

## Use

Create an API key in AgentProof under Settings, then:

```ts
import { AgentProof } from '@agentproof/sdk';

const ap = new AgentProof({
  apiKey: process.env.AGENTPROOF_API_KEY!,
  baseUrl: 'https://app.agentproof.io'
});

await ap.track({
  agentExternalId: 'support-copilot',
  input: userMessage,
  output: modelReply,
  latencyMs: 420,
  tokensIn: 180,
  tokensOut: 90
});
```

Send many events at once:

```ts
await ap.trackBatch([
  { agentExternalId: 'support-copilot', output: 'first' },
  { agentExternalId: 'support-copilot', output: 'second' }
]);
```

`agentExternalId` matches the external id you set on the agent in AgentProof. You can also pass `agentId` if you have the AgentProof id.

## Build

```bash
pnpm install
pnpm build
```

## License

MIT
