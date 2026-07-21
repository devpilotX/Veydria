# @veydria/sdk

The TypeScript SDK for Veydria. Stream what your AI agents do in production into an append only, hash chained audit log, and let Veydria watch for policy breaches.

## Install

```bash
pnpm add @veydria/sdk
```

## Use

Create an API key in Veydria under Settings, then:

```ts
import { Veydria } from '@veydria/sdk';

const ap = new Veydria({
  apiKey: process.env.VEYDRIA_API_KEY!,
  baseUrl: 'https://app.veydria.com'
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

`agentExternalId` matches the external id you set on the agent in Veydria. You can also pass `agentId` if you have the Veydria id.

## Build

```bash
pnpm install
pnpm build
```

## License

MIT
