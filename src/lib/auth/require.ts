import { forbidden, unauthorized } from '@/lib/api/errors';
import { getTenantContext, type TenantContext } from './tenant';
import { hasAtLeast, type Role } from './roles';

/** Returns the tenant context or throws a 401 if there is none. */
export async function requireTenant(): Promise<TenantContext> {
  const context = await getTenantContext();
  if (!context) {
    throw unauthorized('Join or create an organization to continue.');
  }
  return context;
}

/** Returns the tenant context and throws a 403 if the role is too low. */
export async function requireRole(minimum: Role): Promise<TenantContext> {
  const context = await requireTenant();
  if (!hasAtLeast(context.role, minimum)) {
    throw forbidden(`This action needs the ${minimum} role or higher.`);
  }
  return context;
}
