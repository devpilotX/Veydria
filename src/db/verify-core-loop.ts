import 'dotenv/config';
import { and, eq } from 'drizzle-orm';
import { client, db } from '@/db';
import { aiSystems, alerts, auditLog, obligations } from '@/db/schema';
import { getOrCreateOrganization } from '@/lib/auth/tenant';
import { createAndClassifyAiSystem } from '@/server/services/classification';
import { raiseAlert } from '@/server/services/alerts';
import { verifyAuditChain } from '@/server/services/audit';
import type { TenantContext } from '@/lib/auth/tenant';

/**
 * Verifies the core loop in a fresh organization that has no demo seed, the way
 * a brand new Clerk organization would arrive. It provisions the org row,
 * creates and classifies a system against the global knowledge base, checks the
 * tier, obligations, and audit entries, then removes the test system. The
 * dedicated verification org is reused across runs so it does not pile up.
 */
const VERIFY_CLERK_ORG_ID = 'org_core_loop_check';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`  ok: ${message}`);
}

async function main() {
  console.log('Verifying the core loop in a fresh organization...');

  // 1. A fresh Clerk org id maps to a new database org row.
  const org = await getOrCreateOrganization(VERIFY_CLERK_ORG_ID, 'Core Loop Check');
  assert(Boolean(org.id), 'a database org row exists for the fresh Clerk org id');
  assert(org.clerkOrgId === VERIFY_CLERK_ORG_ID, 'the org row is linked to the fresh Clerk org id');

  // Start clean: remove domain rows left by a previous run (cascades
  // obligations). The audit chain is append only and stays, growing each run.
  await db.delete(alerts).where(eq(alerts.organizationId, org.id));
  await db.delete(aiSystems).where(eq(aiSystems.organizationId, org.id));

  // 2. Create and classify a system in that fresh org, with no demo data present.
  const ctx: TenantContext = {
    organizationId: org.id,
    clerkOrgId: VERIFY_CLERK_ORG_ID,
    userId: null,
    clerkUserId: null,
    role: 'owner',
    isDemo: false
  };

  const result = await createAndClassifyAiSystem(ctx, {
    name: 'Fresh Org Hiring Screener',
    purpose: 'Ranks and screens job applicants for recruiters',
    domain: 'hr',
    deploymentContext: 'internal',
    actorRole: 'provider',
    lifecycle: 'production'
  });

  assert(
    result.riskTier === 'high',
    `a hiring tool classifies as high risk (got ${result.riskTier})`
  );
  assert(
    result.obligationsCreated > 0,
    `obligations were generated from the global KB (got ${result.obligationsCreated})`
  );

  // 3. The obligations actually persisted, scoped to the fresh org.
  const savedObligations = await db
    .select({ id: obligations.id })
    .from(obligations)
    .where(and(eq(obligations.organizationId, org.id), eq(obligations.aiSystemId, result.id)));
  assert(
    savedObligations.length === result.obligationsCreated,
    `obligations persisted for the system (${savedObligations.length} rows)`
  );

  // 4. The loop was recorded in the audit trail for this org.
  const auditRows = await db
    .select({ action: auditLog.action })
    .from(auditLog)
    .where(eq(auditLog.organizationId, org.id));
  const actions = auditRows.map((row) => row.action);
  assert(actions.includes('ai_system.created'), 'audit trail has ai_system.created');
  assert(actions.includes('ai_system.classified'), 'audit trail has ai_system.classified');
  assert(actions.includes('obligations.generated'), 'audit trail has obligations.generated');

  // Raise an alert so the chain also contains an alert.raised row, the other
  // entry whose JSONB data reordered and used to break verification.
  await raiseAlert({
    organizationId: org.id,
    aiSystemId: result.id,
    type: 'integrity',
    severity: 'low',
    source: 'system',
    title: 'Core loop verification check',
    description: 'Synthetic alert raised by the verifier to exercise the audit chain.',
    actorLabel: 'Verifier'
  });

  const withAlert = await db
    .select({ action: auditLog.action })
    .from(auditLog)
    .where(eq(auditLog.organizationId, org.id));
  assert(
    withAlert.some((row) => row.action === 'alert.raised'),
    'audit trail has alert.raised'
  );

  // The real guard: recompute the whole chain and fail if it does not verify.
  const chain = await verifyAuditChain(org.id);
  assert(
    chain.valid,
    chain.valid
      ? `the audit chain verifies across ${chain.checked} entries`
      : `the audit chain broke at seq ${chain.brokenAtSeq}: ${chain.reason}`
  );

  // Clean up the test system and alert (cascades obligations). The org and its
  // audit trail stay, since the audit log is append only.
  await db.delete(alerts).where(eq(alerts.organizationId, org.id));
  await db.delete(aiSystems).where(eq(aiSystems.id, result.id));

  console.log(
    `\nPASS: fresh org ${org.id.slice(0, 8)} classified to ${result.riskTier} with ${result.obligationsCreated} obligations, raised an alert, and the audit chain verifies across ${chain.checked} entries.`
  );
  await client.end();
}

main().catch(async (error) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  await client.end();
  process.exit(1);
});
