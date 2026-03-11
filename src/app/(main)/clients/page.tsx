import { ClientAnalysisTable } from '@/components/dashboard/ClientAnalysisTable';

export default async function ClientsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Client Analysis</h1>
      <ClientAnalysisTable />
    </div>
  );
}
