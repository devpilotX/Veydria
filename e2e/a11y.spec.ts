import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { createTestOrg, deleteTestOrg, ensureTestUser } from './support/clerk';
import { cleanupOrgByClerkId } from './support/db-cleanup';
import { signInToFreshOrg } from './support/session';

// Automated accessibility scan with axe on the public pages and the signed in
// dashboard. Fails on serious or critical WCAG 2 A and AA violations.

const SERIOUS = new Set(['serious', 'critical']);

async function scanAndReport(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter((v) => SERIOUS.has(v.impact ?? ''));
  for (const v of results.violations) {
    const nodes = v.nodes
      .slice(0, 3)
      .map((n) => n.target.join(' '))
      .join(' | ');
    console.log(`A11Y ${label} [${v.impact}] ${v.id}: ${v.help} :: ${nodes}`);
  }
  expect(
    serious,
    `serious/critical a11y violations on ${label}: ${serious.map((v) => v.id).join(', ')}`
  ).toEqual([]);
}

let orgId: string;

test.beforeAll(async () => {
  const userId = await ensureTestUser();
  orgId = await createTestOrg(userId, `Veydria E2E A11y ${Date.now()}`);
});

test.afterAll(async () => {
  if (orgId) {
    await cleanupOrgByClerkId(orgId);
    await deleteTestOrg(orgId);
  }
});

test('marketing homepage is accessible', async ({ page }) => {
  await page.goto('/');
  await scanAndReport(page, 'homepage');
});

test('sign in screen is accessible', async ({ page }) => {
  await page.goto('/auth/sign-in');
  await page.waitForLoadState('networkidle');
  await scanAndReport(page, 'sign-in');
});

test('signed in dashboard is accessible', async ({ page }) => {
  await signInToFreshOrg(page, orgId);
  await page.goto('/dashboard/overview');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await scanAndReport(page, 'dashboard/overview');
  await page.goto('/dashboard/agents');
  await expect(page.getByRole('heading', { name: 'No agents yet' })).toBeVisible();
  await scanAndReport(page, 'dashboard/agents');
});
