/**
 * Builds compliance documents from live data. These are deterministic
 * templates so they work without a language model. When an LLM key is set, the
 * calling service can pass sections through the gateway for richer prose.
 */

export type SystemForDoc = {
  name: string;
  description: string | null;
  purpose: string | null;
  domain: string | null;
  deploymentContext: string | null;
  actorRole: string;
  riskTier: string;
  lifecycle: string;
  classificationRationale: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
};

export type ObligationForDoc = {
  regulationCode: string;
  clauseRef: string;
  title: string;
  status: string;
  evidenceSummary: string | null;
};

export type AgentForDoc = {
  name: string;
  type: string;
  modelProvider: string | null;
  modelName: string | null;
};

export type EvaluationForDoc = {
  type: string;
  score: number | null;
  passed: boolean | null;
  completedAt: Date | null;
};

const tierLabel: Record<string, string> = {
  prohibited: 'Prohibited',
  high: 'High risk',
  limited: 'Limited risk',
  minimal: 'Minimal risk',
  unknown: 'Not yet classified'
};

function statusLine(obligations: ObligationForDoc[]): string {
  const met = obligations.filter((o) => o.status === 'met').length;
  return `${met} of ${obligations.length} obligations met`;
}

function obligationTable(obligations: ObligationForDoc[]): string {
  if (obligations.length === 0) return 'No obligations recorded yet.';
  const header = '| Framework | Clause | Obligation | Status |\n| --- | --- | --- | --- |';
  const rows = obligations.map(
    (o) => `| ${o.regulationCode} | ${o.clauseRef} | ${o.title} | ${o.status.replace('_', ' ')} |`
  );
  return [header, ...rows].join('\n');
}

export function generateRiskAssessment(
  system: SystemForDoc,
  obligations: ObligationForDoc[],
  evaluations: EvaluationForDoc[]
): string {
  const failing = evaluations.filter((e) => e.passed === false);
  return [
    `# Risk assessment: ${system.name}`,
    '',
    `Risk tier: ${tierLabel[system.riskTier] ?? system.riskTier}`,
    `Lifecycle stage: ${system.lifecycle}`,
    `Owner: ${system.ownerName ?? 'Unassigned'}${system.ownerEmail ? ` (${system.ownerEmail})` : ''}`,
    '',
    '## Purpose',
    system.purpose ?? system.description ?? 'No purpose recorded.',
    '',
    '## Why this tier',
    system.classificationRationale ?? 'The system has not been classified yet.',
    '',
    '## Obligations',
    statusLine(obligations),
    '',
    obligationTable(obligations),
    '',
    '## Evaluation findings',
    evaluations.length === 0
      ? 'No evaluations have run yet.'
      : failing.length === 0
        ? 'All recent evaluations passed their thresholds.'
        : `${failing.length} recent evaluation(s) fell below threshold: ${failing
            .map((e) => e.type)
            .join(', ')}. Treat these as open risks until they pass.`,
    '',
    '## Controls and next steps',
    '- Keep a person in the loop for any decision that affects an individual.',
    '- Re-run evaluations after any prompt or model change.',
    '- Review this assessment whenever the purpose or data sources change.'
  ].join('\n');
}

export function generateModelCard(system: SystemForDoc, agents: AgentForDoc[]): string {
  return [
    `# Model card: ${system.name}`,
    '',
    '## Intended use',
    system.purpose ?? system.description ?? 'No purpose recorded.',
    '',
    '## Operator role',
    `${system.actorRole} in a ${system.deploymentContext ?? 'unspecified'} setting.`,
    '',
    '## Components',
    agents.length === 0
      ? 'No agents registered.'
      : agents
          .map((a) =>
            `- ${a.name} (${a.type}) on ${a.modelProvider ?? 'unknown'} ${a.modelName ?? ''}`.trim()
          )
          .join('\n'),
    '',
    '## Limitations',
    '- Output quality depends on the underlying model and the data it is given.',
    '- The system should not be used outside the intended use above.',
    '',
    '## Governance',
    `Risk tier ${tierLabel[system.riskTier] ?? system.riskTier}. Evaluated and monitored in Veydria.`
  ].join('\n');
}

export function generateAnnexIv(
  system: SystemForDoc,
  obligations: ObligationForDoc[],
  agents: AgentForDoc[]
): string {
  return [
    `# Annex IV technical documentation: ${system.name}`,
    '',
    '## 1. General description',
    system.description ?? system.purpose ?? 'No description recorded.',
    `Intended purpose: ${system.purpose ?? 'Not stated.'}`,
    `Provider role: ${system.actorRole}.`,
    '',
    '## 2. Elements and development',
    agents.length === 0
      ? 'No components registered.'
      : agents
          .map((a) =>
            `- ${a.name}: ${a.type}, ${a.modelProvider ?? 'unknown'} ${a.modelName ?? ''}`.trim()
          )
          .join('\n'),
    '',
    '## 3. Risk management',
    system.classificationRationale ?? 'Classification pending.',
    '',
    '## 4. Obligations and controls',
    obligationTable(obligations),
    '',
    '## 5. Human oversight',
    'A person reviews decisions that affect individuals and can override or stop the system.',
    '',
    '## 6. Accuracy and robustness',
    'Evaluations run on a schedule and gate releases below threshold. Results are stored with the system.'
  ].join('\n');
}

export function generateAuditReport(params: {
  organizationName: string;
  chainValid: boolean;
  chainChecked: number;
  systems: number;
  highRisk: number;
  openAlerts: number;
}): string {
  return [
    `# Audit report: ${params.organizationName}`,
    '',
    `Generated ${new Date().toISOString().slice(0, 10)}`,
    '',
    '## Inventory',
    `- AI systems tracked: ${params.systems}`,
    `- High risk systems: ${params.highRisk}`,
    `- Open alerts: ${params.openAlerts}`,
    '',
    '## Audit trail integrity',
    params.chainValid
      ? `The audit log hash chain is intact across ${params.chainChecked} entries. No record has been altered.`
      : `The audit log hash chain failed verification. Investigate before relying on the trail.`,
    '',
    '## Statement',
    'This report is generated from live data in Veydria. Every entry links back to a record with a timestamp and an actor.'
  ].join('\n');
}
