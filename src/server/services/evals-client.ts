/** Client for the Python evaluation service (services/evals). */

export type EvalCase = {
  input: string;
  output: string;
  passed: boolean;
  score: number;
  rationale: string;
  expected?: string | null;
};

export type EvalServiceResult = {
  type: string;
  score: number;
  passed: boolean;
  threshold: number;
  summary: string;
  model_used: string;
  cases: EvalCase[];
};

export function isEvalsServiceConfigured(): boolean {
  return Boolean(process.env.EVALS_SERVICE_URL);
}

/** Runs one evaluation on the evals service. Throws if it is not reachable. */
export async function runOnEvalsService(input: {
  type: string;
  agentName: string;
  systemPrompt?: string | null;
  model?: string | null;
  threshold: number;
}): Promise<EvalServiceResult> {
  const baseUrl = process.env.EVALS_SERVICE_URL;
  if (!baseUrl) throw new Error('EVALS_SERVICE_URL is not set.');

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.EVALS_SERVICE_API_KEY ?? ''
    },
    body: JSON.stringify({
      type: input.type,
      agent_name: input.agentName,
      system_prompt: input.systemPrompt ?? null,
      model: input.model ?? null,
      threshold: input.threshold
    }),
    // Do not hang a request if the service is slow or down.
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) {
    throw new Error(`Evals service responded ${response.status}`);
  }
  return (await response.json()) as EvalServiceResult;
}
