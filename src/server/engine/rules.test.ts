import { describe, expect, it } from 'vitest';
import { classifyAiSystem, planObligations } from './rules';

describe('classifyAiSystem', () => {
  it('marks recruitment systems as high risk', () => {
    const result = classifyAiSystem({
      name: 'Resume Screener',
      purpose: 'Ranks job applicants for recruiters',
      domain: 'hr',
      deploymentContext: 'internal'
    });
    expect(result.tier).toBe('high');
    expect(result.reference).toContain('Annex III');
  });

  it('marks credit scoring as high risk', () => {
    const result = classifyAiSystem({
      name: 'Loan Check',
      purpose: 'Estimates creditworthiness for a loan',
      domain: 'fintech',
      deploymentContext: 'customer_facing'
    });
    expect(result.tier).toBe('high');
  });

  it('marks a support chatbot as limited risk', () => {
    const result = classifyAiSystem({
      name: 'Support Copilot',
      purpose: 'Answers customer questions in a chatbot',
      domain: 'saas',
      deploymentContext: 'customer_facing'
    });
    expect(result.tier).toBe('limited');
  });

  it('falls back to minimal risk when nothing matches', () => {
    const result = classifyAiSystem({
      name: 'Internal Notes Summarizer',
      purpose: 'Summarizes meeting notes for staff',
      domain: 'general',
      deploymentContext: 'internal'
    });
    expect(result.tier).toBe('minimal');
    expect(result.reference).toBeNull();
  });

  it('flags prohibited uses ahead of everything else', () => {
    const result = classifyAiSystem({
      name: 'Citizen Score',
      purpose: 'Builds a social scoring index of citizens',
      domain: 'gov'
    });
    expect(result.tier).toBe('prohibited');
  });
});

describe('planObligations', () => {
  it('gives high risk systems the full EU set plus baselines', () => {
    const planned = planObligations('high');
    const euCount = planned.filter((p) => p.regulationCode === 'eu_ai_act').length;
    expect(euCount).toBe(9);
    expect(planned.length).toBeGreaterThan(9);
  });

  it('gives minimal systems only a light baseline', () => {
    const planned = planObligations('minimal');
    expect(planned.length).toBe(2);
  });

  it('gives limited systems a transparency obligation', () => {
    const planned = planObligations('limited');
    expect(planned.some((p) => p.clauseRef === 'Article 13')).toBe(true);
  });
});
