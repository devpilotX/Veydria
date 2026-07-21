import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { cosineSimilarityFunctionSql } from './vector';
import { seedRegulations } from './seed-regulations';

// Blocks updates and deletes on audit_log rows so the hash chain cannot be
// altered in place. TRUNCATE is not affected, which lets the seed reset data.
const auditImmutabilitySql = `
CREATE OR REPLACE FUNCTION agentproof_block_audit_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_mutation ON audit_log;
CREATE TRIGGER audit_log_no_mutation
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION agentproof_block_audit_mutation();
`;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  }

  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql);

  console.log('Applying migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });

  console.log('Installing cosine similarity function...');
  await sql.unsafe(cosineSimilarityFunctionSql);

  console.log('Installing audit log immutability trigger...');
  await sql.unsafe(auditImmutabilitySql);

  console.log('Seeding the regulation knowledge base...');
  const kb = await seedRegulations(db);
  console.log(
    kb.seeded
      ? `Seeded ${kb.clauses} regulation clauses.`
      : 'Regulation knowledge base already present.'
  );

  console.log('Migration complete.');
  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
