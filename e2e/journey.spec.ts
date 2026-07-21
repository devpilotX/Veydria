import { expect, test } from '@playwright/test';
import { createTestOrg, deleteTestOrg, ensureTestUser } from './support/clerk';
import { cleanupOrgByClerkId } from './support/db-cleanup';
import { signInToFreshOrg } from './support/session';

// Walks the whole compliance journey through the real UI as a brand new
// organization: connect a system, add an agent, run an evaluation, act on the
// alert it raises, generate a document, and confirm the audit chain is intact.
test.describe.configure({ mode: 'serial' });

let orgId: string;

test.beforeAll(async () => {
  const userId = await ensureTestUser();
  orgId = await createTestOrg(userId, `Veydria E2E Journey ${Date.now()}`);
});

test.afterAll(async () => {
  if (orgId) {
    await cleanupOrgByClerkId(orgId);
    await deleteTestOrg(orgId);
  }
});

test('a fresh org runs the full compliance journey through the UI', async ({ page }) => {
  await signInToFreshOrg(page, orgId);

  // 1. Connect and classify an AI system.
  await page.goto('/dashboard/systems/new');
  await page.getByLabel('Name', { exact: true }).fill('Loan Eligibility Advisor');
  await page
    .getByLabel('What it does')
    .fill(
      'Estimates whether an applicant qualifies for a consumer loan before a formal credit check.'
    );
  await page.getByLabel('Domain').fill('fintech');
  await page.getByLabel('Deployment').selectOption('customer_facing');
  await page.getByRole('button', { name: 'Create and classify' }).click();

  await expect(page.getByRole('heading', { name: /is set up/ })).toBeVisible();
  await expect(page.getByText(/Generated \d+ obligation/)).toBeVisible();

  // Open the system from the list and keep its detail URL.
  await page.goto('/dashboard/systems');
  await page.getByRole('link', { name: 'Loan Eligibility Advisor' }).click();
  await expect(page).toHaveURL(/\/dashboard\/systems\/[0-9a-f-]+/);
  const systemUrl = page.url();

  // Obligations were generated and are listed.
  await page.goto('/dashboard/obligations');
  await expect(page.getByRole('table')).toBeVisible();

  // 2. Add an agent.
  await page.goto('/dashboard/agents/new');
  await page.getByLabel('Name', { exact: true }).fill('Eligibility Estimator');
  await page.getByLabel('Model provider').fill('openai');
  await page.getByLabel('Model name').fill('gpt-4o');
  await page.getByRole('button', { name: 'Create agent' }).click();
  await expect(page).toHaveURL(/\/dashboard\/agents\/[0-9a-f-]+/);
  await expect(page.getByRole('heading', { name: 'Eligibility Estimator' })).toBeVisible();

  // 3. Run an evaluation with a strict pass mark so it falls below threshold.
  await page.getByLabel('Test').selectOption('bias');
  await page.getByLabel('Pass mark').fill('99');
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes('/api/evaluations') && response.request().method() === 'POST',
      { timeout: 90_000 }
    ),
    page.getByRole('button', { name: 'Run evaluation' }).click()
  ]);
  await expect(page).toHaveURL(/\/dashboard\/evaluations\/[0-9a-f-]+/);
  await expect(page.getByRole('heading', { name: /evaluation/i })).toBeVisible();
  await expect(page.getByText('Pass mark 99')).toBeVisible();

  // 4. The failing evaluation auto-raised an alert. Acknowledge then resolve it.
  await page.goto('/dashboard/alerts');
  await page.getByRole('button', { name: 'Acknowledge' }).first().click();
  await expect(page.getByRole('button', { name: 'Resolve' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Resolve' }).first().click();
  await expect(page.getByRole('button', { name: 'Acknowledge' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Resolve' })).toHaveCount(0);

  // 5. Generate a compliance document from the system's live data.
  await page.goto(systemUrl);
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes('/api/documents') && response.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Risk assessment' }).click()
  ]);
  await page.goto('/dashboard/documents');
  await expect(page.getByRole('link', { name: /Risk assessment/ })).toBeVisible();

  // 6. The audit trail verifies as intact on the exact screen an auditor sees.
  await page.goto('/dashboard/audit');
  await expect(page.getByText('The chain is intact')).toBeVisible();
});
