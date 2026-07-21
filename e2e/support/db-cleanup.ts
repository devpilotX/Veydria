import postgres from 'postgres';

/**
 * Removes the deletable domain rows for the DB organization that maps to a Clerk
 * org id. The audit_log is append only (a trigger blocks deletes), so it and the
 * org row stay. Uses a short lived connection so the test worker exits cleanly.
 */
export async function cleanupOrgByClerkId(clerkOrgId: string): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const sql = postgres(url, { max: 1 });
  try {
    const rows = await sql`select id from organizations where clerk_org_id = ${clerkOrgId} limit 1`;
    if (rows.length === 0) return;
    const orgId = rows[0].id as string;
    await sql`delete from documents where organization_id = ${orgId}`;
    await sql`delete from alerts where organization_id = ${orgId}`;
    await sql`delete from monitoring_events where organization_id = ${orgId}`;
    await sql`delete from evaluation_cases where organization_id = ${orgId}`;
    await sql`delete from evaluations where organization_id = ${orgId}`;
    await sql`delete from obligations where organization_id = ${orgId}`;
    await sql`delete from agents where organization_id = ${orgId}`;
    await sql`delete from ai_systems where organization_id = ${orgId}`;
  } finally {
    await sql.end({ timeout: 5 });
  }
}
