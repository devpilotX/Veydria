import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { memberships, organizations, users } from '@/db/schema';
import { getOrCreateOrganization, getOrCreateUser } from '@/lib/auth/tenant';
import { mapClerkRole } from '@/lib/auth/roles';

/**
 * Keeps our local mirror of Clerk users, organizations, and memberships in
 * sync. Configure the endpoint and CLERK_WEBHOOK_SECRET in the Clerk dashboard.
 */
export async function POST(request: NextRequest) {
  if (!process.env.CLERK_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhooks are not configured.' }, { status: 503 });
  }

  let event;
  try {
    event = await verifyWebhook(request, { signingSecret: process.env.CLERK_WEBHOOK_SECRET });
  } catch {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  // The webhook payload shape depends on the event type, so we read fields
  // defensively from a loosely typed object.
  const data = event.data as unknown as Record<string, unknown>;

  try {
    switch (event.type) {
      case 'user.created':
      case 'user.updated': {
        const emails = (data.email_addresses as Array<{ email_address: string }> | undefined) ?? [];
        await db
          .insert(users)
          .values({
            clerkUserId: String(data.id),
            email: emails[0]?.email_address ?? `${String(data.id)}@placeholder.local`,
            firstName: (data.first_name as string | null) ?? null,
            lastName: (data.last_name as string | null) ?? null,
            imageUrl: (data.image_url as string | null) ?? null
          })
          .onConflictDoUpdate({
            target: users.clerkUserId,
            set: {
              email: emails[0]?.email_address ?? undefined,
              firstName: (data.first_name as string | null) ?? null,
              lastName: (data.last_name as string | null) ?? null,
              imageUrl: (data.image_url as string | null) ?? null,
              updatedAt: new Date()
            }
          });
        break;
      }
      case 'organization.created':
      case 'organization.updated': {
        await db
          .insert(organizations)
          .values({
            clerkOrgId: String(data.id),
            name: (data.name as string) ?? String(data.id),
            slug: (data.slug as string | null) ?? null,
            imageUrl: (data.image_url as string | null) ?? null
          })
          .onConflictDoUpdate({
            target: organizations.clerkOrgId,
            set: {
              name: (data.name as string) ?? String(data.id),
              slug: (data.slug as string | null) ?? null,
              imageUrl: (data.image_url as string | null) ?? null,
              updatedAt: new Date()
            }
          });
        break;
      }
      case 'organizationMembership.created':
      case 'organizationMembership.updated': {
        const orgData = data.organization as { id: string } | undefined;
        const userData = data.public_user_data as { user_id: string } | undefined;
        if (orgData && userData) {
          const org = await getOrCreateOrganization(orgData.id);
          const user = await getOrCreateUser(userData.user_id);
          const role = mapClerkRole(data.role as string);
          await db
            .insert(memberships)
            .values({ organizationId: org.id, userId: user.id, role })
            .onConflictDoUpdate({
              target: [memberships.organizationId, memberships.userId],
              set: { role, updatedAt: new Date() }
            });
        }
        break;
      }
      case 'organizationMembership.deleted': {
        const orgData = data.organization as { id: string } | undefined;
        const userData = data.public_user_data as { user_id: string } | undefined;
        if (orgData && userData) {
          const org = await db.query.organizations.findFirst({
            where: eq(organizations.clerkOrgId, orgData.id)
          });
          const user = await db.query.users.findFirst({
            where: eq(users.clerkUserId, userData.user_id)
          });
          if (org && user) {
            await db
              .delete(memberships)
              .where(and(eq(memberships.organizationId, org.id), eq(memberships.userId, user.id)));
          }
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error('Clerk webhook handling failed', error);
    return NextResponse.json({ error: 'Handler failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
