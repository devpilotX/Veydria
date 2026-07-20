import PageContainer from '@/components/layout/page-container';
import { NewSystemForm } from '@/features/dashboard/components/new-system-form';
import { getDashboardContext } from '@/lib/auth/page';

export const metadata = { title: 'New AI system' };

export default async function NewSystemPage() {
  await getDashboardContext();
  return (
    <PageContainer
      pageTitle='New AI system'
      pageDescription='Describe the system and we will classify its risk and map its obligations.'
    >
      <NewSystemForm />
    </PageContainer>
  );
}
