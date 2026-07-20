import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { memberships, organizations, users } from '@/db/schema';
import { mapClerkRole, type Role } from './roles';

// The seed creates this organization. In development without Clerk keys we fall
// back to it so the dashboard has data to show. This never happens in production.
const DEMO_CLERK_ORG_ID = 'org_demo_northwind';

export type TenantContext = {
  organizationId: string;
  clerkOrgId: string;
  userId: string | null;
  clerkUserId: string | null;
  role: Role;
  isDemo: boolean;
};

/**
 * Resolves the current tenant from the Clerk session. Creates the local
 * organization and user rows on first sight so domain data always has a tenant
 * to hang off, even before the Clerk webhook fires.
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const { userId: clerkUserId, orgId: clerkOrgId, orgRole } = await auth();

  if (clerkOrgId) {
    const org = await getOrCreateOrganization(clerkOrgId);
    const user = clerkUserId ? await getOrCreateUser(clerkUserId) : null;
    const role = await resolveRole(org.id, user?.id ?? null, orgRole);
    return {
      organizationId: org.id,
      clerkOrgId,
      userId: user?.id ?? null,
      clerkUserId: clerkUserId ?? null,
      role,
      isDemo: false
    };
  }

  if (process.env.NODE_ENV !== 'production') {
    const demo = await db.query.organizations.findFirst({
      where: eq(organizations.clerkOrgId, DEMO_CLERK_ORG_ID)
    });
    if (demo) {
      return {
        organizationId: demo.id,
        clerkOrgId: DEMO_CLERK_ORG_ID,
        userId: null,
        clerkUserId: null,
        role: 'owner',
        isDemo: true
      };
    }
  }

  return null;
}

export async function getOrCreateOrganization(clerkOrgId: string, name?: string) {
  const existing = await db.query.organizations.findFirst({
    where: eq(organizations.clerkOrgId, clerkOrgId)
  });
  if (existing) return existing;

  const [created] = await db
    .insert(organizations)
    .values({ clerkOrgId, name: name ?? clerkOrgId })
    .onConflictDoNothing({ target: organizations.clerkOrgId })
    .returning();
  if (created) return created;

  // Another request created it first. Read it back.
  const row = await db.query.organizations.findFirst({
    where: eq(organizations.clerkOrgId, clerkOrgId)
  });
  if (!row) throw new Error('Failed to resolve organization');
  return row;
}

export async function getOrCreateUser(clerkUserId: string, email?: string) {
  const existing = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId)
  });
  if (existing) return existing;

  const [created] = await db
    .insert(users)
    .values({ clerkUserId, email: email ?? `${clerkUserId}@placeholder.local` })
    .onConflictDoNothing({ target: users.clerkUserId })
    .returning();
  if (created) return created;

  const row = await db.query.users.findFirst({ where: eq(users.clerkUserId, clerkUserId) });
  if (!row) throw new Error('Failed to resolve user');
  return row;
}

async function resolveRole(
  organizationId: string,
  userId: string | null,
  orgRole: string | null | undefined
): Promise<Role> {
  if (userId) {
    const membership = await db.query.memberships.findFirst({
      where: and(eq(memberships.organizationId, organizationId), eq(memberships.userId, userId))
    });
    if (membership) return membership.role;
  }
  return mapClerkRole(orgRole);
}
