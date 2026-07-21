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
 * The current audit hash formula version. Bump this when the formula changes,
 * and keep the older branch in `serialize` so rows signed with a past version
 * still verify with the formula that signed them. Each audit_log row stores the
 * version it was signed with in its hash_version column.
 */
export const CURRENT_HASH_VERSION = 2;

/**
 * Serializes a value to a string that does not depend on object key order.
 * Object keys are sorted recursively; arrays keep their order. This matters
 * because audit data is stored as JSONB and Postgres does not preserve the key
 * order of the object that was written, so a plain JSON.stringify would produce
 * a different string on read back and break the chain for no real reason.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const body = Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',');
  return `{${body}}`;
}

function serialize(input: AuditHashInput, version: number): string {
  const fields = [
    input.organizationId,
    input.seq,
    input.actorType,
    input.actorId ?? '',
    input.action,
    input.resourceType ?? '',
    input.resourceId ?? '',
    input.data ?? null,
    input.createdAt
  ];
  // Version 1 used JSON.stringify, whose output depends on object key order and
  // so could not be reproduced from JSONB. Version 2 sorts keys for a stable
  // result. Version 1 is kept only so a row still signed with it can be read.
  return version >= 2 ? stableStringify(fields) : JSON.stringify(fields);
}

/**
 * Computes the HMAC hash for one audit log row. The hash covers the row's
 * content and the previous row's hash, so the whole chain is tamper evident.
 * The key comes from AUDIT_LOG_SECRET, which never leaves the server.
 */
export function computeAuditHash(
  input: AuditHashInput,
  secret: string,
  version: number = CURRENT_HASH_VERSION
): string {
  const canonical = serialize(input, version);
  return createHmac('sha256', secret)
    .update((input.prevHash ?? '') + canonical)
    .digest('hex');
}

export function getAuditSecret(): string {
  return process.env.AUDIT_LOG_SECRET ?? 'dev-audit-secret-change-me';
}
