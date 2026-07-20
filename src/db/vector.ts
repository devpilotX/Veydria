import { sql, type SQL } from 'drizzle-orm';
import { real, type PgColumn } from 'drizzle-orm/pg-core';

/**
 * Vector storage lives here so the rest of the app never depends on how
 * embeddings are stored.
 *
 * Right now embeddings are plain `real[]` columns and similarity is computed
 * by a SQL function we install in the migrate step. Native pgvector was not
 * available on the build machine (see README). When it is installed, swap the
 * column type for `vector(1536)` and change `cosineSimilarity` to use the
 * `<=>` operator. Nothing else has to change.
 */

// text-embedding-3-small returns 1536 dimensions. Keep providers consistent.
export const EMBEDDING_DIMENSIONS = 1536;

// Name of the SQL function created in the migrate step.
export const COSINE_FN = 'agentproof_cosine_similarity';

/** Defines an embedding column. Nullable so rows can exist before embedding. */
export function embedding(name: string) {
  return real(name).array();
}

/**
 * Builds a SQL expression that scores how close a stored embedding column is
 * to a query vector, from 0 (unrelated) to 1 (identical direction).
 */
export function cosineSimilarity(column: PgColumn, query: number[]): SQL<number> {
  const vectorLiteral = sql.raw(`ARRAY[${query.join(',')}]::real[]`);
  return sql<number>`${sql.raw(COSINE_FN)}(${column}, ${vectorLiteral})`;
}

/** The plpgsql function that powers cosine similarity search inside Postgres. */
export const cosineSimilarityFunctionSql = `
CREATE OR REPLACE FUNCTION ${COSINE_FN}(a real[], b real[])
RETURNS double precision AS $$
DECLARE
  dot double precision := 0;
  norm_a double precision := 0;
  norm_b double precision := 0;
  i int;
BEGIN
  IF a IS NULL OR b IS NULL OR array_length(a, 1) IS DISTINCT FROM array_length(b, 1) THEN
    RETURN NULL;
  END IF;
  FOR i IN 1..array_length(a, 1) LOOP
    dot := dot + (a[i] * b[i]);
    norm_a := norm_a + (a[i] * a[i]);
    norm_b := norm_b + (b[i] * b[i]);
  END LOOP;
  IF norm_a = 0 OR norm_b = 0 THEN
    RETURN 0;
  END IF;
  RETURN dot / (sqrt(norm_a) * sqrt(norm_b));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
`;
