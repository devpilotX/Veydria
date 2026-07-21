import { clerkSetup } from '@clerk/testing/playwright';
import { ensureTestUser } from './clerk';

/**
 * Runs once before the e2e suite. clerkSetup fetches a Clerk testing token so
 * the frontend skips bot protection during automated sign in. Then we make sure
 * the shared password test user exists in the Clerk development instance.
 */
async function globalSetup() {
  await clerkSetup({
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  });
  await ensureTestUser();
}

export default globalSetup;
