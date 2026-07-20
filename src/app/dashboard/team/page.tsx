import { eq } from 'drizzle-orm';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/dashboard/empty-state';
import { getDashboardContext } from '@/lib/auth/page';
import { db } from '@/db';
import { memberships, users } from '@/db/schema';

export const metadata = { title: 'Team' };

const roleTone: Record<string, string> = {
  owner: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  admin: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
};

export default async function TeamPage() {
  const ctx = await getDashboardContext();

  const members = await db
    .select({
      id: memberships.id,
      role: memberships.role,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.organizationId, ctx.organizationId));

  return (
    <PageContainer
      pageTitle='Team and roles'
      pageDescription='Who can see and change what in your workspace. Roles are managed in Clerk.'
    >
      {members.length === 0 ? (
        <EmptyState
          icon='teams'
          title='No members yet'
          description='Invite teammates from your organization settings to collaborate here.'
        />
      ) : (
        <Card>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className='font-medium'>
                      {[member.firstName, member.lastName].filter(Boolean).join(' ') || 'Member'}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>{member.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className={`capitalize ${roleTone[member.role] ?? ''}`}
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
