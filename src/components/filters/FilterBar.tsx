'use client';

import { useQuery } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFilterState } from '@/hooks/use-filter-state';
import { DateFilter } from './DateFilter';
import { MultiSelectFilter, type SelectOption } from './MultiSelectFilter';
import { getTeamMembers, getTicketTypes } from '@/lib/actions/reference';
import { PRIORITY_OPTIONS } from '@/types/filters';
import type { FilterState } from '@/types/filters';

type FilterKey = keyof FilterState;

const FILTER_LABELS: Record<FilterKey, string> = {
  date: 'Date',
  teamMember: 'Team Member',
  ticketType: 'Ticket Type',
  priority: 'Priority',
};

const ALL_FILTER_KEYS: FilterKey[] = ['date', 'teamMember', 'ticketType', 'priority'];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FilterBar() {
  const { filters, setFilter, removeFilter, clearFilters } = useFilterState();

  const { data: teamMemberOptions = [] } = useQuery({
    queryKey: ['reference', 'teamMembers'],
    queryFn: () => getTeamMembers(),
    staleTime: 300_000,
  });

  const { data: ticketTypeOptions = [] } = useQuery({
    queryKey: ['reference', 'ticketTypes'],
    queryFn: () => getTicketTypes(),
    staleTime: 300_000,
  });

  const tmOptions: SelectOption[] = teamMemberOptions.map((m) => ({
    value: m.id,
    label: m.username,
  }));

  const ttOptions: SelectOption[] = ticketTypeOptions.map((t) => ({
    value: t.id,
    label: t.typeName,
  }));

  const priorityOptions: SelectOption[] = PRIORITY_OPTIONS.map((p) => ({
    value: p,
    label: p.charAt(0).toUpperCase() + p.slice(1),
  }));

  const activeKeys = ALL_FILTER_KEYS.filter((k) => filters[k] !== undefined);
  const inactiveKeys = ALL_FILTER_KEYS.filter((k) => filters[k] === undefined);

  function addFilter(key: FilterKey) {
    switch (key) {
      case 'date':
        setFilter('date', { operator: 'exact', value: todayStr() });
        break;
      case 'teamMember':
        setFilter('teamMember', { operator: 'isAnyOf', values: [] });
        break;
      case 'ticketType':
        setFilter('ticketType', { operator: 'isAnyOf', values: [] });
        break;
      case 'priority':
        setFilter('priority', { operator: 'isAnyOf', values: [] });
        break;
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeKeys.includes('date') && filters.date && (
        <DateFilter
          value={filters.date}
          onChange={(v) => setFilter('date', v)}
          onRemove={() => removeFilter('date')}
        />
      )}

      {activeKeys.includes('teamMember') && filters.teamMember && (
        <MultiSelectFilter
          label="Team Member"
          value={filters.teamMember}
          options={tmOptions}
          onChange={(v) => setFilter('teamMember', v)}
          onRemove={() => removeFilter('teamMember')}
        />
      )}

      {activeKeys.includes('ticketType') && filters.ticketType && (
        <MultiSelectFilter
          label="Ticket Type"
          value={filters.ticketType}
          options={ttOptions}
          onChange={(v) => setFilter('ticketType', v)}
          onRemove={() => removeFilter('ticketType')}
        />
      )}

      {activeKeys.includes('priority') && filters.priority && (
        <MultiSelectFilter
          label="Priority"
          value={filters.priority}
          options={priorityOptions}
          onChange={(v) => setFilter('priority', v)}
          onRemove={() => removeFilter('priority')}
        />
      )}

      {inactiveKeys.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {inactiveKeys.map((key) => (
              <DropdownMenuItem key={key} onSelect={() => addFilter(key)}>
                {FILTER_LABELS[key]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {activeKeys.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-7 px-2"
          onClick={clearFilters}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Clear all
        </Button>
      )}
    </div>
  );
}
