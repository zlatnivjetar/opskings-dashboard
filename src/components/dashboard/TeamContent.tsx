'use client';

import { Suspense, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FilterBar } from '@/components/filters/FilterBar';
import { TeamPerformanceTable } from '@/components/dashboard/TeamPerformanceTable';
import { TeamTopPerformersChart } from '@/components/dashboard/TeamTopPerformersChart';
import { useFilterState } from '@/hooks/use-filter-state';
import { serializeFilters } from '@/lib/api/filter-state';
import type { TeamPerformanceRow } from '@/lib/queries/team';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

function Inner() {
  const { filters } = useFilterState();
  const filterParam = useMemo(() => serializeFilters(filters), [filters]);

  const performanceQuery = useQuery({
    queryKey: ['team', 'performance', filters],
    queryFn: () => getJson<TeamPerformanceRow[]>(`/api/team/performance?filters=${filterParam}`),
    staleTime: 30_000,
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-4">Team Performance</h1>
        <Suspense>
          <FilterBar />
        </Suspense>
      </div>
      <TeamPerformanceTable data={performanceQuery.data} isLoading={performanceQuery.isLoading} />
      <TeamTopPerformersChart data={performanceQuery.data} isLoading={performanceQuery.isLoading} />
    </div>
  );
}

export function TeamContent() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
