'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouteSearchParams } from '@/hooks/use-route-search-params';
import {
  TEAM_TABLE_PAGE_PARAM,
  type SortOrder,
  type TeamTableSort,
  type TeamTableState,
} from '@/lib/dashboard-route-state';

type TeamControlsDraft = Pick<
  TeamTableState,
  'department' | 'query' | 'sortBy' | 'sortOrder' | 'status'
>;

const DEFAULT_DRAFT: TeamControlsDraft = {
  query: '',
  department: '',
  status: '',
  sortBy: 'username',
  sortOrder: 'asc',
};

const SORT_OPTIONS: { label: string; value: TeamTableSort }[] = [
  { label: 'Name', value: 'username' },
  { label: 'Department', value: 'department' },
  { label: 'Status', value: 'status' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Avg Time', value: 'avgResolutionHours' },
  { label: 'Avg Rating', value: 'avgRating' },
];

const DIRECTION_OPTIONS: { label: string; value: SortOrder }[] = [
  { label: 'Ascending', value: 'asc' },
  { label: 'Descending', value: 'desc' },
];

export function TeamPerformanceTableControls({
  departmentOptions,
  initialState,
  statusOptions,
}: {
  departmentOptions: string[];
  initialState: TeamTableState;
  statusOptions: string[];
}) {
  const { isPending, replaceParams } = useRouteSearchParams();
  const [draft, setDraft] = useState<TeamControlsDraft>({
    query: initialState.query,
    department: initialState.department,
    status: initialState.status,
    sortBy: initialState.sortBy,
    sortOrder: initialState.sortOrder,
  });

  const applyFilters = () => {
    replaceParams(
      {
        team_q: draft.query || null,
        team_department: draft.department || null,
        team_status: draft.status || null,
        team_sort: draft.sortBy === DEFAULT_DRAFT.sortBy ? null : draft.sortBy,
        team_dir: draft.sortOrder === DEFAULT_DRAFT.sortOrder ? null : draft.sortOrder,
        [TEAM_TABLE_PAGE_PARAM]: null,
      },
      {
        clearKeys: [TEAM_TABLE_PAGE_PARAM],
      },
    );
  };

  const resetFilters = () => {
    setDraft(DEFAULT_DRAFT);
    replaceParams({
      team_q: null,
      team_department: null,
      team_status: null,
      team_sort: null,
      team_dir: null,
      [TEAM_TABLE_PAGE_PARAM]: null,
    });
  };

  return (
    <form
      className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        applyFilters();
      }}
    >
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="team-query">
          Search
        </label>
        <Input
          id="team-query"
          value={draft.query}
          onChange={(event) => setDraft((current) => ({ ...current, query: event.target.value }))}
          placeholder="Name or department"
          className="h-9 w-full min-w-56 lg:w-64"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="team-department">
          Department
        </label>
        <select
          id="team-department"
          className="h-9 min-w-40 rounded-md border bg-background px-3 text-sm"
          value={draft.department}
          onChange={(event) =>
            setDraft((current) => ({ ...current, department: event.target.value }))
          }
        >
          <option value="">All departments</option>
          {departmentOptions.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="team-status">
          Status
        </label>
        <select
          id="team-status"
          className="h-9 min-w-36 rounded-md border bg-background px-3 text-sm"
          value={draft.status}
          onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
        >
          <option value="">All statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="team-sort">
          Sort By
        </label>
        <select
          id="team-sort"
          className="h-9 min-w-36 rounded-md border bg-background px-3 text-sm"
          value={draft.sortBy}
          onChange={(event) =>
            setDraft((current) => ({ ...current, sortBy: event.target.value as TeamTableSort }))
          }
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="team-direction">
          Direction
        </label>
        <select
          id="team-direction"
          className="h-9 min-w-36 rounded-md border bg-background px-3 text-sm"
          value={draft.sortOrder}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              sortOrder: event.target.value as SortOrder,
            }))
          }
        >
          {DIRECTION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 lg:ml-auto">
        <Button type="submit" size="sm" disabled={isPending}>
          Apply
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={resetFilters} disabled={isPending}>
          Reset
        </Button>
      </div>
    </form>
  );
}
