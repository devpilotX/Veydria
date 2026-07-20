import { EMBEDDING_DIMENSIONS } from '@/db/vector';

/**
 * A deterministic stand in for a real embedding. The LLM gateway uses this when
 * no embedding API key is set, and the seed uses it so demo search works
 * without any external service. Same input always gives the same vector, and
 * similar strings do not magically cluster, so treat results as illustrative.
 */
export function pseudoEmbedding(text: string, dimensions: number = EMBEDDING_DIMENSIONS): number[] {
  let seed = 2166136261;
  for (let i = 0; i < text.length; i++) {
    seed ^= text.charCodeAt(i);
    seed = Math.imul(seed, 16777619) >>> 0;
  }

  const out: number[] = Array.from({ length: dimensions }, () => 0);
  let x = seed || 1;
  for (let i = 0; i < dimensions; i++) {
    // xorshift32, a small deterministic pseudo random generator.
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    out[i] = (x / 0xffffffff) * 2 - 1;
  }

  const norm = Math.sqrt(out.reduce((sum, value) => sum + value * value, 0)) || 1;
  return out.map((value) => value / norm);
}
