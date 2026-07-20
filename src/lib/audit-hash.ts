import { createHmac } from 'node:crypto';

export type AuditHashInput = {
  organizationId: string;
  seq: number;
  actorType: string;
  actorId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  data: Record<string, unknown> | null;
  prevHash: string | null;
  createdAt: string; // ISO string
};

/**
 * Computes the HMAC hash for one audit log row. The hash covers the row's
 * content and the previous row's hash, so the whole chain is tamper evident.
 * The key comes from AUDIT_LOG_SECRET, which never leaves the server.
 */
export function computeAuditHash(input: AuditHashInput, secret: string): string {
  // Stable field order so the same row always hashes the same way.
  const canonical = JSON.stringify([
    input.organizationId,
    input.seq,
    input.actorType,
    input.actorId ?? '',
    input.action,
    input.resourceType ?? '',
    input.resourceId ?? '',
    input.data ?? null,
    input.createdAt
  ]);
  return createHmac('sha256', secret)
    .update((input.prevHash ?? '') + canonical)
    .digest('hex');
}

export function getAuditSecret(): string {
  return process.env.AUDIT_LOG_SECRET ?? 'dev-audit-secret-change-me';
}
