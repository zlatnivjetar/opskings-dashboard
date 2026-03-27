'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { useFilterState } from '@/hooks/use-filter-state';
import { serializeFilters } from '@/lib/api/filter-state';
import { formatCompact, formatHours } from '@/lib/format';
import { fetchJson } from '@/lib/fetch-json';
import type { DashboardSummary } from '@/lib/queries/dashboard';

function computeTrend(
  current: number,
  previous: number | undefined | null,
): { value: number; label: string } | undefined {
  if (previous == null || previous === 0) {
    return undefined;
  }

  return {
    value: ((current - previous) / previous) * 100,
    label: 'vs prev period',
  };
}

export function DashboardSummaryCards() {
  const { filters } = useFilterState();
  const filterParam = useMemo(() => serializeFilters(filters), [filters]);

  const summaryQuery = useQuery({
    queryKey: ['dashboard', 'summary', filters],
    queryFn: () =>
      fetchJson<{ summary: DashboardSummary; previousSummary: DashboardSummary | null }>(
        `/api/dashboard/summary?filters=${filterParam}`,
      ),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });

  const summary = summaryQuery.data?.summary;
  const previous = summaryQuery.data?.previousSummary;

  const openPct =
    summary && summary.totalTickets > 0
      ? `${((summary.openTickets / summary.totalTickets) * 100).toFixed(1)}% not resolved`
      : '0% not resolved';

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        label="TOTAL TICKETS"
        value={summary ? formatCompact(summary.totalTickets) : '--'}
        subtitle="All tickets in period"
        trend={summary ? computeTrend(summary.totalTickets, previous?.totalTickets) : undefined}
        delay={0}
      />
      <KpiCard
        label="OPEN TICKETS"
        value={summary ? formatCompact(summary.openTickets) : '--'}
        subtitle={openPct}
        trend={summary ? computeTrend(summary.openTickets, previous?.openTickets) : undefined}
        positiveIsGood={false}
        delay={0.05}
      />
      <KpiCard
        label="AVG RESOLUTION TIME"
        value={summary?.avgResolutionHours != null ? formatHours(summary.avgResolutionHours) : '--'}
        subtitle="Resolved tickets only"
        trend={
          summary?.avgResolutionHours != null && previous?.avgResolutionHours != null
            ? computeTrend(summary.avgResolutionHours, previous.avgResolutionHours)
            : undefined
        }
        positiveIsGood={false}
        delay={0.1}
      />
      <KpiCard
        label="CUSTOMER SATISFACTION"
        value={summary?.avgRating != null ? `${summary.avgRating.toFixed(1)} / 5` : '--'}
        subtitle={
          summary?.avgRating != null
            ? `${summary.avgRating.toFixed(1)} average score`
            : undefined
        }
        trend={
          summary?.avgRating != null && previous?.avgRating != null
            ? computeTrend(summary.avgRating, previous.avgRating)
            : undefined
        }
        delay={0.15}
      />
    </div>
  );
}
