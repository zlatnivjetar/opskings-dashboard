import { KpiCard } from '@/components/dashboard/KpiCard';
import { formatCompact, formatHours } from '@/lib/format';
import { getTeamPerformanceSummary } from '@/lib/queries/team';
import type { FilterState } from '@/types/filters';

export async function TeamSummarySectionServer({ filters }: { filters: FilterState }) {
  const summary = await getTeamPerformanceSummary(filters);
  const activePct =
    summary.totalMembers > 0
      ? `${((summary.activeMembers / summary.totalMembers) * 100).toFixed(1)}% active`
      : '0% active';

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="TEAM MEMBERS"
        value={formatCompact(summary.totalMembers)}
        subtitle={activePct}
      />
      <KpiCard
        label="ACTIVE MEMBERS"
        value={formatCompact(summary.activeMembers)}
        subtitle="Current available roster"
        delay={0.05}
      />
      <KpiCard
        label="RESOLVED TICKETS"
        value={formatCompact(summary.resolvedTickets)}
        subtitle="Within the selected filters"
        delay={0.1}
      />
      <KpiCard
        label="AVERAGE RESOLUTION"
        value={summary.avgResolutionHours != null ? formatHours(summary.avgResolutionHours) : '--'}
        subtitle={
          summary.avgRating != null ? `${summary.avgRating.toFixed(1)} / 5 average rating` : 'No ratings yet'
        }
        positiveIsGood={false}
        delay={0.15}
      />
    </div>
  );
}
