import { existsSync } from 'node:fs';
import { config as loadEnv } from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

// Load .env so Clerk keys and DATABASE_URL are available to setup and teardown.
if (existsSync('.env')) loadEnv({ path: '.env' });

const PORT = Number(process.env.E2E_PORT ?? 3010);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  // The journey spec mutates a shared fresh org, so run files in order, one at a time.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './e2e/support/global-setup.ts',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: [
    {
      // Reuse a running dev server if there is one, otherwise start Next on PORT.
      command: `node node_modules/next/dist/bin/next dev -p ${PORT}`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe'
    },
    {
      // The evaluation scorer, so the journey can run a real evaluation.
      command: '.venv\\Scripts\\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000',
      cwd: 'services/evals',
      url: 'http://127.0.0.1:8000/health',
      reuseExistingServer: true,
      timeout: 60_000,
      env: { EVALS_SERVICE_API_KEY: process.env.EVALS_SERVICE_API_KEY ?? 'dev-evals-key-change-me' }
    }
  ]
});
