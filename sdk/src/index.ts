/**
 * AgentProof TypeScript SDK.
 *
 * A tiny, dependency free client for streaming agent activity into AgentProof.
 * Works in Node 18 and newer and in any runtime with a global fetch.
 *
 * Quick start:
 *
 *   import { AgentProof } from '@agentproof/sdk';
 *
 *   const ap = new AgentProof({ apiKey: process.env.AGENTPROOF_API_KEY! });
 *   await ap.track({
 *     agentExternalId: 'support-copilot',
 *     input: userMessage,
 *     output: modelReply,
 *     latencyMs: 420
 *   });
 */

export type AgentEventType =
  | 'invocation'
  | 'output'
  | 'tool_call'
  | 'error'
  | 'policy_check'
  | 'decision';

export interface AgentEvent {
  /** The AgentProof agent id, if you have it. */
  agentId?: string;
  /** Your own id for the agent, matched to the one registered in AgentProof. */
  agentExternalId?: string;
  eventType?: AgentEventType;
  input?: string;
  output?: string;
  latencyMs?: number;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  metadata?: Record<string, unknown>;
  /** ISO string or Date. Defaults to now on the server. */
  occurredAt?: string | Date;
}

export interface AgentProofOptions {
  apiKey: string;
  /** Defaults to https://app.agentproof.io */
  baseUrl?: string;
  /** Optional custom fetch, useful for tests. */
  fetch?: typeof fetch;
}

export interface IngestResult {
  accepted: number;
  flagged: number;
}

export class AgentProofError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'AgentProofError';
    this.status = status;
  }
}

export class AgentProof {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: AgentProofOptions) {
    if (!options.apiKey) throw new Error('AgentProof needs an apiKey.');
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? 'https://app.agentproof.io').replace(/\/$/, '');
    const resolvedFetch = options.fetch ?? globalThis.fetch;
    if (!resolvedFetch) {
      throw new Error('No fetch available. Pass options.fetch on older runtimes.');
    }
    this.fetchImpl = resolvedFetch;
  }

  /** Sends a single agent event. */
  async track(event: AgentEvent): Promise<IngestResult> {
    return this.trackBatch([event]);
  }

  /** Sends a batch of agent events in one request. */
  async trackBatch(events: AgentEvent[]): Promise<IngestResult> {
    const payload = {
      events: events.map((event) => ({
        ...event,
        occurredAt:
          event.occurredAt instanceof Date ? event.occurredAt.toISOString() : event.occurredAt
      }))
    };

    const response = await this.fetchImpl(`${this.baseUrl}/api/ingest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new AgentProofError(response.status, text || `Ingest failed with ${response.status}`);
    }

    return (await response.json()) as IngestResult;
  }
}

export default AgentProof;
