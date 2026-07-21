import 'dotenv/config';
import { asc, eq, like, sql } from 'drizzle-orm';
import { client, db } from '@/db';
import { auditLog, organizations } from '@/db/schema';
import { computeAuditHash, CURRENT_HASH_VERSION, getAuditSecret } from '@/lib/audit-hash';

/**
 * One time maintenance: re-signs every organization's audit chain in place with
 * the current hash formula, so chains signed by an older formula verify again.
 * It disables the append only trigger inside a single transaction per org,
 * rewrites each row's prevHash and hash in seq order, sets hash_version, then
 * re-enables the trigger. It also removes leftover org_e2e_* test orgs.
 *
 * The cleanest path for the demo is a re-seed (pnpm db:seed). Use this when an
 * org must be re-signed in place without losing its data.
 */
async function main() {
  const secret = getAuditSecret();

  // Remove throwaway e2e test orgs entirely. With the trigger disabled inside
  // the transaction, deleting the org cascades into its audit rows too.
  const e2eOrgs = await db
    .select({ id: organizations.id, clerkOrgId: organizations.clerkOrgId })
    .from(organizations)
    .where(like(organizations.clerkOrgId, 'org_e2e_%'));

  if (e2eOrgs.length > 0) {
    await db.transaction(async (tx) => {
      await tx.execute(sql`ALTER TABLE audit_log DISABLE TRIGGER audit_log_no_mutation`);
      for (const org of e2eOrgs) {
        await tx.delete(organizations).where(eq(organizations.id, org.id));
      }
      await tx.execute(sql`ALTER TABLE audit_log ENABLE TRIGGER audit_log_no_mutation`);
    });
    console.log(
      `Removed ${e2eOrgs.length} throwaway e2e org(s): ${e2eOrgs.map((o) => o.clerkOrgId).join(', ')}`
    );
  } else {
    console.log('No throwaway e2e orgs to remove.');
  }

  // Re-sign every remaining org's chain in place.
  const orgs = await db.select().from(organizations).orderBy(asc(organizations.clerkOrgId));
  let orgsResigned = 0;
  let rowsResigned = 0;

  for (const org of orgs) {
    const rows = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.organizationId, org.id))
      .orderBy(asc(auditLog.seq));
    if (rows.length === 0) continue;

    await db.transaction(async (tx) => {
      await tx.execute(sql`ALTER TABLE audit_log DISABLE TRIGGER audit_log_no_mutation`);
      let prevHash: string | null = null;
      for (const row of rows) {
        const hash = computeAuditHash(
          {
            organizationId: row.organizationId,
            seq: row.seq,
            actorType: row.actorType,
            actorId: row.actorId,
            action: row.action,
            resourceType: row.resourceType,
            resourceId: row.resourceId,
            data: row.data,
            prevHash,
            createdAt: row.createdAt.toISOString()
          },
          secret,
          CURRENT_HASH_VERSION
        );
        await tx
          .update(auditLog)
          .set({ prevHash, hash, hashVersion: CURRENT_HASH_VERSION })
          .where(eq(auditLog.id, row.id));
        prevHash = hash;
      }
      await tx.execute(sql`ALTER TABLE audit_log ENABLE TRIGGER audit_log_no_mutation`);
    });

    orgsResigned += 1;
    rowsResigned += rows.length;
    console.log(`Re-signed ${rows.length} rows for ${org.clerkOrgId}.`);
  }

  console.log(
    `Done. Re-signed ${rowsResigned} rows across ${orgsResigned} org(s) to hash version ${CURRENT_HASH_VERSION}.`
  );
  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await client.end();
  } catch {
    // ignore
  }
  process.exit(1);
});
