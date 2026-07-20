import { pseudoEmbedding } from '@/lib/embedding-fallback';

/**
 * A small provider agnostic gateway. It picks a provider from LLM_PROVIDER and
 * falls back to a deterministic local result when no API key is set, so the app
 * runs end to end offline. Swapping providers is a config change, not a code
 * change.
 */
export type LlmProvider = 'openai' | 'anthropic' | 'google';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

function provider(): LlmProvider {
  const value = (process.env.LLM_PROVIDER ?? 'openai').toLowerCase();
  if (value === 'anthropic' || value === 'google') return value;
  return 'openai';
}

export function isLlmConfigured(): boolean {
  const key = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY
  }[provider()];
  return Boolean(key);
}

/** Embeds text. Uses OpenAI when configured, otherwise the local fallback. */
export async function embed(text: string): Promise<number[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return pseudoEmbedding(text);

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text })
    });
    if (!response.ok) return pseudoEmbedding(text);
    const json = (await response.json()) as { data: Array<{ embedding: number[] }> };
    return json.data[0]?.embedding ?? pseudoEmbedding(text);
  } catch {
    return pseudoEmbedding(text);
  }
}

export type CompleteInput = {
  system?: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
};

/** Runs a single completion through the configured provider. */
export async function complete(input: CompleteInput): Promise<string> {
  const active = provider();
  try {
    if (active === 'openai' && process.env.OPENAI_API_KEY) return await openai(input);
    if (active === 'anthropic' && process.env.ANTHROPIC_API_KEY) return await anthropic(input);
    if (active === 'google' && process.env.GOOGLE_GENERATIVE_AI_API_KEY) return await google(input);
  } catch (error) {
    console.error('LLM completion failed, using fallback', error);
  }
  return fallbackCompletion(input);
}

async function openai(input: CompleteInput): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: input.model ?? process.env.LLM_DEFAULT_MODEL ?? 'gpt-4o-mini',
      max_tokens: input.maxTokens ?? 1200,
      messages: [
        ...(input.system ? [{ role: 'system', content: input.system }] : []),
        { role: 'user', content: input.prompt }
      ]
    })
  });
  const json = (await response.json()) as { choices: Array<{ message: { content: string } }> };
  return json.choices[0]?.message?.content ?? fallbackCompletion(input);
}

async function anthropic(input: CompleteInput): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: input.model ?? 'claude-3-5-sonnet-latest',
      max_tokens: input.maxTokens ?? 1200,
      system: input.system,
      messages: [{ role: 'user', content: input.prompt }]
    })
  });
  const json = (await response.json()) as { content: Array<{ text: string }> };
  return json.content[0]?.text ?? fallbackCompletion(input);
}

async function google(input: CompleteInput): Promise<string> {
  const model = input.model ?? 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { parts: [{ text: `${input.system ? input.system + '\n\n' : ''}${input.prompt}` }] }
      ]
    })
  });
  const json = (await response.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return json.candidates[0]?.content?.parts[0]?.text ?? fallbackCompletion(input);
}

// Used when no provider key is set. Honest placeholder, clearly marked.
function fallbackCompletion(input: CompleteInput): string {
  return [
    'Generated without a language model because no provider key is configured.',
    'Set LLM_PROVIDER and the matching API key to get model written prose.',
    '',
    input.prompt.slice(0, 500)
  ].join('\n');
}
