'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { useFilterState } from '@/hooks/use-filter-state';
import { serializeFilters } from '@/lib/api/filter-state';
import { fetchJson } from '@/lib/fetch-json';
import { formatCompact, formatHours } from '@/lib/format';
import type { ResponseTimeOverview } from '@/lib/queries/response-time';

export function ResponseTimeOverviewCards() {
  const { filters } = useFilterState();
  const filterParam = useMemo(() => serializeFilters(filters), [filters]);

  const overviewQuery = useQuery({
    queryKey: ['response-time', 'overview', filters],
    queryFn: () =>
      fetchJson<ResponseTimeOverview>(`/api/response-time/overview?filters=${filterParam}`),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });

  const summary = overviewQuery.data?.summary;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        label="RESOLVED TICKETS"
        value={summary ? formatCompact(summary.resolvedCount) : '--'}
        subtitle="In selected period"
      />
      <KpiCard
        label="MEDIAN RESOLUTION"
        value={summary?.medianHours != null ? formatHours(summary.medianHours) : '--'}
        subtitle="50th percentile"
        positiveIsGood={false}
      />
      <KpiCard
        label="AVG RESOLUTION TIME"
        value={summary?.avgHours != null ? formatHours(summary.avgHours) : '--'}
        subtitle="Resolved tickets only"
        positiveIsGood={false}
      />
      <KpiCard
        label="HISTOGRAM BINS"
        value={overviewQuery.data ? formatCompact(overviewQuery.data.histogram.length) : '--'}
        subtitle="Resolution ranges loaded"
      />
    </div>
  );
}
