import { redirect } from 'next/navigation';
import { getTenantContext, type TenantContext } from './tenant';

/**
 * For server components. Returns the tenant context, or sends the visitor to
 * the workspace picker when they have no organization yet.
 */
export async function getDashboardContext(): Promise<TenantContext> {
  const context = await getTenantContext();
  if (!context) {
    redirect('/dashboard/workspaces');
  }
  return context;
}
