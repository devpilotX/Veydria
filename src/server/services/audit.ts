import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { auditLog } from '@/db/schema';
import { computeAuditHash, getAuditSecret } from '@/lib/audit-hash';

export type AuditActorType = 'user' | 'system' | 'agent' | 'api_key';

export type AppendAuditInput = {
  organizationId: string;
  actorType: AuditActorType;
  actorId?: string | null;
  actorLabel?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  data?: Record<string, unknown> | null;
};

/**
 * Appends one row to an organization's audit chain. An advisory lock keyed by
 * the organization serialises appends so the per organization sequence and the
 * hash chain stay consistent under concurrency.
 */
export async function appendAuditLog(input: AppendAuditInput) {
  const secret = getAuditSecret();

  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${input.organizationId}))`);

    const [last] = await tx
      .select({ seq: auditLog.seq, hash: auditLog.hash })
      .from(auditLog)
      .where(eq(auditLog.organizationId, input.organizationId))
      .orderBy(desc(auditLog.seq))
      .limit(1);

    const seq = (last?.seq ?? 0) + 1;
    const prevHash = last?.hash ?? null;
    const createdAt = new Date();

    const hash = computeAuditHash(
      {
        organizationId: input.organizationId,
        seq,
        actorType: input.actorType,
        actorId: input.actorId ?? null,
        action: input.action,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        data: input.data ?? null,
        prevHash,
        createdAt: createdAt.toISOString()
      },
      secret
    );

    const [row] = await tx
      .insert(auditLog)
      .values({
        organizationId: input.organizationId,
        seq,
        actorType: input.actorType,
        actorId: input.actorId ?? null,
        actorLabel: input.actorLabel ?? null,
        action: input.action,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        data: input.data ?? null,
        prevHash,
        hash,
        createdAt
      })
      .returning();

    return row;
  });
}

export type ChainVerification = {
  valid: boolean;
  checked: number;
  brokenAtSeq: number | null;
  reason: string | null;
};

export async function listAuditLog(
  organizationId: string,
  page: number,
  pageSize: number
): Promise<{ items: (typeof auditLog.$inferSelect)[]; total: number }> {
  const [items, [totals]] = await Promise.all([
    db
      .select()
      .from(auditLog)
      .where(eq(auditLog.organizationId, organizationId))
      .orderBy(desc(auditLog.seq))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(auditLog)
      .where(eq(auditLog.organizationId, organizationId))
  ]);
  return { items, total: totals?.value ?? 0 };
}

/**
 * Recomputes every hash in an organization's chain and checks that each row
 * points at the row before it. Returns the first break it finds.
 */
export async function verifyAuditChain(organizationId: string): Promise<ChainVerification> {
  const secret = getAuditSecret();
  const rows = await db
    .select()
    .from(auditLog)
    .where(eq(auditLog.organizationId, organizationId))
    .orderBy(auditLog.seq);

  let prevHash: string | null = null;
  for (const row of rows) {
    if (row.prevHash !== prevHash) {
      return {
        valid: false,
        checked: rows.length,
        brokenAtSeq: row.seq,
        reason: 'The previous hash does not match the row before it.'
      };
    }
    const expected = computeAuditHash(
      {
        organizationId: row.organizationId,
        seq: row.seq,
        actorType: row.actorType,
        actorId: row.actorId,
        action: row.action,
        resourceType: row.resourceType,
        resourceId: row.resourceId,
        data: row.data,
        prevHash: row.prevHash,
        createdAt: row.createdAt.toISOString()
      },
      secret
    );
    if (expected !== row.hash) {
      return {
        valid: false,
        checked: rows.length,
        brokenAtSeq: row.seq,
        reason: 'The stored hash does not match the recomputed hash.'
      };
    }
    prevHash = row.hash;
  }

  return { valid: true, checked: rows.length, brokenAtSeq: null, reason: null };
}
