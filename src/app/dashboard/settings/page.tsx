import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiKeysManager } from '@/features/dashboard/components/api-keys-manager';
import { getDashboardContext } from '@/lib/auth/page';
import { listApiKeys } from '@/server/services/api-keys';
import { getSubscription } from '@/server/services/billing';
import { PLANS } from '@/config/plans';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const ctx = await getDashboardContext();
  const [keys, subscription] = await Promise.all([listApiKeys(ctx), getSubscription(ctx)]);

  const serialized = keys.map((key) => ({
    id: key.id,
    name: key.name,
    keyPrefix: key.keyPrefix,
    lastUsedAt: key.lastUsedAt ? key.lastUsedAt.toISOString() : null,
    revokedAt: key.revokedAt ? key.revokedAt.toISOString() : null,
    createdAt: key.createdAt.toISOString()
  }));

  return (
    <PageContainer
      pageTitle='Settings'
      pageDescription='Manage how your workspace connects to Veydria.'
    >
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
            <CardDescription>Your current subscription and limits.</CardDescription>
          </CardHeader>
          <CardContent className='text-sm'>
            <p>
              <span className='font-medium'>{PLANS[subscription.plan].name}</span>, status{' '}
              {subscription.status}.
            </p>
            <p className='text-muted-foreground mt-1'>
              Up to {PLANS[subscription.plan].limits.aiSystems ?? 'unlimited'} AI systems and{' '}
              {PLANS[subscription.plan].limits.seats ?? 'unlimited'} seats.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API keys</CardTitle>
            <CardDescription>
              Connect agents through the SDK, the MCP server, or direct HTTP. Keys act with member
              access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApiKeysManager initialKeys={serialized} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
