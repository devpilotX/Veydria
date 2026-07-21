import { describe, expect, it } from 'vitest';
import { computeAuditHash, type AuditHashInput } from './audit-hash';

const secret = 'test-secret';

function baseInput(overrides: Partial<AuditHashInput> = {}): AuditHashInput {
  return {
    organizationId: 'org-1',
    seq: 1,
    actorType: 'user',
    actorId: 'user-1',
    action: 'ai_system.created',
    resourceType: 'ai_system',
    resourceId: 'sys-1',
    data: { name: 'Test' },
    prevHash: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

describe('computeAuditHash', () => {
  it('is deterministic for the same input', () => {
    expect(computeAuditHash(baseInput(), secret)).toBe(computeAuditHash(baseInput(), secret));
  });

  it('changes when any field changes', () => {
    const original = computeAuditHash(baseInput(), secret);
    expect(computeAuditHash(baseInput({ action: 'ai_system.deleted' }), secret)).not.toBe(original);
    expect(computeAuditHash(baseInput({ seq: 2 }), secret)).not.toBe(original);
    expect(computeAuditHash(baseInput({ data: { name: 'Other' } }), secret)).not.toBe(original);
  });

  it('changes when the secret changes', () => {
    expect(computeAuditHash(baseInput(), 'other-secret')).not.toBe(
      computeAuditHash(baseInput(), secret)
    );
  });

  it('links a chain so tampering with an early row breaks later hashes', () => {
    const first = computeAuditHash(baseInput({ seq: 1, prevHash: null }), secret);
    const second = computeAuditHash(baseInput({ seq: 2, prevHash: first }), secret);

    // Tamper with the first row, recompute, and the chain no longer matches.
    const tamperedFirst = computeAuditHash(
      baseInput({ seq: 1, prevHash: null, action: 'tampered' }),
      secret
    );
    const secondFromTampered = computeAuditHash(
      baseInput({ seq: 2, prevHash: tamperedFirst }),
      secret
    );
    expect(secondFromTampered).not.toBe(second);
  });

  it('does not depend on data key order, so it survives a JSONB round trip', () => {
    // The same data written with different key order (top level and nested)
    // must hash the same, because JSONB does not preserve the written order.
    const insertionOrder = computeAuditHash(
      baseInput({
        data: { count: 18, byFramework: { eu_ai_act: 9, nist_ai_rmf: 5, iso_42001: 4 } }
      }),
      secret
    );
    const jsonbOrder = computeAuditHash(
      baseInput({
        data: { byFramework: { eu_ai_act: 9, iso_42001: 4, nist_ai_rmf: 5 }, count: 18 }
      }),
      secret
    );
    expect(jsonbOrder).toBe(insertionOrder);
  });

  it('still separates different data regardless of order', () => {
    const a = computeAuditHash(baseInput({ data: { a: 1, b: 2 } }), secret);
    const b = computeAuditHash(baseInput({ data: { a: 1, b: 3 } }), secret);
    expect(a).not.toBe(b);
  });

  it('version 1 and version 2 formulas differ when data key order matters', () => {
    // Unordered keys: version 1 (JSON.stringify) keeps insertion order, version
    // 2 sorts them, so the two formulas produce different hashes.
    const unordered = { zulu: 1, alpha: 2 };
    const v1 = computeAuditHash(baseInput({ data: unordered }), secret, 1);
    const v2 = computeAuditHash(baseInput({ data: unordered }), secret, 2);
    expect(v1).not.toBe(v2);
  });
});
