import { TeamPerformanceTable } from '@/components/dashboard/TeamPerformanceTable';

export default function TeamPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Team Performance</h1>
      <TeamPerformanceTable />
    </div>
  );
}
