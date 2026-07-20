/**
 * The rules engine. It reads a system's purpose, domain, and context, decides
 * its EU AI Act risk tier, and plans the obligations that follow. The mapping
 * is deliberately transparent: each rule carries the Annex reference and a
 * plain reason, so a compliance lead can check the reasoning by hand.
 */

export type RiskTier = 'prohibited' | 'high' | 'limited' | 'minimal';

export type ClassificationInput = {
  name: string;
  purpose?: string | null;
  domain?: string | null;
  deploymentContext?: string | null;
};

export type ClassificationResult = {
  tier: RiskTier;
  rationale: string;
  reference: string | null;
};

type Rule = {
  tier: RiskTier;
  reference: string | null;
  reason: string;
  patterns: RegExp[];
};

// Ordered from most to least severe. The first matching rule wins.
const RULES: Rule[] = [
  {
    tier: 'prohibited',
    reference: 'Article 5',
    reason:
      'The described use looks like social scoring or manipulation, which the Act bans outright.',
    patterns: [/social scor/i, /social credit/i, /subliminal/i, /manipulat/i, /mass surveillance/i]
  },
  {
    tier: 'high',
    reference: 'Annex III(1) biometrics',
    reason: 'Biometric identification of people is a high risk use under Annex III.',
    patterns: [/biometric/i, /facial recognition/i, /face match/i, /fingerprint/i]
  },
  {
    tier: 'high',
    reference: 'Annex III(4) employment',
    reason: 'Recruitment and selection of people is a high risk use under Annex III point 4.',
    patterns: [
      /recruit/i,
      /resume/i,
      /\bcv\b/i,
      /candidate/i,
      /hir(e|ing)/i,
      /applicant/i,
      /screen(ing)? .*(job|role|candidate)/i
    ]
  },
  {
    tier: 'high',
    reference: 'Annex III(5)(b) creditworthiness',
    reason: 'Judging the creditworthiness of people is a high risk use under Annex III point 5(b).',
    patterns: [/credit/i, /loan/i, /lending/i, /mortgage/i, /underwrit/i, /creditworth/i]
  },
  {
    tier: 'high',
    reference: 'Annex III(3) education',
    reason: 'Scoring access to education or grading is a high risk use under Annex III point 3.',
    patterns: [/exam grad/i, /student assess/i, /admission/i, /proctor/i]
  },
  {
    tier: 'high',
    reference: 'Annex III(5)(a) essential services',
    reason: 'Deciding access to essential public services or benefits is a high risk use.',
    patterns: [/benefits eligib/i, /welfare/i, /social security/i, /emergency dispatch/i]
  },
  {
    tier: 'high',
    reference: 'Annex III health and safety',
    reason: 'Use in health decisions can carry a safety component that makes it high risk.',
    patterns: [/diagnos/i, /patient triage/i, /medical decision/i, /clinical/i]
  },
  {
    tier: 'high',
    reference: 'Annex III(6-8) enforcement, migration, justice',
    reason:
      'Use in law enforcement, migration, or the justice system is high risk under Annex III.',
    patterns: [
      /law enforcement/i,
      /police/i,
      /asylum/i,
      /\bvisa\b/i,
      /border control/i,
      /court/i,
      /sentenc/i
    ]
  },
  {
    tier: 'limited',
    reference: 'Article 50 transparency',
    reason:
      'The system talks to people or makes content, so transparency duties apply. People must know they are dealing with AI.',
    patterns: [
      /chatbot/i,
      /chat\b/i,
      /assistant/i,
      /support/i,
      /conversation/i,
      /customer facing/i,
      /content gener/i,
      /copywrit/i,
      /image gener/i,
      /deepfake/i
    ]
  }
];

export function classifyAiSystem(input: ClassificationInput): ClassificationResult {
  const haystack = [input.name, input.purpose, input.domain, input.deploymentContext]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(haystack))) {
      return {
        tier: rule.tier,
        reference: rule.reference,
        rationale: rule.reason
      };
    }
  }

  return {
    tier: 'minimal',
    reference: null,
    rationale:
      'Nothing in the description points to a high risk use or direct interaction with people, so this looks like a minimal risk system. Keep light governance in place in case the use changes.'
  };
}

export type PlannedObligation = {
  regulationCode: 'eu_ai_act' | 'nist_ai_rmf' | 'iso_42001';
  clauseRef: string;
  severity: 'low' | 'medium' | 'high';
};

// Which clauses apply at each tier. Refs match the seeded regulation clauses.
const EU_HIGH_RISK_REFS = [
  'Article 9',
  'Article 10',
  'Article 11',
  'Article 12',
  'Article 13',
  'Article 14',
  'Article 15',
  'Article 17',
  'Article 72'
];
const NIST_BASELINE_REFS = ['GOVERN 1.1', 'MAP 1.1', 'MEASURE 2.1', 'MEASURE 2.11', 'MANAGE 1.1'];
const ISO_BASELINE_REFS = ['Clause 6.1', 'Clause 8.1', 'Clause 9.1', 'Annex A.6.2'];

/** Returns the obligations that a system should carry, given its tier. */
export function planObligations(tier: RiskTier): PlannedObligation[] {
  if (tier === 'prohibited') {
    return [{ regulationCode: 'eu_ai_act', clauseRef: 'Article 5', severity: 'high' }];
  }

  if (tier === 'high') {
    return [
      ...EU_HIGH_RISK_REFS.map((ref) => ({
        regulationCode: 'eu_ai_act' as const,
        clauseRef: ref,
        severity: 'high' as const
      })),
      ...NIST_BASELINE_REFS.map((ref) => ({
        regulationCode: 'nist_ai_rmf' as const,
        clauseRef: ref,
        severity: 'medium' as const
      })),
      ...ISO_BASELINE_REFS.map((ref) => ({
        regulationCode: 'iso_42001' as const,
        clauseRef: ref,
        severity: 'medium' as const
      }))
    ];
  }

  if (tier === 'limited') {
    return [
      { regulationCode: 'eu_ai_act', clauseRef: 'Article 13', severity: 'medium' },
      { regulationCode: 'nist_ai_rmf', clauseRef: 'GOVERN 1.1', severity: 'low' },
      { regulationCode: 'nist_ai_rmf', clauseRef: 'MAP 1.1', severity: 'low' },
      { regulationCode: 'iso_42001', clauseRef: 'Clause 6.1', severity: 'low' }
    ];
  }

  return [
    { regulationCode: 'nist_ai_rmf', clauseRef: 'GOVERN 1.1', severity: 'low' },
    { regulationCode: 'iso_42001', clauseRef: 'Clause 6.1', severity: 'low' }
  ];
}
