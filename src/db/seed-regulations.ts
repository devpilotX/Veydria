import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { obligationCategory, regulationClauses, regulations } from '@/db/schema';
import { pseudoEmbedding } from '@/lib/embedding-fallback';

type RegulationCode = 'eu_ai_act' | 'nist_ai_rmf' | 'iso_42001';
type Category = (typeof obligationCategory.enumValues)[number];

/**
 * The global regulation knowledge base. This is reference data, shared by every
 * organization, and is what the rules engine reads to turn a risk tier into
 * obligations. It is seeded separately from any demo tenant data so it exists
 * in every environment.
 */
export const regulationCatalog: Array<{
  code: RegulationCode;
  name: string;
  jurisdiction: string;
  version: string;
  summary: string;
}> = [
  {
    code: 'eu_ai_act',
    name: 'EU AI Act',
    jurisdiction: 'European Union',
    version: 'Regulation (EU) 2024/1689',
    summary:
      'The European Union rulebook for AI. It sorts systems by risk and puts the heaviest duties on high risk uses like hiring and credit.'
  },
  {
    code: 'nist_ai_rmf',
    name: 'NIST AI Risk Management Framework',
    jurisdiction: 'United States',
    version: 'AI RMF 1.0',
    summary:
      'A voluntary US framework built around four functions: govern, map, measure, and manage. Widely used as a baseline for good practice.'
  },
  {
    code: 'iso_42001',
    name: 'ISO/IEC 42001',
    jurisdiction: 'International',
    version: '2023',
    summary:
      'The first management system standard for AI. It certifies that an organization runs a documented, audited process for its AI.'
  }
];

export const clauseCatalog: Array<{
  code: RegulationCode;
  ref: string;
  title: string;
  text: string;
  category: Category;
}> = [
  {
    code: 'eu_ai_act',
    ref: 'Article 9',
    title: 'Risk management system',
    text: 'Providers of high risk AI systems shall set up, document, and keep a risk management system that runs across the whole lifecycle and is reviewed on a regular basis.',
    category: 'risk_management'
  },
  {
    code: 'eu_ai_act',
    ref: 'Article 10',
    title: 'Data and data governance',
    text: 'Training, validation, and testing data must meet quality criteria and be examined for bias that could harm health, safety, or fundamental rights.',
    category: 'data_governance'
  },
  {
    code: 'eu_ai_act',
    ref: 'Article 11',
    title: 'Technical documentation',
    text: 'Technical documentation must be written before the system goes to market and kept current, following the template in Annex IV.',
    category: 'technical_documentation'
  },
  {
    code: 'eu_ai_act',
    ref: 'Article 12',
    title: 'Record keeping',
    text: 'High risk systems must log events automatically over their lifetime so their behaviour can be traced after the fact.',
    category: 'record_keeping'
  },
  {
    code: 'eu_ai_act',
    ref: 'Article 13',
    title: 'Transparency and provision of information',
    text: 'Systems must be built so deployers can read the output correctly, with clear instructions for use.',
    category: 'transparency'
  },
  {
    code: 'eu_ai_act',
    ref: 'Article 14',
    title: 'Human oversight',
    text: 'High risk systems must let people oversee them effectively, including the ability to step in or stop the system.',
    category: 'human_oversight'
  },
  {
    code: 'eu_ai_act',
    ref: 'Article 15',
    title: 'Accuracy, robustness and cybersecurity',
    text: 'Systems must reach a suitable level of accuracy and hold up against errors and attempts to manipulate them.',
    category: 'accuracy_robustness'
  },
  {
    code: 'eu_ai_act',
    ref: 'Article 17',
    title: 'Quality management system',
    text: 'Providers must run a quality management system, written down as policies and procedures.',
    category: 'quality_management'
  },
  {
    code: 'eu_ai_act',
    ref: 'Article 72',
    title: 'Post market monitoring',
    text: 'Providers must gather and review data on how the system performs once it is in use, and act on what they find.',
    category: 'post_market_monitoring'
  },
  {
    code: 'nist_ai_rmf',
    ref: 'GOVERN 1.1',
    title: 'Legal and regulatory requirements understood',
    text: 'Legal and regulatory requirements that touch the AI system are understood, managed, and documented.',
    category: 'quality_management'
  },
  {
    code: 'nist_ai_rmf',
    ref: 'MAP 1.1',
    title: 'Context is established',
    text: 'The intended purpose, setting, and expectations for the AI system are understood and written down.',
    category: 'risk_management'
  },
  {
    code: 'nist_ai_rmf',
    ref: 'MEASURE 2.1',
    title: 'Test sets and metrics',
    text: 'Test sets, metrics, and the tools used are documented and checked for validity.',
    category: 'accuracy_robustness'
  },
  {
    code: 'nist_ai_rmf',
    ref: 'MEASURE 2.11',
    title: 'Fairness and bias are evaluated',
    text: 'Fairness and bias are evaluated across groups and the results are documented.',
    category: 'data_governance'
  },
  {
    code: 'nist_ai_rmf',
    ref: 'MANAGE 1.1',
    title: 'Risks are prioritized and handled',
    text: 'Risks are prioritized, responded to, and managed based on their likely impact.',
    category: 'risk_management'
  },
  {
    code: 'iso_42001',
    ref: 'Clause 6.1',
    title: 'Actions to address risks and opportunities',
    text: 'The organization plans actions to address the risks and opportunities of its AI management system.',
    category: 'risk_management'
  },
  {
    code: 'iso_42001',
    ref: 'Clause 8.1',
    title: 'Operational planning and control',
    text: 'The organization plans, runs, and controls the processes it needs to meet its AI requirements.',
    category: 'quality_management'
  },
  {
    code: 'iso_42001',
    ref: 'Clause 9.1',
    title: 'Monitoring, measurement, analysis',
    text: 'The organization decides what to monitor and measure for its AI management system and how to do it.',
    category: 'post_market_monitoring'
  },
  {
    code: 'iso_42001',
    ref: 'Annex A.6.2',
    title: 'AI system impact assessment',
    text: 'The organization assesses how the AI system affects individuals and groups before and during use.',
    category: 'human_oversight'
  }
];

/**
 * Seeds the regulation knowledge base if it is not already present. Idempotent:
 * if any regulation exists it does nothing, so it is safe to run on every
 * migration and deploy.
 */
export async function seedRegulations<TSchema extends Record<string, unknown>>(
  database: PostgresJsDatabase<TSchema>
): Promise<{ seeded: boolean; clauses: number }> {
  const existing = await database.select({ id: regulations.id }).from(regulations).limit(1);
  if (existing.length > 0) {
    return { seeded: false, clauses: 0 };
  }

  const insertedRegs = await database.insert(regulations).values(regulationCatalog).returning();
  const idByCode = new Map(insertedRegs.map((reg) => [reg.code, reg.id]));

  await database.insert(regulationClauses).values(
    clauseCatalog.map((clause) => ({
      regulationId: idByCode.get(clause.code) as string,
      code: clause.code,
      ref: clause.ref,
      title: clause.title,
      text: clause.text,
      category: clause.category,
      embedding: pseudoEmbedding(`${clause.ref} ${clause.title} ${clause.text}`)
    }))
  );

  return { seeded: true, clauses: clauseCatalog.length };
}

// Standalone command: pnpm db:seed:regulations
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set.');
  const sql = postgres(url, { max: 1 });
  const database = drizzle(sql);
  const result = await seedRegulations(database);
  console.log(
    result.seeded
      ? `Seeded the regulation knowledge base (${result.clauses} clauses).`
      : 'Regulation knowledge base already present, nothing to do.'
  );
  await sql.end();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
