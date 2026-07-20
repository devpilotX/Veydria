import { describe, expect, it } from 'vitest';
import { pseudoEmbedding } from './embedding-fallback';

describe('pseudoEmbedding', () => {
  it('returns a vector of the requested length', () => {
    expect(pseudoEmbedding('hello', 16)).toHaveLength(16);
  });

  it('is deterministic for the same input', () => {
    expect(pseudoEmbedding('regulation text', 32)).toEqual(pseudoEmbedding('regulation text', 32));
  });

  it('differs for different input', () => {
    expect(pseudoEmbedding('one', 32)).not.toEqual(pseudoEmbedding('two', 32));
  });

  it('is roughly unit length', () => {
    const vector = pseudoEmbedding('normalize me', 64);
    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    expect(magnitude).toBeCloseTo(1, 5);
  });
});
