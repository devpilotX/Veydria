import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/stat-card';
import { AlertStatusBadge, RiskBadge, SeverityBadge } from '@/components/dashboard/badges';
import { EmptyState } from '@/components/dashboard/empty-state';
import { ActivityChart } from '@/features/dashboard/components/activity-chart';
import { getDashboardContext } from '@/lib/auth/page';
import { getOverviewStats } from '@/server/services/overview';

export const metadata = { title: 'Dashboard' };

export default async function OverviewPage() {
  const ctx = await getDashboardContext();
  const stats = await getOverviewStats(ctx);

  const tiers: Array<{ key: keyof typeof stats.tierBreakdown; label: string }> = [
    { key: 'high', label: 'High risk' },
    { key: 'limited', label: 'Limited risk' },
    { key: 'minimal', label: 'Minimal risk' },
    { key: 'unknown', label: 'Unclassified' }
  ];

  return (
    <PageContainer
      pageTitle='Dashboard'
      pageDescription='A live view of your AI estate, its risk, and what needs attention.'
    >
      <div className='space-y-6'>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            title='AI systems'
            value={stats.systemsTotal}
            icon='shield'
            hint='Tracked in your inventory'
          />
          <StatCard
            title='High risk systems'
            value={stats.highRiskTotal}
            icon='scale'
            tone={stats.highRiskTotal > 0 ? 'warning' : 'default'}
            hint='Need the full obligation set'
          />
          <StatCard
            title='Obligations met'
            value={`${stats.obligationsMetPct}%`}
            icon='checklist'
            tone={stats.obligationsMetPct >= 80 ? 'success' : 'warning'}
            hint={`${stats.obligationsMet} of ${stats.obligationsTotal} across systems`}
          />
          <StatCard
            title='Open alerts'
            value={stats.openAlerts}
            icon='notification'
            tone={stats.openAlerts > 0 ? 'danger' : 'success'}
            hint='Unresolved issues'
          />
        </div>

        <div className='grid gap-4 lg:grid-cols-3'>
          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle>Agent activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityChart data={stats.monitoring.byDay} />
              <p className='text-muted-foreground mt-2 text-xs'>
                {stats.monitoring.last7Days} events in the last seven days,{' '}
                {stats.monitoring.flaggedLast7Days} flagged for review.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk breakdown</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {tiers.map((tier) => (
                <div key={tier.key} className='flex items-center justify-between'>
                  <RiskBadge tier={tier.key} />
                  <span className='text-sm font-medium'>{stats.tierBreakdown[tier.key]}</span>
                </div>
              ))}
              <div className='text-muted-foreground border-t pt-3 text-xs'>
                Evaluations: {stats.evalsPassed} passed, {stats.evalsFailed} below threshold.
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentAlerts.length === 0 ? (
              <EmptyState
                icon='notification'
                title='No alerts yet'
                description='When monitoring or evaluations flag something, it shows here.'
              />
            ) : (
              <div className='divide-border divide-y'>
                {stats.recentAlerts.map((alert) => (
                  <Link
                    key={alert.id}
                    href='/dashboard/alerts'
                    className='hover:bg-muted/50 -mx-2 flex items-center justify-between gap-4 rounded-md px-2 py-3'
                  >
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-medium'>{alert.title}</p>
                      <p className='text-muted-foreground truncate text-xs'>{alert.description}</p>
                    </div>
                    <div className='flex shrink-0 items-center gap-2'>
                      <SeverityBadge severity={alert.severity} />
                      <AlertStatusBadge status={alert.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
