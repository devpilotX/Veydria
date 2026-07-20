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
});
