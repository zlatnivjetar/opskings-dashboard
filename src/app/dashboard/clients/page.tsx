import { redirect } from 'next/navigation';
import { getUserContext } from '@/lib/auth/get-user-context';
import { ClientAnalysisTable } from '@/components/dashboard/ClientAnalysisTable';

export default async function ClientsPage() {
  const ctx = await getUserContext();
  if (ctx.role !== 'team_member') {
    redirect('/portal');
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Client Analysis</h1>
      <ClientAnalysisTable />
    </div>
  );
}
