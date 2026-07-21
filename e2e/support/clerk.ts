const CLERK_API = 'https://api.clerk.com/v1';

function secret(): string {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) throw new Error('CLERK_SECRET_KEY is not set. Fill it in .env for the e2e tests.');
  return key;
}

export function testUserEmail(): string {
  return process.env.E2E_CLERK_USER_EMAIL ?? 'veydria-e2e@example.com';
}

export function testUserPassword(): string {
  return process.env.E2E_CLERK_USER_PASSWORD ?? 'Veydria-e2e-Str0ng-Pass';
}

async function clerkFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${CLERK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret()}`,
      'Content-Type': 'application/json',
      ...init.headers
    }
  });
}

/** Finds the test user by email, creating it with a password if it does not exist. */
export async function ensureTestUser(): Promise<string> {
  const email = testUserEmail();
  const query = await clerkFetch(`/users?email_address=${encodeURIComponent(email)}&limit=1`);
  if (query.ok) {
    const users = (await query.json()) as Array<{ id: string }>;
    if (users.length > 0) return users[0].id;
  }

  const created = await clerkFetch('/users', {
    method: 'POST',
    body: JSON.stringify({
      email_address: [email],
      username: process.env.E2E_CLERK_USER_USERNAME ?? 'veydria_e2e',
      password: testUserPassword(),
      skip_password_checks: true
    })
  });
  if (!created.ok) {
    throw new Error(`Could not create the test user: ${created.status} ${await created.text()}`);
  }
  const user = (await created.json()) as { id: string };
  return user.id;
}

/** Mints a single use sign in token (ticket) for the user. Server issued, so it
 * bypasses the browser client trust gate that blocks scripted password sign in. */
export async function createSignInToken(userId: string): Promise<string> {
  const created = await clerkFetch('/sign_in_tokens', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId })
  });
  if (!created.ok) {
    throw new Error(`Could not create a sign in token: ${created.status} ${await created.text()}`);
  }
  const token = (await created.json()) as { token: string };
  return token.token;
}

/** Creates a fresh Clerk organization owned by the test user. */
export async function createTestOrg(userId: string, name: string): Promise<string> {
  const created = await clerkFetch('/organizations', {
    method: 'POST',
    body: JSON.stringify({ name, created_by: userId })
  });
  if (!created.ok) {
    throw new Error(`Could not create the test org: ${created.status} ${await created.text()}`);
  }
  const org = (await created.json()) as { id: string };
  return org.id;
}

/** Deletes a Clerk organization. Safe to call even if it is already gone. */
export async function deleteTestOrg(orgId: string): Promise<void> {
  await clerkFetch(`/organizations/${orgId}`, { method: 'DELETE' }).catch(() => undefined);
}
