'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFilterState } from '@/hooks/use-filter-state';
import { DateFilter } from './DateFilter';
import { MultiSelectFilter, type SelectOption } from './MultiSelectFilter';
import { getReferenceData } from '@/lib/actions/reference';
import { PRIORITY_OPTIONS } from '@/types/filters';
import type { FilterState } from '@/types/filters';
import { formatUsername } from '@/lib/format';

type FilterKey = keyof FilterState;

const ALL_FILTER_KEYS: FilterKey[] = ['date', 'teamMember', 'ticketType', 'priority'];

export function FilterBar({
  allowedFilters,
  actions,
}: {
  allowedFilters?: FilterKey[];
  actions?: React.ReactNode;
}) {
  const { filters, setFilter, removeFilter, clearFilters } = useFilterState();
  const allowedKeys = allowedFilters ?? ALL_FILTER_KEYS;

  const { data: refData } = useQuery({
    queryKey: ['reference', 'all'],
    queryFn: () => getReferenceData(),
    staleTime: 300_000,
  });

  const tmOptions: SelectOption[] = (refData?.teamMembers ?? []).map((m) => ({
    value: m.id,
    label: formatUsername(m.username),
  }));

  const ttOptions: SelectOption[] = (refData?.ticketTypes ?? []).map((t) => ({
    value: t.id,
    label: t.typeName,
  }));

  const priorityOptions: SelectOption[] = PRIORITY_OPTIONS.map((p) => ({
    value: p,
    label: p.charAt(0).toUpperCase() + p.slice(1),
  }));

  const hasAnyFilter =
    (allowedKeys.includes('date') && !!filters.date) ||
    (allowedKeys.includes('teamMember') && (filters.teamMember?.values.length ?? 0) > 0) ||
    (allowedKeys.includes('ticketType') && (filters.ticketType?.values.length ?? 0) > 0) ||
    (allowedKeys.includes('priority') && (filters.priority?.values.length ?? 0) > 0);

  const showDateDivider =
    allowedKeys.includes('date') &&
    (allowedKeys.includes('teamMember') ||
      allowedKeys.includes('ticketType') ||
      allowedKeys.includes('priority'));

  return (
    <div className="bg-card border rounded-lg shadow-sm p-3 flex items-center gap-3 flex-wrap">
      {allowedKeys.includes('date') && (
        <DateFilter
          value={filters.date}
          onChange={(v) => setFilter('date', v)}
          onClear={() => removeFilter('date')}
        />
      )}

      {showDateDivider && (
        <div className="h-6 w-px bg-border shrink-0" aria-hidden="true" />
      )}

      {allowedKeys.includes('teamMember') && (
        <MultiSelectFilter
          label="Assignees"
          placeholder="Assignees..."
          value={filters.teamMember}
          options={tmOptions}
          onChange={(v) => setFilter('teamMember', v)}
          onClear={() => removeFilter('teamMember')}
        />
      )}

      {allowedKeys.includes('ticketType') && (
        <MultiSelectFilter
          label="Types"
          placeholder="Ticket types..."
          value={filters.ticketType}
          options={ttOptions}
          onChange={(v) => setFilter('ticketType', v)}
          onClear={() => removeFilter('ticketType')}
        />
      )}

      {allowedKeys.includes('priority') && (
        <MultiSelectFilter
          label="Priority"
          placeholder="Priorities..."
          value={filters.priority}
          options={priorityOptions}
          onChange={(v) => setFilter('priority', v)}
          onClear={() => removeFilter('priority')}
        />
      )}

      {(hasAnyFilter || actions) && (
        <div className="ml-auto flex items-center gap-2">
          {hasAnyFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}
