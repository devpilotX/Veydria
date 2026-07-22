import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Billing' };

// Billing is intentionally hidden for launch. The custom Stripe backend in
// src/server/services/billing.ts and /api/billing is left in place but unused,
// deferred until after first-user feedback. This page shows a placeholder so it
// can never render the Clerk PricingTable while Clerk Billing is disabled.
export default function BillingPage() {
  return (
    <PageContainer pageTitle='Billing' pageDescription='Plans and payment for your workspace.'>
      <Card>
        <CardHeader>
          <CardTitle>Billing is coming soon</CardTitle>
          <CardDescription>Self serve plans and payment are not switched on yet.</CardDescription>
        </CardHeader>
        <CardContent className='text-muted-foreground text-sm'>
          You can keep using every feature in your current plan while we finish this. To change your
          plan or ask about pricing in the meantime, contact us and we will sort it out.
        </CardContent>
      </Card>
    </PageContainer>
  );
}
