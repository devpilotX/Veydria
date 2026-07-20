import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { regulationClauses, regulations } from '@/db/schema';
import { cosineSimilarity } from '@/db/vector';
import { embed } from '@/server/llm/gateway';

export const searchClausesSchema = z.object({
  q: z.string().min(2).max(400),
  limit: z.coerce.number().int().min(1).max(25).default(8),
  code: z.enum(['eu_ai_act', 'nist_ai_rmf', 'iso_42001']).optional()
});

export type SearchClausesInput = z.infer<typeof searchClausesSchema>;

export async function listRegulations() {
  const regs = await db.select().from(regulations).orderBy(regulations.name);
  const counts = await db.select({ code: regulationClauses.code }).from(regulationClauses);
  const clauseCount = counts.reduce<Record<string, number>>((acc, row) => {
    acc[row.code] = (acc[row.code] ?? 0) + 1;
    return acc;
  }, {});
  return regs.map((reg) => ({ ...reg, clauseCount: clauseCount[reg.code] ?? 0 }));
}

/**
 * Semantic search over regulation clauses. The query is embedded and scored
 * against stored clause embeddings with the in Postgres cosine function.
 */
export async function searchClauses(input: SearchClausesInput) {
  const queryVector = await embed(input.q);
  const score = cosineSimilarity(regulationClauses.embedding, queryVector);

  const rows = await db
    .select({
      id: regulationClauses.id,
      code: regulationClauses.code,
      ref: regulationClauses.ref,
      title: regulationClauses.title,
      text: regulationClauses.text,
      category: regulationClauses.category,
      score
    })
    .from(regulationClauses)
    .where(input.code ? eq(regulationClauses.code, input.code) : undefined)
    .orderBy(desc(score))
    .limit(input.limit);

  return rows;
}
