import { expect, test } from '@playwright/test';
import { createTestOrg, deleteTestOrg, ensureTestUser } from './support/clerk';
import { cleanupOrgByClerkId } from './support/db-cleanup';
import { signInToFreshOrg } from './support/session';

// A fresh organization has no data, so every dashboard list should show its
// intentional empty state rather than a blank or broken screen.
test.describe.configure({ mode: 'serial' });

let orgId: string;

test.beforeAll(async () => {
  const userId = await ensureTestUser();
  orgId = await createTestOrg(userId, `Veydria E2E Empty ${Date.now()}`);
});

test.afterAll(async () => {
  if (orgId) {
    await cleanupOrgByClerkId(orgId);
    await deleteTestOrg(orgId);
  }
});

const emptyStates: { path: string; heading: string }[] = [
  { path: '/dashboard/systems', heading: 'No AI systems yet' },
  { path: '/dashboard/agents', heading: 'No agents yet' },
  { path: '/dashboard/evaluations', heading: 'No evaluations yet' },
  { path: '/dashboard/obligations', heading: 'No obligations here' },
  { path: '/dashboard/monitoring', heading: 'No events yet' },
  { path: '/dashboard/alerts', heading: 'No alerts' },
  { path: '/dashboard/documents', heading: 'No documents yet' },
  { path: '/dashboard/audit', heading: 'No entries yet' }
];

test('every dashboard page shows an intentional empty state in a fresh org', async ({ page }) => {
  await signInToFreshOrg(page, orgId);

  // Confirm we are actually signed in and on the dashboard, not the sign in page.
  await page.goto('/dashboard/overview');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/overview/);

  for (const { path, heading } of emptyStates) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }

  // The audit page also states the chain is intact even with zero entries.
  await page.goto('/dashboard/audit');
  await expect(page.getByText('The chain is intact')).toBeVisible();

  // The overview shows its recent alerts empty state.
  await page.goto('/dashboard/overview');
  await expect(page.getByRole('heading', { name: 'No alerts yet' })).toBeVisible();
});
