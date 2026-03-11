import { TeamPerformanceTable } from '@/components/dashboard/TeamPerformanceTable';
import { TeamTopPerformersChart } from '@/components/dashboard/TeamTopPerformersChart';

export default function TeamPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Team Performance</h1>
      <TeamPerformanceTable />
      <TeamTopPerformersChart />
    </div>
  );
}
