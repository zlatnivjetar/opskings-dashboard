import { TeamTopPerformersChart } from '@/components/dashboard/TeamTopPerformersChart';
import { getTeamPerformance } from '@/lib/queries/team';
import type { FilterState } from '@/types/filters';

export async function TeamLeaderboardSectionServer({ filters }: { filters: FilterState }) {
  const rows = await getTeamPerformance(filters);

  return <TeamTopPerformersChart data={rows} />;
}
