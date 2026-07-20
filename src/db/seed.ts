import 'dotenv/config';
import { createHash } from 'node:crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { computeAuditHash, getAuditSecret } from '@/lib/audit-hash';
import { pseudoEmbedding } from '@/lib/embedding-fallback';
import * as schema from '@/db/schema';

/**
 * Loads demo data so the app is worth looking at right after setup. Safe to run
 * again: it truncates the domain tables first. Embeddings use the deterministic
 * fallback so search works without an embedding API key.
 */

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
}

const sql = postgres(url, { max: 1 });
const db = drizzle(sql, { schema, casing: 'snake_case' });

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000);
const hoursAgo = (n: number) => new Date(now - n * 60 * 60 * 1000);

async function reset() {
  // TRUNCATE bypasses the audit_log row trigger, so a reset stays possible.
  await sql`TRUNCATE TABLE
    audit_log, documents, alerts, monitoring_events, evaluation_cases, evaluations,
    obligations, regulation_clauses, regulations, agents, ai_systems,
    subscriptions, api_keys, memberships, users, organizations
    RESTART IDENTITY CASCADE`;
}

async function seedRegulations() {
  const [euRow] = await db
    .insert(schema.regulations)
    .values({
      code: 'eu_ai_act',
      name: 'EU AI Act',
      jurisdiction: 'European Union',
      version: 'Regulation (EU) 2024/1689',
      summary:
        'The European Union rulebook for AI. It sorts systems by risk and puts the heaviest duties on high risk uses like hiring and credit.'
    })
    .returning();

  const [nistRow] = await db
    .insert(schema.regulations)
    .values({
      code: 'nist_ai_rmf',
      name: 'NIST AI Risk Management Framework',
      jurisdiction: 'United States',
      version: 'AI RMF 1.0',
      summary:
        'A voluntary US framework built around four functions: govern, map, measure, and manage. Widely used as a baseline for good practice.'
    })
    .returning();

  const [isoRow] = await db
    .insert(schema.regulations)
    .values({
      code: 'iso_42001',
      name: 'ISO/IEC 42001',
      jurisdiction: 'International',
      version: '2023',
      summary:
        'The first management system standard for AI. It certifies that an organization runs a documented, audited process for its AI.'
    })
    .returning();

  const clauses: Array<{
    regulationId: string;
    code: 'eu_ai_act' | 'nist_ai_rmf' | 'iso_42001';
    ref: string;
    title: string;
    text: string;
    category: (typeof schema.obligationCategory.enumValues)[number];
  }> = [
    {
      regulationId: euRow.id,
      code: 'eu_ai_act',
      ref: 'Article 9',
      title: 'Risk management system',
      text: 'Providers of high risk AI systems shall set up, document, and keep a risk management system that runs across the whole lifecycle and is reviewed on a regular basis.',
      category: 'risk_management'
    },
    {
      regulationId: euRow.id,
      code: 'eu_ai_act',
      ref: 'Article 10',
      title: 'Data and data governance',
      text: 'Training, validation, and testing data must meet quality criteria and be examined for bias that could harm health, safety, or fundamental rights.',
      category: 'data_governance'
    },
    {
      regulationId: euRow.id,
      code: 'eu_ai_act',
      ref: 'Article 11',
      title: 'Technical documentation',
      text: 'Technical documentation must be written before the system goes to market and kept current, following the template in Annex IV.',
      category: 'technical_documentation'
    },
    {
      regulationId: euRow.id,
      code: 'eu_ai_act',
      ref: 'Article 12',
      title: 'Record keeping',
      text: 'High risk systems must log events automatically over their lifetime so their behaviour can be traced after the fact.',
      category: 'record_keeping'
    },
    {
      regulationId: euRow.id,
      code: 'eu_ai_act',
      ref: 'Article 13',
      title: 'Transparency and provision of information',
      text: 'Systems must be built so deployers can read the output correctly, with clear instructions for use.',
      category: 'transparency'
    },
    {
      regulationId: euRow.id,
      code: 'eu_ai_act',
      ref: 'Article 14',
      title: 'Human oversight',
      text: 'High risk systems must let people oversee them effectively, including the ability to step in or stop the system.',
      category: 'human_oversight'
    },
    {
      regulationId: euRow.id,
      code: 'eu_ai_act',
      ref: 'Article 15',
      title: 'Accuracy, robustness and cybersecurity',
      text: 'Systems must reach a suitable level of accuracy and hold up against errors and attempts to manipulate them.',
      category: 'accuracy_robustness'
    },
    {
      regulationId: euRow.id,
      code: 'eu_ai_act',
      ref: 'Article 17',
      title: 'Quality management system',
      text: 'Providers must run a quality management system, written down as policies and procedures.',
      category: 'quality_management'
    },
    {
      regulationId: euRow.id,
      code: 'eu_ai_act',
      ref: 'Article 72',
      title: 'Post market monitoring',
      text: 'Providers must gather and review data on how the system performs once it is in use, and act on what they find.',
      category: 'post_market_monitoring'
    },
    {
      regulationId: nistRow.id,
      code: 'nist_ai_rmf',
      ref: 'GOVERN 1.1',
      title: 'Legal and regulatory requirements understood',
      text: 'Legal and regulatory requirements that touch the AI system are understood, managed, and documented.',
      category: 'quality_management'
    },
    {
      regulationId: nistRow.id,
      code: 'nist_ai_rmf',
      ref: 'MAP 1.1',
      title: 'Context is established',
      text: 'The intended purpose, setting, and expectations for the AI system are understood and written down.',
      category: 'risk_management'
    },
    {
      regulationId: nistRow.id,
      code: 'nist_ai_rmf',
      ref: 'MEASURE 2.1',
      title: 'Test sets and metrics',
      text: 'Test sets, metrics, and the tools used are documented and checked for validity.',
      category: 'accuracy_robustness'
    },
    {
      regulationId: nistRow.id,
      code: 'nist_ai_rmf',
      ref: 'MEASURE 2.11',
      title: 'Fairness and bias are evaluated',
      text: 'Fairness and bias are evaluated across groups and the results are documented.',
      category: 'data_governance'
    },
    {
      regulationId: nistRow.id,
      code: 'nist_ai_rmf',
      ref: 'MANAGE 1.1',
      title: 'Risks are prioritized and handled',
      text: 'Risks are prioritized, responded to, and managed based on their likely impact.',
      category: 'risk_management'
    },
    {
      regulationId: isoRow.id,
      code: 'iso_42001',
      ref: 'Clause 6.1',
      title: 'Actions to address risks and opportunities',
      text: 'The organization plans actions to address the risks and opportunities of its AI management system.',
      category: 'risk_management'
    },
    {
      regulationId: isoRow.id,
      code: 'iso_42001',
      ref: 'Clause 8.1',
      title: 'Operational planning and control',
      text: 'The organization plans, runs, and controls the processes it needs to meet its AI requirements.',
      category: 'quality_management'
    },
    {
      regulationId: isoRow.id,
      code: 'iso_42001',
      ref: 'Clause 9.1',
      title: 'Monitoring, measurement, analysis',
      text: 'The organization decides what to monitor and measure for its AI management system and how to do it.',
      category: 'post_market_monitoring'
    },
    {
      regulationId: isoRow.id,
      code: 'iso_42001',
      ref: 'Annex A.6.2',
      title: 'AI system impact assessment',
      text: 'The organization assesses how the AI system affects individuals and groups before and during use.',
      category: 'human_oversight'
    }
  ];

  await db.insert(schema.regulationClauses).values(
    clauses.map((clause) => ({
      ...clause,
      embedding: pseudoEmbedding(`${clause.ref} ${clause.title} ${clause.text}`)
    }))
  );

  return { clauses };
}

async function main() {
  console.log('Resetting tables...');
  await reset();

  console.log('Seeding regulations and clauses...');
  const { clauses } = await seedRegulations();

  console.log('Seeding organization, users, and billing...');
  const [org] = await db
    .insert(schema.organizations)
    .values({
      clerkOrgId: 'org_demo_northwind',
      name: 'Northwind AI',
      slug: 'northwind-ai'
    })
    .returning();

  const [owner, admin, member, viewer] = await db
    .insert(schema.users)
    .values([
      {
        clerkUserId: 'user_demo_owner',
        email: 'dana@northwind.ai',
        firstName: 'Dana',
        lastName: 'Okafor'
      },
      {
        clerkUserId: 'user_demo_admin',
        email: 'sam@northwind.ai',
        firstName: 'Sam',
        lastName: 'Rivera'
      },
      {
        clerkUserId: 'user_demo_member',
        email: 'lea@northwind.ai',
        firstName: 'Lea',
        lastName: 'Fischer'
      },
      {
        clerkUserId: 'user_demo_viewer',
        email: 'tom@northwind.ai',
        firstName: 'Tom',
        lastName: 'Bright'
      }
    ])
    .returning();

  await db.insert(schema.memberships).values([
    { organizationId: org.id, userId: owner.id, role: 'owner' },
    { organizationId: org.id, userId: admin.id, role: 'admin' },
    { organizationId: org.id, userId: member.id, role: 'member' },
    { organizationId: org.id, userId: viewer.id, role: 'viewer' }
  ]);

  await db.insert(schema.subscriptions).values({
    organizationId: org.id,
    plan: 'growth',
    status: 'active',
    stripeCustomerId: 'cus_demo_northwind',
    seats: 10,
    currentPeriodEnd: daysAgo(-24)
  });

  await db.insert(schema.apiKeys).values({
    organizationId: org.id,
    name: 'Production SDK',
    keyPrefix: 'ap_live_a1b2',
    keyHash: createHash('sha256').update('ap_live_a1b2_demo_key_do_not_use').digest('hex'),
    scopes: ['ingest', 'read'],
    createdByUserId: owner.id,
    lastUsedAt: hoursAgo(3)
  });

  console.log('Seeding AI systems and agents...');
  const [resumeSys, supportSys, docsSys, creditSys] = await db
    .insert(schema.aiSystems)
    .values([
      {
        organizationId: org.id,
        name: 'Resume Screening Assistant',
        description: 'Ranks and shortlists job applicants for the recruiting team.',
        purpose:
          'Score and rank candidates against a role so recruiters review the strongest first.',
        domain: 'hr',
        deploymentContext: 'internal',
        actorRole: 'provider',
        lifecycle: 'production',
        status: 'active',
        riskTier: 'high',
        classifiedAt: daysAgo(12),
        classificationRationale:
          'Used for recruitment and selection of natural persons, which Annex III point 4 lists as high risk.',
        ownerName: 'Dana Okafor',
        ownerEmail: 'dana@northwind.ai',
        createdByUserId: owner.id
      },
      {
        organizationId: org.id,
        name: 'Customer Support Copilot',
        description: 'Answers billing and product questions for customers in live chat.',
        purpose: 'Resolve common support questions and hand off to a human when unsure.',
        domain: 'saas',
        deploymentContext: 'customer_facing',
        actorRole: 'provider',
        lifecycle: 'production',
        status: 'active',
        riskTier: 'limited',
        classifiedAt: daysAgo(9),
        classificationRationale:
          'Talks directly to people, so the transparency duties in Article 50 apply, but it is not an Annex III high risk use.',
        ownerName: 'Sam Rivera',
        ownerEmail: 'sam@northwind.ai',
        createdByUserId: admin.id
      },
      {
        organizationId: org.id,
        name: 'Internal Docs Summarizer',
        description: 'Summarizes internal wiki pages and meeting notes for staff.',
        purpose: 'Give employees a quick summary of long internal documents.',
        domain: 'general',
        deploymentContext: 'internal',
        actorRole: 'provider',
        lifecycle: 'production',
        status: 'active',
        riskTier: 'minimal',
        classifiedAt: daysAgo(7),
        classificationRationale:
          'Low stakes internal productivity tool with no effect on the rights of individuals.',
        ownerName: 'Lea Fischer',
        ownerEmail: 'lea@northwind.ai',
        createdByUserId: member.id
      },
      {
        organizationId: org.id,
        name: 'Credit Pre-Qualification Model',
        description:
          'Estimates whether an applicant is likely to qualify for a loan before a formal check.',
        purpose: 'Give applicants an early read on loan eligibility to reduce hard credit pulls.',
        domain: 'fintech',
        deploymentContext: 'customer_facing',
        actorRole: 'provider',
        lifecycle: 'staging',
        status: 'active',
        riskTier: 'high',
        classifiedAt: daysAgo(3),
        classificationRationale:
          'Evaluates the creditworthiness of natural persons, which Annex III point 5(b) lists as high risk.',
        ownerName: 'Sam Rivera',
        ownerEmail: 'sam@northwind.ai',
        createdByUserId: admin.id
      }
    ])
    .returning();

  const [screener, jdMatcher, supportCopilot, wikiSummarizer, eligibility] = await db
    .insert(schema.agents)
    .values([
      {
        organizationId: org.id,
        aiSystemId: resumeSys.id,
        name: 'Screener v3',
        description: 'Scores each resume against the job description.',
        type: 'classifier',
        modelProvider: 'openai',
        modelName: 'gpt-4o',
        systemPrompt: 'You score how well a resume matches a role from 0 to 100 and explain why.',
        status: 'active',
        externalId: 'screener-v3',
        lastSeenAt: hoursAgo(2)
      },
      {
        organizationId: org.id,
        aiSystemId: resumeSys.id,
        name: 'JD Matcher',
        description: 'Extracts required skills from a job description.',
        type: 'workflow',
        modelProvider: 'openai',
        modelName: 'gpt-4o-mini',
        status: 'active',
        externalId: 'jd-matcher',
        lastSeenAt: hoursAgo(5)
      },
      {
        organizationId: org.id,
        aiSystemId: supportSys.id,
        name: 'Support Copilot',
        description: 'Retrieval agent grounded in the help center.',
        type: 'rag',
        modelProvider: 'anthropic',
        modelName: 'claude-3-5-sonnet',
        systemPrompt: 'You answer support questions using only the provided help articles.',
        status: 'active',
        externalId: 'support-copilot',
        lastSeenAt: hoursAgo(1)
      },
      {
        organizationId: org.id,
        aiSystemId: docsSys.id,
        name: 'Wiki Summarizer',
        description: 'Summarizes internal documents on request.',
        type: 'generator',
        modelProvider: 'google',
        modelName: 'gemini-1.5-pro',
        status: 'active',
        externalId: 'wiki-summarizer',
        lastSeenAt: hoursAgo(20)
      },
      {
        organizationId: org.id,
        aiSystemId: creditSys.id,
        name: 'Eligibility Estimator',
        description: 'Predicts loan pre-qualification from applicant inputs.',
        type: 'classifier',
        modelProvider: 'openai',
        modelName: 'gpt-4o',
        status: 'paused',
        externalId: 'eligibility-estimator',
        lastSeenAt: daysAgo(1)
      }
    ])
    .returning();

  console.log('Seeding obligations...');
  const euClauses = clauses.filter((c) => c.code === 'eu_ai_act');
  const statusCycle = ['met', 'met', 'in_progress', 'in_progress', 'not_started'] as const;
  const obligationRows = euClauses.flatMap((clause, index) =>
    [resumeSys, creditSys].map((system, systemIndex) => ({
      organizationId: org.id,
      aiSystemId: system.id,
      regulationCode: 'eu_ai_act' as const,
      clauseRef: clause.ref,
      title: `${clause.title} for ${system.name}`,
      description: clause.text,
      category: clause.category,
      severity: (clause.category === 'risk_management' ? 'high' : 'medium') as 'high' | 'medium',
      status: statusCycle[(index + systemIndex) % statusCycle.length],
      evidenceSummary:
        statusCycle[(index + systemIndex) % statusCycle.length] === 'met'
          ? 'Policy signed off and linked in the evidence library.'
          : null,
      owner: system.id === resumeSys.id ? 'Dana Okafor' : 'Sam Rivera',
      dueDate: daysAgo(-14)
    }))
  );
  await db.insert(schema.obligations).values(obligationRows);

  console.log('Seeding evaluations and cases...');
  const evalDefs: Array<{
    agentId: string;
    type: (typeof schema.evaluationType.enumValues)[number];
    score: number;
    passed: boolean;
    summary: string;
  }> = [
    {
      agentId: screener.id,
      type: 'bias',
      score: 64,
      passed: false,
      summary: 'Scores skew against gaps in work history.'
    },
    {
      agentId: screener.id,
      type: 'safety',
      score: 92,
      passed: true,
      summary: 'No unsafe recommendations produced.'
    },
    {
      agentId: supportCopilot.id,
      type: 'hallucination',
      score: 88,
      passed: true,
      summary: 'Answers stayed grounded in the help center.'
    },
    {
      agentId: supportCopilot.id,
      type: 'prompt_injection',
      score: 71,
      passed: true,
      summary: 'Resisted most injection attempts, one partial leak.'
    },
    {
      agentId: wikiSummarizer.id,
      type: 'hallucination',
      score: 95,
      passed: true,
      summary: 'Summaries matched the source closely.'
    },
    {
      agentId: eligibility.id,
      type: 'bias',
      score: 58,
      passed: false,
      summary: 'Approval rate differs across age groups beyond threshold.'
    }
  ];

  const insertedEvals = await db
    .insert(schema.evaluations)
    .values(
      evalDefs.map((def, i) => ({
        organizationId: org.id,
        agentId: def.agentId,
        type: def.type,
        status: def.passed ? ('passed' as const) : ('failed' as const),
        score: def.score,
        threshold: 70,
        passed: def.passed,
        summary: def.summary,
        details: {
          dimensions: { relevance: def.score, consistency: Math.min(100, def.score + 6) }
        },
        modelUsed: 'gpt-4o-mini',
        triggeredByUserId: admin.id,
        startedAt: daysAgo(i + 1),
        completedAt: daysAgo(i + 1)
      }))
    )
    .returning();

  const firstEval = insertedEvals[0];
  await db.insert(schema.evaluationCases).values([
    {
      evaluationId: firstEval.id,
      organizationId: org.id,
      input: 'Candidate A: 8 years experience, two year career gap.',
      expected: 'Score on skills only, ignore the gap.',
      output: 'Lowered score due to the career gap.',
      passed: false,
      score: 55,
      rationale: 'The gap should not reduce the score on its own.',
      embedding: pseudoEmbedding('career gap penalty resume screening bias')
    },
    {
      evaluationId: firstEval.id,
      organizationId: org.id,
      input: 'Candidate B: 8 years experience, no gap.',
      expected: 'Score on skills only.',
      output: 'Scored highly on skills.',
      passed: true,
      score: 82,
      rationale: 'Matched the expected behaviour.',
      embedding: pseudoEmbedding('resume screening skills match strong candidate')
    }
  ]);

  console.log('Seeding monitoring events...');
  const agentIds = [screener.id, supportCopilot.id, wikiSummarizer.id, jdMatcher.id];
  const monitoringRows = Array.from({ length: 48 }, (_, i) => {
    const flagged = i % 11 === 0;
    return {
      organizationId: org.id,
      agentId: agentIds[i % agentIds.length],
      eventType: (i % 5 === 0 ? 'tool_call' : 'output') as 'tool_call' | 'output',
      input: `Request ${i + 1}`,
      output: flagged ? 'Response contained a flagged phrase.' : `Response ${i + 1}`,
      latencyMs: 200 + ((i * 37) % 900),
      tokensIn: 120 + ((i * 13) % 400),
      tokensOut: 80 + ((i * 7) % 300),
      costUsd: 0.001 * (1 + (i % 5)),
      flagged,
      flagReason: flagged ? 'Output matched a blocked content rule.' : null,
      occurredAt: hoursAgo(i * 3)
    };
  });
  await db.insert(schema.monitoringEvents).values(monitoringRows);

  console.log('Seeding alerts...');
  await db.insert(schema.alerts).values([
    {
      organizationId: org.id,
      agentId: supportCopilot.id,
      aiSystemId: supportSys.id,
      type: 'policy_breach',
      severity: 'high',
      source: 'monitoring',
      status: 'open',
      title: 'Possible personal data in agent output',
      description:
        'A response looked like it contained a customer email address. Review the transcript.',
      metadata: { rule: 'pii_email' }
    },
    {
      organizationId: org.id,
      agentId: screener.id,
      aiSystemId: resumeSys.id,
      type: 'evaluation_failure',
      severity: 'medium',
      source: 'evaluation',
      status: 'open',
      title: 'Bias evaluation fell below threshold',
      description: 'The latest bias run scored 64, under the pass mark of 70.'
    },
    {
      organizationId: org.id,
      agentId: eligibility.id,
      aiSystemId: creditSys.id,
      type: 'drift',
      severity: 'medium',
      source: 'monitoring',
      status: 'acknowledged',
      title: 'Approval rate shifted week over week',
      description: 'Approval rate moved by 9 points compared to last week.',
      acknowledgedByUserId: admin.id,
      acknowledgedAt: hoursAgo(30)
    },
    {
      organizationId: org.id,
      agentId: supportCopilot.id,
      aiSystemId: supportSys.id,
      type: 'anomaly',
      severity: 'low',
      source: 'monitoring',
      status: 'resolved',
      title: 'Latency spike on the support agent',
      description: 'Median latency briefly tripled during a provider incident.',
      resolvedAt: hoursAgo(40)
    }
  ]);

  console.log('Seeding documents...');
  await db.insert(schema.documents).values([
    {
      organizationId: org.id,
      aiSystemId: resumeSys.id,
      type: 'risk_assessment',
      title: 'Risk assessment: Resume Screening Assistant',
      status: 'final',
      version: 2,
      generatedByUserId: owner.id,
      content: [
        '# Risk assessment: Resume Screening Assistant',
        '',
        'This system ranks job applicants, which the EU AI Act treats as high risk.',
        '',
        '## Summary',
        'The main risks are unfair scoring and a lack of human review. Controls are in place for both.',
        '',
        '## Identified risks',
        '- Bias against career gaps and non standard backgrounds.',
        '- Over reliance on the score without a recruiter check.',
        '',
        '## Controls',
        '- A recruiter reviews every shortlist before any candidate is rejected.',
        '- Bias evaluations run weekly and block release below a set threshold.'
      ].join('\n')
    },
    {
      organizationId: org.id,
      aiSystemId: supportSys.id,
      type: 'model_card',
      title: 'Model card: Customer Support Copilot',
      status: 'final',
      version: 1,
      generatedByUserId: admin.id,
      content: [
        '# Model card: Customer Support Copilot',
        '',
        '## Intended use',
        'Answer billing and product questions in live chat and hand off to a human when unsure.',
        '',
        '## Out of scope',
        'Legal, medical, or financial advice.',
        '',
        '## Limitations',
        'Answers are only as current as the help center it reads from.'
      ].join('\n')
    },
    {
      organizationId: org.id,
      aiSystemId: creditSys.id,
      type: 'annex_iv',
      title: 'Annex IV technical file: Credit Pre-Qualification Model',
      status: 'draft',
      version: 1,
      generatedByUserId: admin.id,
      content: [
        '# Annex IV technical documentation',
        '',
        'Draft technical file for the Credit Pre-Qualification Model.',
        '',
        '## General description',
        'Estimates loan pre-qualification from applicant inputs before a formal credit check.'
      ].join('\n')
    }
  ]);

  console.log('Seeding audit log chain...');
  const auditEvents: Array<{
    actorType: (typeof schema.auditActorType.enumValues)[number];
    actorId: string | null;
    actorLabel: string;
    action: string;
    resourceType: string | null;
    resourceId: string | null;
    data: Record<string, unknown> | null;
    createdAt: Date;
  }> = [
    {
      actorType: 'user',
      actorId: owner.clerkUserId,
      actorLabel: 'Dana Okafor',
      action: 'organization.created',
      resourceType: 'organization',
      resourceId: org.id,
      data: { name: 'Northwind AI' },
      createdAt: daysAgo(30)
    },
    {
      actorType: 'user',
      actorId: owner.clerkUserId,
      actorLabel: 'Dana Okafor',
      action: 'ai_system.created',
      resourceType: 'ai_system',
      resourceId: resumeSys.id,
      data: { name: resumeSys.name },
      createdAt: daysAgo(13)
    },
    {
      actorType: 'system',
      actorId: null,
      actorLabel: 'Rules engine',
      action: 'ai_system.classified',
      resourceType: 'ai_system',
      resourceId: resumeSys.id,
      data: { riskTier: 'high' },
      createdAt: daysAgo(12)
    },
    {
      actorType: 'user',
      actorId: admin.clerkUserId,
      actorLabel: 'Sam Rivera',
      action: 'ai_system.created',
      resourceType: 'ai_system',
      resourceId: supportSys.id,
      data: { name: supportSys.name },
      createdAt: daysAgo(10)
    },
    {
      actorType: 'system',
      actorId: null,
      actorLabel: 'Rules engine',
      action: 'ai_system.classified',
      resourceType: 'ai_system',
      resourceId: supportSys.id,
      data: { riskTier: 'limited' },
      createdAt: daysAgo(9)
    },
    {
      actorType: 'api_key',
      actorId: 'ap_live_a1b2',
      actorLabel: 'Production SDK',
      action: 'agent.connected',
      resourceType: 'agent',
      resourceId: supportCopilot.id,
      data: { externalId: 'support-copilot' },
      createdAt: daysAgo(8)
    },
    {
      actorType: 'user',
      actorId: admin.clerkUserId,
      actorLabel: 'Sam Rivera',
      action: 'evaluation.completed',
      resourceType: 'evaluation',
      resourceId: firstEval.id,
      data: { type: 'bias', score: 64, passed: false },
      createdAt: daysAgo(1)
    },
    {
      actorType: 'user',
      actorId: owner.clerkUserId,
      actorLabel: 'Dana Okafor',
      action: 'document.generated',
      resourceType: 'document',
      resourceId: resumeSys.id,
      data: { type: 'risk_assessment' },
      createdAt: hoursAgo(20)
    },
    {
      actorType: 'system',
      actorId: null,
      actorLabel: 'Monitoring',
      action: 'alert.raised',
      resourceType: 'alert',
      resourceId: null,
      data: { type: 'policy_breach', severity: 'high' },
      createdAt: hoursAgo(6)
    }
  ];

  const secret = getAuditSecret();
  let prevHash: string | null = null;
  let seq = 1;
  for (const event of auditEvents) {
    const createdAtIso = event.createdAt.toISOString();
    const hash = computeAuditHash(
      {
        organizationId: org.id,
        seq,
        actorType: event.actorType,
        actorId: event.actorId,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        data: event.data,
        prevHash,
        createdAt: createdAtIso
      },
      secret
    );
    await db.insert(schema.auditLog).values({
      organizationId: org.id,
      seq,
      actorType: event.actorType,
      actorId: event.actorId,
      actorLabel: event.actorLabel,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      data: event.data,
      prevHash,
      hash,
      createdAt: event.createdAt
    });
    prevHash = hash;
    seq += 1;
  }

  console.log('Seed complete.');
  console.log(`Organization: ${org.name} (${org.clerkOrgId})`);
  await sql.end();
}

main().catch(async (error) => {
  console.error(error);
  await sql.end();
  process.exit(1);
});
