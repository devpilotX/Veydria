import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, type Page } from '@playwright/test';
import { createSignInToken, ensureTestUser } from './clerk';

type ClerkWindow = {
  Clerk?: {
    session?: { id: string } | null;
    setActive: (opts: { session?: string; organization?: string }) => Promise<void>;
  };
};

/**
 * Signs the shared test user in with a server issued sign in token, then sets
 * the given Clerk organization active. A sign in token (ticket) is trusted by
 * Clerk, so it clears the browser client trust gate that blocks a scripted
 * password sign in. The app resolves the active Clerk org to a database org, so
 * a freshly created org id gives the session a brand new, empty workspace.
 */
export async function signInToFreshOrg(page: Page, orgId: string): Promise<void> {
  const userId = await ensureTestUser();
  const ticket = await createSignInToken(userId);

  await setupClerkTestingToken({ page });
  await page.goto('/');
  await clerk.loaded({ page });
  await clerk.signIn({ page, signInParams: { strategy: 'ticket', ticket } });

  // Sign in leaves an active session. Switch it to the fresh organization so the
  // app maps the session to a brand new database org.
  await page.evaluate(async (id) => {
    const clerkGlobal = (window as unknown as ClerkWindow).Clerk;
    if (!clerkGlobal) throw new Error('Clerk is not loaded on the page.');
    await clerkGlobal.setActive({ session: clerkGlobal.session?.id, organization: id });
  }, orgId);

  // The session token refreshes with the org claim asynchronously. Poll the
  // dashboard until the signed in session is recognized server side, so the
  // rest of the test never races the token refresh.
  await expect(async () => {
    await page.goto('/dashboard/overview', { waitUntil: 'domcontentloaded' });
    expect(page.url()).not.toContain('/auth/sign-in');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 60_000, intervals: [1000, 2000, 3000, 5000] });
}
